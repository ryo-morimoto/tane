# Auth

## OAuth Web Flow

### Security Parameters

- **`state`**: Random string for CSRF protection
  - Generated with `crypto.getRandomValues()` (Web Crypto API, available on Workers)
  - 32 bytes, hex-encoded (64 characters)
  - Stored as `HttpOnly; Secure; SameSite=Lax` cookie on redirect
  - Verified on callback by comparing query parameter to cookie value
  - Cookie `Max-Age`: 600 seconds (10 minutes)
- **`redirect_uri`**: Explicit callback URL included in both authorize and token exchange requests
  - Value derived from request URL: `${new URL(req.url).origin}/auth/callback`
  - Must match between authorize and token exchange steps

### handleAuthRedirect

- Generates cryptographically random `state`
- Sets cookie: `oauth_state={state}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/auth/callback`
- Returns 302 redirect to `https://github.com/login/oauth/authorize` with query parameters:
  - `client_id`
  - `redirect_uri`
  - `scope=repo`
  - `state`

### handleAuthCallback

#### Scenarios

- Missing `code` parameter → 400 error
- Missing `state` parameter → 400 error
- Missing `oauth_state` cookie → 403 error
- `state` parameter !== `oauth_state` cookie → 403 error
- Valid state + valid code → exchanges code for token, returns HTML page displaying token
- Valid state + invalid code (exchange fails) → 400 error
- On success or failure: clears `oauth_state` cookie (`Max-Age=0`)

### exchangeCode

- POST to `https://github.com/login/oauth/access_token` with body:
  - `client_id`
  - `client_secret`
  - `code`
  - `redirect_uri` (must match the one used in authorize request)
- Request header: `Accept: application/json`
- Valid code → returns `access_token` string
- Error response from GitHub → throws error (do not expose GitHub's error details to client)

## extractToken

### Scenarios

- `Authorization: Bearer xxx` header → `"xxx"`
- `Authorization: bearer xxx` (lowercase) → `"xxx"`
- `Authorization: Bearer ` (empty value) → `null`
- No header → `null`
- `Authorization: Basic xxx` → `null`

## Token Validation

On every authenticated request (MCP endpoints), the server validates the token:

- Calls `GET https://api.github.com/user` with the extracted Bearer token
- Valid token → returns `{ login: string }` (GitHub username)
- Invalid/expired/revoked token → 401 error

This is performed before any MCP processing. The result (`login`) is used to construct `RepoConfig`.

## GitHub App Permission Model

### Token types

- OAuth user-to-server token (`ghu_` prefix) is issued via the OAuth Web flow
- This token's effective permissions = intersection of (OAuth scope) AND (GitHub App installation permissions)

### Installation requirement

- The GitHub App **must be installed** on the user's account and granted access to the `ideas` repository
- Without installation, the `ghu_` token cannot access private repositories even with `repo` scope
- Installation is done by the user at `https://github.com/apps/{app-name}/installations/new`

### Required GitHub App permissions

| Permission | Access | Reason |
|---|---|---|
| **Contents** | Read & Write | File CRUD via Contents API |

No other permissions are required. `Administration` is intentionally omitted — users create the `ideas` repository manually.

### Setup order

1. Create the GitHub App (with Contents: Read & Write)
2. User installs the App on their account (granting access to `ideas` repo)
3. User creates the `ideas` repository manually (private, with README)
4. User authorizes via `/auth/github` to obtain `ghu_` token
5. Token is used as `Authorization: Bearer` header on MCP requests

### GitHub API requirements

- All requests must include `User-Agent` header (Cloudflare Workers `fetch` does not set one by default)
- GitHub API rejects requests without `User-Agent` with 403

## Security Considerations

### CSRF Protection via State Parameter

- State is generated using `crypto.getRandomValues()` — cryptographically secure
- State is stored in a short-lived, `HttpOnly` cookie (not server-side storage) — compatible with stateless architecture
- `SameSite=Lax` ensures cookie is sent on top-level navigation (GitHub redirect) but not on cross-site embedded requests
- `Secure` flag ensures cookie is only sent over HTTPS
- 10-minute expiry limits the attack window

### Scope

- `repo` scope grants read/write access to all of the user's repositories
- This is broader than needed (only `{owner}/ideas` is used), but GitHub OAuth does not offer per-repository scopes
- Mitigation: server code only accesses the `ideas` repository via hardcoded path in `RepoConfig`

### Token Display (Callback HTML)

- Page includes `<meta name="referrer" content="no-referrer">` to prevent token leakage via Referrer header
- No JavaScript-based auto-copy to clipboard (requires user gesture)
- Page should instruct user to store the token securely and close the tab

### Error Responses

- Auth error responses use generic messages — never expose internal details, stack traces, or GitHub API error bodies
- Error HTTP status codes:
  - 400: bad request (missing/invalid parameters)
  - 401: unauthorized (invalid/missing token)
  - 403: forbidden (state mismatch)
  - 500: internal server error (hide details)

### Response Headers

All auth endpoint responses include:

- `Cache-Control: no-store` — prevent token/response caching
- `X-Content-Type-Options: nosniff`

Callback HTML page additionally includes:

- `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`

### Environment Variables

- `GITHUB_CLIENT_ID`: public identifier, safe in client-side code
- `GITHUB_CLIENT_SECRET`: stored as Cloudflare Workers secret (`wrangler secret put`), never logged or exposed in responses
