# Proposal: oauth

## Motivation

tane currently uses a custom, non-standard GitHub OAuth flow:

1. User visits `/auth/github` → redirected to GitHub App install + OAuth
2. `/auth/callback` exchanges the code and renders an HTML page displaying a raw `ghu_` token
3. User manually copies the token into their MCP client config
4. Every MCP request validates the token by calling GitHub's `GET /user` API

This approach has three problems:

- **No MCP client can auto-authenticate.** Claude Desktop, VS Code, Cursor, and other MCP clients implement the [MCP Authorization specification](https://modelcontextprotocol.io/specification/latest/basic/authorization) (OAuth 2.1 with PKCE, Protected Resource Metadata, Authorization Server Metadata discovery). tane doesn't speak this protocol, so users must manually copy-paste tokens.
- **Per-request GitHub API call.** Every MCP request hits `GET /user` to validate the token. This adds latency and is subject to GitHub rate limits.
- **No session management.** Tokens are stateless from tane's perspective. No refresh, no revocation, no expiry tracking.

## Solution

Make tane a spec-compliant MCP OAuth 2.1 authorization server by adopting three new dependencies:

| Dependency | Purpose |
|---|---|
| **[hono](https://hono.dev/)** | Web framework for Cloudflare Workers (replaces hand-rolled `fetch` router) |
| **[@hono/mcp](https://jsr.io/@hono/mcp)** | MCP transport + auth middleware for Hono (StreamableHTTPTransport, mcpAuthRouter, bearerAuth) |
| **[@cloudflare/workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider)** | OAuth 2.1 provider library for Workers (token lifecycle, PKCE, RFC 8414 metadata, RFC 7591 DCR) |

The architecture follows [Cloudflare's recommended MCP pattern](https://developers.cloudflare.com/agents/model-context-protocol/authorization/): tane acts as both an **OAuth 2.1 server** (to MCP clients) and an **OAuth client** (to GitHub). The `workers-oauth-provider` handles the spec-compliant token management while tane delegates user identity to GitHub.

### What changes

| Current | After |
|---|---|
| Hand-rolled `fetch` router in `index.ts` | Hono app with typed routes |
| `WebStandardStreamableHTTPServerTransport` from MCP SDK | `StreamableHTTPTransport` from `@hono/mcp` |
| Custom `/auth/github` + `/auth/callback` | `OAuthProvider` wrapping the Hono app with `/authorize`, `/token`, `/register` endpoints |
| Raw `ghu_` token displayed on HTML page | MCP clients receive tokens automatically via standard OAuth flow |
| `GET /user` on every request for token validation | Token introspection via `workers-oauth-provider` (tokens are tane-issued, not GitHub tokens) |
| No session state | Durable Objects for MCP session persistence |
| Wrangler vars only | + KV namespace (`OAUTH_KV`) + Durable Object binding |

### Auth flow (after)

```
MCP Client → GET /mcp (no token)
         ← 401 + WWW-Authenticate: Bearer resource_metadata="/.well-known/oauth-protected-resource"

Client → GET /.well-known/oauth-protected-resource
       ← { resource, authorization_servers: ["https://tane.ryo-o.dev"], scopes_supported: ["mcp:tools"] }

Client → GET /.well-known/oauth-authorization-server
       ← { issuer, authorization_endpoint, token_endpoint, registration_endpoint, ... }

Client → POST /register (Dynamic Client Registration)
       ← { client_id, client_secret }

Client → GET /authorize?response_type=code&code_challenge=...&resource=...
       → tane redirects to GitHub OAuth (login + App install)
       → GitHub callback → tane exchanges code for ghu_ token, resolves user identity
       → tane issues its own authorization code → redirects to client callback

Client → POST /token (code + code_verifier)
       ← { access_token (tane-issued), refresh_token, expires_in }

Client → POST /mcp + Authorization: Bearer <tane-token>
       → tane validates token locally (no GitHub API call)
       → uses stored ghu_ token for GitHub API operations
```

## Scope

- Replace hand-rolled router with Hono
- Replace MCP SDK transport with `@hono/mcp` StreamableHTTPTransport
- Integrate `@cloudflare/workers-oauth-provider` as the OAuth 2.1 layer
- Implement GitHub OAuth handler (authorize → GitHub login → callback → complete authorization)
- Serve Protected Resource Metadata (`/.well-known/oauth-protected-resource`)
- Serve Authorization Server Metadata (`/.well-known/oauth-authorization-server`)
- Add KV namespace (`OAUTH_KV`) for OAuth provider storage
- Add Durable Object for MCP session state
- Update `wrangler.toml` with KV and Durable Object bindings
- Remove legacy `/auth/github` and `/auth/callback` endpoints
- Remove per-request `GET /user` validation (replaced by local token validation)
- Keep `/health` endpoint
- Update tests

## Trade-offs

- **Three new dependencies** (hono, @hono/mcp, @cloudflare/workers-oauth-provider). This is a meaningful increase from the current three (MCP SDK, yaml, zod). However, all three are well-maintained, purpose-built for this exact use case, and replace substantial custom code. Hono is effectively the standard web framework for Cloudflare Workers. The OAuth provider library is Cloudflare's own, reviewed for RFC compliance.
- **Durable Objects add operational complexity.** The current stateless design is simpler. But MCP session persistence is necessary for spec compliance, and Durable Objects are the native Cloudflare primitive for this.
- **`ghu_` tokens are stored server-side.** tane issues its own tokens to MCP clients and stores the upstream GitHub token encrypted. This is a security improvement (clients never see the GitHub token) but means tane holds sensitive state.
- **Legacy flow removed.** Users who currently copy-paste tokens will need to re-authenticate via their MCP client's OAuth flow. This is intentional — the manual flow was a stopgap.
