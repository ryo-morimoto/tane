# Routing

## Entry Point

Cloudflare Worker's `fetch` handler routes by URL path.

### Scenarios

- `GET /health` → `{ status: "ok" }` (200)
- `POST /mcp` → MCP handler (JSON-RPC request processing)
- `GET /mcp` → MCP handler (SSE)
- `DELETE /mcp` → MCP handler (session termination)
- `GET /auth/github` → OAuth initiation (302 redirect)
- `GET /auth/callback?code=xxx` → OAuth callback
- `GET /unknown` → 404
- `POST /health` → 404 (GET only)
