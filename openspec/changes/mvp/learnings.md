# Learnings: mvp

## What worked
- Red/Green TDD flow — writing tests first caught design issues early (e.g., GitHub layer API surface)
- Functions/modules pattern (no classes) kept all layers composable and easy to test with vi.spyOn
- Separating serialization (markdown layer) from file I/O (github layer) made both independently testable
- Using `vi.spyOn(globalThis, "fetch")` for GitHub API mocking kept tests isolated without needing a mock server
- The `registerTool` API (non-deprecated) works cleanly with zod schemas

## What didn't work
- Test runner output is non-deterministic (ordering, timing) — `showboat exec` with raw test output fails verification. Fixed by piping through grep for summary lines only.
- `bun test` (bun's built-in runner) is different from `bunx vitest run` — project uses vitest as specified in package.json

## Patterns discovered
- GitHub Contents API returns base64-encoded content with newlines in the encoding — must strip `\n` before decoding
- `WebStandardStreamableHTTPServerTransport` with `sessionIdGenerator: undefined` creates a truly stateless MCP transport that works on Cloudflare Workers
- McpServer + Transport can be created per-request for stateless operation
- MCP SDK v1 uses `@modelcontextprotocol/sdk/server/mcp.js` and `@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js` as import paths

## Issues found in demo that tests missed
- No live integration test — unit tests mock all external calls, so actual GitHub API compatibility and Cloudflare Workers runtime behavior remain unverified until deploy
- MCP tool error handling (e.g., GitHub API 500s during tool execution) surfaces as unhandled exceptions — consider wrapping tool callbacks in try/catch for production
