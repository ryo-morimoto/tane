# Design: oauth

## Architecture

tane becomes a dual-role OAuth system: an **OAuth 2.1 server** to MCP clients and an **OAuth client** to GitHub. Three layers compose the stack:

```
┌──────────────────────────────────────────────────────────────┐
│  OAuthProvider  (@cloudflare/workers-oauth-provider)         │
│  Default Worker export. Intercepts OAuth endpoints,          │
│  manages tokens, encrypts grant props, delegates the rest.   │
│                                                              │
│  /.well-known/*  →  auto-served (PRM + AS metadata)          │
│  /authorize      →  defaultHandler (GitHub OAuth flow)       │
│  /token          →  auto-served (code/refresh exchange)      │
│  /register       →  auto-served (DCR)                        │
│  /revoke         →  auto-served (token revocation)           │
│  /mcp            →  apiHandler (authenticated MCP requests)  │
│  /*              →  defaultHandler (health, etc.)            │
└──────────────────────────────────────────────────────────────┘
         │ apiHandler                    │ defaultHandler
         ▼                               ▼
┌─────────────────────┐    ┌──────────────────────────────────┐
│  TaneMcpSession     │    │  GitHubHandler (Hono app)        │
│  (Durable Object)   │    │                                  │
│                     │    │  GET /authorize → GitHub OAuth    │
│  Hono + @hono/mcp   │    │  GET /callback  → exchange code, │
│  StreamableHTTP     │    │                   completeAuth() │
│  Transport          │    │  GET /health    → { status: ok } │
│                     │    │                                  │
│  McpServer +        │    │  Renders approval dialog for     │
│  registered tools   │    │  new clients (optional).         │
│                     │    │                                  │
│  Props: { login,    │    │  Uses env.OAUTH_PROVIDER helpers │
│    accessToken }    │    │  for state management.           │
└─────────────────────┘    └──────────────────────────────────┘
         │                               │
         ▼                               ▼
┌──────────────────────────────────────────────────────────────┐
│  github.ts  (unchanged)                                      │
│  gh(), createRepoConfig(), ensureRepo(), file CRUD           │
│  core.ts, markdown.ts, schema.ts  (unchanged)                │
└──────────────────────────────────────────────────────────────┘
```

## Data flow

### Authorization (one-time per user per client)

```
MCP Client                  tane (Worker)                GitHub
    │                           │                          │
    ├─ GET /mcp (no token) ────►│                          │
    │◄── 401 + WWW-Authenticate─┤                          │
    │                           │                          │
    ├─ GET /.well-known/       ─►│ (auto-served by         │
    │   oauth-protected-resource │  OAuthProvider)          │
    │◄── PRM JSON ──────────────┤                          │
    │                           │                          │
    ├─ GET /.well-known/       ─►│                          │
    │   oauth-authorization-     │                          │
    │   server                   │                          │
    │◄── AS metadata JSON ──────┤                          │
    │                           │                          │
    ├─ POST /register ─────────►│                          │
    │◄── { client_id, ... } ────┤                          │
    │                           │                          │
    ├─ GET /authorize ─────────►│                          │
    │   ?code_challenge=...     │                          │
    │   &resource=.../mcp       │                          │
    │                           ├─ 302 to github.com/      │
    │   (browser redirect)      │   login/oauth/authorize ►│
    │                           │                          │
    │                           │◄── /callback?code=... ───┤
    │                           │                          │
    │                           ├─ POST /login/oauth/      │
    │                           │   access_token ─────────►│
    │                           │◄── { ghu_xxx } ──────────┤
    │                           │                          │
    │                           ├─ GET /user ─────────────►│
    │                           │◄── { login } ────────────┤
    │                           │                          │
    │                           │ completeAuthorization()   │
    │                           │ props = { login,          │
    │                           │   accessToken: ghu_xxx }  │
    │                           │                          │
    │◄── 302 ?code=TANE_CODE ──┤                          │
    │                           │                          │
    ├─ POST /token             ─►│ (auto-served)           │
    │   code + code_verifier    │                          │
    │◄── { access_token,        │                          │
    │      refresh_token } ─────┤                          │
```

### MCP request (every tool call)

