# Tasks: oauth

## 1. Dependencies and configuration

- [x] Add hono, @hono/mcp, @cloudflare/workers-oauth-provider to package.json and install
- [x] Update wrangler.toml: add KV namespace binding (OAUTH_KV), Durable Object binding (MCP_SESSION), migration tag

## 2. GitHub OAuth handler

- [x] Create `src/github-handler.ts`: Hono app with `/authorize` (redirect to GitHub), `/callback` (exchange code, complete authorization), `/health`

## 3. MCP session Durable Object

- [x] Create `src/mcp-session.ts`: TaneMcpSession DO with Hono + @hono/mcp StreamableHTTPTransport, McpServer with tools

## 4. Refactor MCP tool registration

- [x] Rewrite `src/mcp.ts`: export `registerTools(server, props, env)` factory that registers tools against grant props (no transport, no auth)

## 5. Entry point

- [x] Rewrite `src/index.ts`: OAuthProvider default export wrapping apiHandler (routes to DO) and defaultHandler (GitHubHandler), re-export TaneMcpSession

## 6. Cleanup

- [x] Delete `src/auth.ts` (replaced by github-handler.ts + workers-oauth-provider)
- [x] Update `src/format-error.ts`: change `/auth/github` → `/authorize` in 401 error message

## 7. Tests

- [x] Update existing tests to work with new architecture (fix imports, mocks)
- [x] Add tests for github-handler.ts (redirect chain, callback flow)
- [x] Add tests for mcp-session.ts (tool registration, transport)
