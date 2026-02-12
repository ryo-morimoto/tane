# Token Lifecycle

Replace raw GitHub tokens with tane-issued tokens. Validate locally instead of calling GitHub API per request. Store upstream `ghu_` tokens server-side for GitHub API operations.

## Current state

- MCP clients send raw `ghu_` GitHub tokens in `Authorization: Bearer` header
- Every MCP request calls `GET https://api.github.com/user` to validate the token and resolve username
- No token expiry tracking, no refresh, no revocation
- GitHub rate limits apply to every validation call

## Target state

- tane issues its own opaque access tokens and refresh tokens via `workers-oauth-provider`
- Access tokens are validated locally by the OAuth provider (no external API call)
- The upstream `ghu_` token is stored encrypted in the grant's props, never exposed to MCP clients
- Token refresh rotates both access and refresh tokens
- Token revocation invalidates the grant

## Token validation on MCP requests

### Scenarios

- `POST /mcp` with valid tane-issued Bearer token
  - `workers-oauth-provider` validates the token locally
  - Extracts grant props containing `{ login, accessToken (ghu_) }`
  - MCP handler uses `login` and `ghu_` token to create `RepoConfig` for GitHub API calls
  - No `GET /user` call needed
- `POST /mcp` with expired access token
  - 401 with `WWW-Authenticate: Bearer` header
  - MCP client uses refresh token to obtain new access token
- `POST /mcp` with revoked token
  - 401 with `WWW-Authenticate: Bearer` header
- `POST /mcp` with a raw `ghu_` token (legacy)
  - 401 — tane no longer accepts GitHub tokens directly

## Upstream token storage

### Scenarios

- During authorization, after GitHub code exchange:
  - `ghu_` token and user login are stored as encrypted grant props
  - `workers-oauth-provider` handles encryption using `COOKIE_ENCRYPTION_KEY`
- When MCP tool executes a GitHub API call:
  - Grant props are decrypted to retrieve `ghu_` token
  - GitHub API calls use this token in `Authorization: Bearer {ghu_token}`
  - `User-Agent: tane/0.1.0` header included (required by GitHub API on Workers)
- If upstream `ghu_` token expires or is revoked by GitHub:
  - GitHub API calls return 401
  - MCP tool returns error: `"Authentication failed. Re-authorize at {origin}/authorize"`
  - User must re-authenticate through the OAuth flow to obtain a new `ghu_` token

## Token refresh

### Scenarios

- `POST /token` with `grant_type=refresh_token`
  - New access_token issued
  - Refresh token rotated (old one invalidated with grace window)
  - Upstream `ghu_` token in grant props is unchanged (still valid)
- Refresh token already used (replay) → `{ error: "invalid_grant" }` (400)

## Token revocation

### Scenarios

- `POST /revoke` with `token=...&token_type_hint=access_token`
  - Token is invalidated; subsequent requests with this token return 401
- `POST /revoke` with `token=...&token_type_hint=refresh_token`
  - Refresh token and associated access tokens are invalidated
- Revoking an already-revoked token → 200 (success, no-op per RFC 7009)

## Impact on existing specs

- **error-messages.md**: Error messages for GitHub API failures (401, 403) still apply. The `{origin}/auth/github` URL in the 401 error message changes to `{origin}/authorize`.
- **auto-create-repo.md**: Unchanged. Repository creation guidance still uses direct GitHub links.
- **install-auth-flow.md**: Superseded by this change. The combined install+auth redirect is replaced by the OAuth /authorize → GitHub flow.