```
MCP Client                  tane (Worker)         Durable Object        GitHub
    │                           │                      │                  │
    ├─ POST /mcp ──────────────►│                      │                  │
    │   Authorization: Bearer   │                      │                  │
    │   <tane-token>            │                      │                  │
    │                           │ OAuthProvider         │                  │
    │                           │ validates token       │                  │
    │                           │ decrypts props        │                  │
    │                           │                      │                  │
    │                           ├─ stub.fetch(req) ───►│                  │
    │                           │   + X-Grant-Props     │                  │
    │                           │                      │                  │
    │                           │                      │ McpServer         │
    │                           │                      │ processes tool    │
    │                           │                      │                  │
    │                           │                      ├─ GitHub API ────►│
    │                           │                      │   Bearer ghu_xxx │
    │                           │                      │◄── response ─────┤
    │                           │                      │                  │
    │                           │◄── MCP response ─────┤                  │
    │◄── MCP response ─────────┤                      │                  │
```

## File changes

### New files

| File | Purpose |
|---|---|
| `src/github-handler.ts` | Hono app: GitHub OAuth flow (`/authorize`, `/callback`) and `/health` |
| `src/mcp-session.ts` | `TaneMcpSession` Durable Object: Hono + @hono/mcp transport, McpServer with tools |

### Modified files

| File | Changes |
|---|---|
| `src/index.ts` | Rewritten. `OAuthProvider` default export + `TaneMcpSession` DO re-export. apiHandler routes authenticated `/mcp` requests to DO. |
| `src/mcp.ts` | Rewritten. Exports `createMcpServer(props, env)` factory that registers tools against given grant props. No longer handles auth or transport. |
| `src/format-error.ts` | Update `{origin}/auth/github` → `{origin}/authorize` in the 401 error message. |
| `wrangler.toml` | Add KV namespace, Durable Object binding, migration tag. |
| `package.json` | Add hono, @hono/mcp, @cloudflare/workers-oauth-provider. |

### Unchanged files

| File | Why unchanged |
|---|---|
| `src/core.ts` | Business logic takes `RepoConfig`, no auth dependency |
| `src/github.ts` | GitHub API wrapper. `getUser()` still used during authorization callback. File CRUD unchanged. |
| `src/markdown.ts` | Pure serialization |
| `src/schema.ts` | Pure validation |

### Deleted files

| File | Replaced by |
|---|---|
| `src/auth.ts` | `src/github-handler.ts` (OAuth flow) + `workers-oauth-provider` (token management) |

## Key design decisions

### 1. OAuthProvider as the outer wrapper (not Hono middleware)

`@cloudflare/workers-oauth-provider` expects to be the Worker's default export. It intercepts OAuth routes (`/authorize`, `/token`, `/register`, `/.well-known/*`) before they reach application code. This is not middleware — it's a wrapper.

Hono runs inside as the `defaultHandler` (for the GitHub OAuth UI and health check) and inside the Durable Object (for MCP transport). This means there is no single Hono app that owns all routes. Instead:

- **GitHubHandler** (Hono): handles `/authorize`, `/callback`, `/health`
- **TaneMcpSession** (Hono inside DO): handles `/mcp`
- **OAuthProvider**: handles `/token`, `/register`, `/.well-known/*`, `/revoke`

### 2. Durable Object for MCP sessions

Each MCP session maps to a `TaneMcpSession` Durable Object instance. The DO name is derived from the session ID (from `Mcp-Session-Id` header). This gives us:

- **Session persistence**: MCP state survives across HTTP requests
- **Isolation**: each session has its own McpServer instance
- **Scalability**: DOs are distributed across Cloudflare's edge

The apiHandler in `index.ts` routes to the DO:

```typescript
async function apiHandler(req: Request, env: Env, ctx: ExecutionContext, props: GrantProps) {
  const sessionId = req.headers.get("mcp-session-id");
  const doId = sessionId
    ? env.MCP_SESSION.idFromName(sessionId)
    : env.MCP_SESSION.newUniqueId();
  const stub = env.MCP_SESSION.get(doId);

  // Pass grant props to DO via header (internal only, never exposed externally)
  const forwarded = new Request(req.url, req);
  forwarded.headers.set("x-grant-props", JSON.stringify(props));
  return stub.fetch(forwarded);
}
```

### 3. Grant props carry the upstream token

When authorization completes, `completeAuthorization()` stores:

```typescript
{
  login: "octocat",           // GitHub username
  accessToken: "ghu_abc123"   // GitHub OAuth token
}
```

These are encrypted at rest by `workers-oauth-provider` using `COOKIE_ENCRYPTION_KEY`. On each authenticated MCP request, the provider decrypts the props and passes them to the apiHandler.

