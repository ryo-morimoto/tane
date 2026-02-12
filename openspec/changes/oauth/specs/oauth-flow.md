# OAuth 2.1 Authorization Flow

Implement spec-compliant OAuth 2.1 authorization with GitHub as the upstream identity provider. tane acts as both an OAuth server (to MCP clients) and an OAuth client (to GitHub).

## Current state

- `/auth/github` redirects to GitHub App install page with a CSRF state cookie
- `/auth/callback` exchanges GitHub's authorization code for a `ghu_` token and displays it on an HTML page
- User manually copies the token into their MCP client configuration
- No PKCE, no dynamic client registration, no standard OAuth endpoints

## Target state

- `OAuthProvider` from `@cloudflare/workers-oauth-provider` wraps the Hono app
- Standard OAuth 2.1 endpoints: `/authorize`, `/token`, `/register`
- `/authorize` delegates to GitHub for user authentication, then issues tane's own authorization code
- `/token` exchanges tane authorization codes for tane-issued access tokens
- `/register` supports RFC 7591 Dynamic Client Registration
- PKCE (S256) enforced on all authorization flows
- MCP clients complete the entire flow automatically — no manual token copy

## Authorization endpoint (`/authorize`)

### Scenarios

- MCP client sends `GET /authorize?response_type=code&client_id=...&redirect_uri=...&code_challenge=...&code_challenge_method=S256&state=...&scope=mcp:tools&resource=https://tane.ryo-o.dev/mcp`
  - tane stores the OAuth request parameters (client_id, redirect_uri, code_challenge, state, scope) in KV keyed by a session identifier
  - tane redirects to GitHub OAuth: `https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={origin}/callback&state={session_id}&scope=repo`
- GitHub authenticates the user → redirects to `{origin}/callback?code=...&state=...`
  - tane exchanges GitHub's code for a `ghu_` token via `POST https://github.com/login/oauth/access_token`
  - tane fetches user identity via `GET https://api.github.com/user` using the `ghu_` token
  - tane calls `completeAuthorization()` on the OAuth provider, passing user identity and `ghu_` token as grant props
  - OAuth provider issues an authorization code and redirects to the MCP client's `redirect_uri` with `code` and `state`
- If GitHub OAuth fails (user denies, invalid code) → redirect to client's `redirect_uri` with `error=access_denied`

## Token endpoint (`/token`)

### Scenarios

- MCP client sends `POST /token` with `grant_type=authorization_code&code=...&code_verifier=...&client_id=...&redirect_uri=...&resource=...`
  - `workers-oauth-provider` validates PKCE (code_verifier against stored code_challenge)
  - Returns `{ access_token, token_type: "Bearer", expires_in, refresh_token, scope: "mcp:tools" }`
- MCP client sends `POST /token` with `grant_type=refresh_token&refresh_token=...&client_id=...`
  - Returns new access_token + rotated refresh_token
  - Previous refresh token is invalidated (with grace window per OAuth 2.1)
- Invalid code or code_verifier → `{ error: "invalid_grant" }` (400)
- Expired code → `{ error: "invalid_grant" }` (400)
- Unknown client_id → `{ error: "invalid_client" }` (401)

## Client registration endpoint (`/register`)

### Scenarios

- MCP client sends `POST /register` with `{ client_name, redirect_uris, grant_types: ["authorization_code", "refresh_token"], response_types: ["code"] }`
  - Returns `{ client_id, client_secret (if confidential), client_id_issued_at }`
- Invalid redirect_uris → `{ error: "invalid_redirect_uri" }` (400)

## GitHub callback (`/callback`)

### Scenarios

- GitHub redirects to `/callback?code=...&state=...`
  - tane validates state against KV-stored session
  - Exchanges code for `ghu_` token
  - Fetches `GET https://api.github.com/user` (with `User-Agent: tane/0.1.0`)
  - Stores `{ login, ghu_token }` as encrypted grant props
  - Completes authorization → redirects to MCP client
- Missing or invalid state → error page (no redirect to client, as client identity is unknown)
- GitHub code exchange fails → redirects to client with `error=server_error`

## Env changes

- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: retained (now used for upstream GitHub OAuth)
- `GITHUB_APP_SLUG`: retained (for error message URLs)
- `COOKIE_ENCRYPTION_KEY`: new secret (used by `workers-oauth-provider` for cookie encryption)
- `OAUTH_KV`: new KV namespace binding

## Endpoints removed

- `/auth/github` — replaced by `/authorize`
- `/auth/callback` — replaced by `/callback` (internal, not user-facing)
