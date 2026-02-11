# Routing

## Entry Point

Cloudflare Workerの `fetch` handler がURLパスでルーティングする。

### Scenarios

- `GET /health` → `{ status: "ok" }` (200)
- `POST /mcp` → MCP handler (JSON-RPCリクエスト処理)
- `GET /mcp` → MCP handler (SSE)
- `DELETE /mcp` → MCP handler (セッション終了)
- `GET /auth/github` → OAuth開始（302リダイレクト）
- `GET /auth/callback?code=xxx` → OAuth callback
- `GET /unknown` → 404
- `POST /health` → 404（GETのみ）