The MCP tools use `login` + `accessToken` to construct a `RepoConfig`:

```typescript
const config = createRepoConfig(props.accessToken, props.login);
```

This eliminates the per-request `GET /user` call. The login was resolved once during authorization.

### 4. @hono/mcp StreamableHTTPTransport inside the DO

Inside the Durable Object, a Hono app uses `StreamableHTTPTransport` from `@hono/mcp`:

```typescript
export class TaneMcpSession implements DurableObject {
  private app: Hono;
  private transport: StreamableHTTPTransport;
  private server: McpServer;

  constructor(state: DurableObjectState, env: Env) {
    this.server = new McpServer({ name: "tane", version: "0.1.0" });
    this.transport = new StreamableHTTPTransport();
    this.app = new Hono();
    this.app.all("/mcp", (c) => this.transport.handleRequest(c));
  }

  async fetch(request: Request): Promise<Response> {
    const propsHeader = request.headers.get("x-grant-props");
    if (propsHeader && !this.initialized) {
      const props = JSON.parse(propsHeader) as GrantProps;
      registerTools(this.server, props, this.env);
      await this.server.connect(this.transport);
      this.initialized = true;
    }
    return this.app.fetch(request);
  }
}
```

### 5. GitHub callback flow

The GitHub handler in `github-handler.ts` follows the Cloudflare reference pattern:

1. `GET /authorize`: OAuthProvider calls `defaultHandler` with the authorize request
   - Parse OAuth request via `env.OAUTH_PROVIDER.parseAuthRequest()`
   - Store session state in KV (via OAuth provider helper or cookie)
   - Redirect to `https://github.com/login/oauth/authorize?client_id=...&state=...&scope=repo`

2. `GET /callback`: GitHub redirects back
   - Validate state
   - Exchange code for `ghu_` token (POST `github.com/login/oauth/access_token`)
   - Fetch user identity (GET `api.github.com/user`)
   - Call `env.OAUTH_PROVIDER.completeAuthorization({ login, accessToken })`
   - Provider issues authorization code and redirects to MCP client

### 6. No consent dialog (auto-approve)

The Cloudflare reference shows an approval dialog where users confirm granting access to the MCP client. For tane, this is unnecessary complexity at this stage:

- tane has a single scope (`mcp:tools`) that grants access to all tools
- The GitHub login page already serves as the consent step
- Auto-approve on first authorization; mark client as approved in a cookie

This can be revisited later if granular scopes are added.

## Env / bindings

```toml
# wrangler.toml

name = "tane"
main = "src/index.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

routes = [
  { pattern = "tane.ryo-o.dev", custom_domain = true },
]

[vars]
GITHUB_APP_SLUG = "tane-app"

[[kv_namespaces]]
binding = "OAUTH_KV"
id = "<created-via-wrangler>"

[[durable_objects.bindings]]
name = "MCP_SESSION"
class_name = "TaneMcpSession"

[[migrations]]
tag = "v1"
new_classes = ["TaneMcpSession"]
```

Secrets (via `wrangler secret put`):
- `GITHUB_CLIENT_ID` — retained
- `GITHUB_CLIENT_SECRET` — retained
- `COOKIE_ENCRYPTION_KEY` — new (generate via `openssl rand -hex 32`)

## Dependencies (after)

```json
{
  "dependencies": {
    "@cloudflare/workers-oauth-provider": "^0.2.2",
    "@hono/mcp": "^0.2.3",
    "@modelcontextprotocol/sdk": "^1.26.0",
    "hono": "^4.11.9",
    "yaml": "^2.7.1",
    "zod": "^3.24.4"
  }
}
```

New: `hono`, `@hono/mcp`, `@cloudflare/workers-oauth-provider` (3 additions).
Removed: none. MCP SDK retained for `McpServer` and tool registration.

## Test strategy

- **Unit tests** for `github-handler.ts`: mock GitHub OAuth endpoints, verify redirect chain and `completeAuthorization()` call
- **Unit tests** for `mcp-session.ts`: mock grant props, verify tool registration and transport handling
- **Unit tests** for `format-error.ts`: verify updated URL in 401 message
- **Existing tests** for `core.ts`, `github.ts`, `markdown.ts`: unchanged (no auth dependency)
- **Integration test** (manual): deploy to staging, connect with Claude Desktop or VS Code, verify full OAuth flow
