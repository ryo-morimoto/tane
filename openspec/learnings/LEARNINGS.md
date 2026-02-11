# Learnings

Knowledge accumulated through the project. Extracted from each change's review.

<!-- New learnings are appended below by /compound:ship -->

## review-20260211: Initial Scaffold

- Don't put non-deterministic commands (e.g. server startup) in `showboat exec`. Record only deterministic commands
- Whether `nodejs_compat` flag is needed should be verified when implementing MCP SDK
- Design document consistency review is useful even at the scaffold stage

## mvp (2026-02-11)

### What worked
- Red/Green TDD with vitest — write test first, confirm fail, implement, confirm pass
- Functions/modules pattern kept all layers composable and testable
- Separating markdown serialization from GitHub file I/O — both independently testable
- `vi.spyOn(globalThis, "fetch")` for GitHub API mocking

### What didn't work
- Test runner output (ordering, timing) is non-deterministic — pipe through grep for summary lines only in `showboat exec`
- `bun test` != `bunx vitest run` — use the vitest script from package.json

### Patterns discovered
- GitHub Contents API returns base64 with newlines — strip `\n` before decoding
- `WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })` for stateless MCP on Workers
- MCP SDK v1 imports: `@modelcontextprotocol/sdk/server/mcp.js` and `.../webStandardStreamableHttp.js`
- `server.registerTool` is the non-deprecated API (replaces `server.tool`)
- `nodejs_compat` flag IS required for MCP SDK on Cloudflare Workers

### Issues found in demo that tests missed
- No live integration test — unit tests mock all external calls
- MCP tool error handling (GitHub API 500s during tool execution) could surface as unhandled exceptions

## mvp-auth-design-fix (2026-02-11)

### What went wrong
- Auth spec (auth.md, design.md) described only OAuth Web flow but omitted the GitHub App permission model entirely
- `ghu_` token requires both OAuth scope AND App installation — without installation, private repos return 404
- `ensureRepo` auto-creating repos required Administration permission, which is overly broad
- Cloudflare Workers `fetch` does not set `User-Agent` by default — GitHub API rejects with 403

### Lessons
- GitHub App auth has two axes: OAuth scope (user grants) AND installation permissions (repo access). Design must cover both.
- Design documents must include the full setup sequence (create App → install → create repo → authorize)
- When using GitHub API from serverless runtimes, always set `User-Agent` explicitly
- Don't assume `fetch` behavior is identical across runtimes (Node.js, Workers, Deno)
