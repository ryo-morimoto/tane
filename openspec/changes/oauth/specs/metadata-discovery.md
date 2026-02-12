# Metadata Discovery

Serve OAuth 2.0 Protected Resource Metadata (RFC 9728) and Authorization Server Metadata (RFC 8414) so MCP clients can automatically discover how to authenticate.

## Current state

- No metadata discovery endpoints
- `/mcp` returns 401 with a plain JSON error body when no token is provided
- MCP clients cannot discover how to authenticate — users must manually obtain tokens

## Target state

- `GET /.well-known/oauth-protected-resource` returns Protected Resource Metadata
- `GET /.well-known/oauth-authorization-server` returns Authorization Server Metadata
- `401` responses include `WWW-Authenticate` header with `resource_metadata` URL
- MCP clients can complete the full discovery → registration → authorization flow automatically

## Protected Resource Metadata (`/.well-known/oauth-protected-resource`)

### Scenarios

- `GET /.well-known/oauth-protected-resource`
  - Returns JSON:
    ```json
    {
      "resource": "https://tane.ryo-o.dev/mcp",
      "authorization_servers": ["https://tane.ryo-o.dev"],
      "scopes_supported": ["mcp:tools"],
      "resource_name": "tane"
    }
    ```
  - `Content-Type: application/json`
  - Status: 200

## Authorization Server Metadata (`/.well-known/oauth-authorization-server`)

### Scenarios

- `GET /.well-known/oauth-authorization-server`
  - Returns JSON:
    ```json
    {
      "issuer": "https://tane.ryo-o.dev",
      "authorization_endpoint": "https://tane.ryo-o.dev/authorize",
      "token_endpoint": "https://tane.ryo-o.dev/token",
      "registration_endpoint": "https://tane.ryo-o.dev/register",
      "response_types_supported": ["code"],
      "grant_types_supported": ["authorization_code", "refresh_token"],
      "token_endpoint_auth_methods_supported": ["client_secret_post", "none"],
      "code_challenge_methods_supported": ["S256"],
      "scopes_supported": ["mcp:tools"]
    }
    ```
  - `Content-Type: application/json`
  - Status: 200

Note: `workers-oauth-provider` serves both metadata endpoints automatically when configured as the `OAuthProvider` wrapper.

## 401 responses with WWW-Authenticate

### Scenarios

- `POST /mcp` without `Authorization` header
  - Status: 401
  - Header: `WWW-Authenticate: Bearer resource_metadata="https://tane.ryo-o.dev/.well-known/oauth-protected-resource"`
- `POST /mcp` with expired or invalid token
  - Status: 401
  - Same `WWW-Authenticate` header

## Existing endpoints unchanged

- `GET /health` → `{ status: "ok" }` (200, no auth required)
