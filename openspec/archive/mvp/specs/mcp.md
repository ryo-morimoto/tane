# MCP

## Transport

- `POST /mcp` → handled via `WebStandardStreamableHTTPServerTransport`
- `GET /mcp` → SSE connection (limited in MVP)
- `DELETE /mcp` → session termination
- McpServer + transport created per request (stateless)

## Tool Registration

5 MCP tools available:

| Tool | Operation |
|------|-----------|
| create_idea | Create a new idea |
| list_ideas | List ideas (filterable by status) |
| get_idea | Get a single idea |
| update_idea | Update an idea |
| search_ideas | Keyword search |

### Scenarios

- `create_idea({ title: "Test" })` → Idea is created, returns ID and content
- `list_ideas({})` → summary list of all ideas
- `list_ideas({ status: "seed" })` → only ideas with seed status
- `get_idea({ id: "2025-04-01-test" })` → full content of the matching idea
- `update_idea({ id: "...", status: "growing" })` → status updated
- `search_ideas({ query: "AI" })` → matching results

## Authentication

Token is extracted and validated before MCP processing (see auth.md for details).

- No `Authorization` header → 401 error (before MCP handler)
- Invalid/expired/revoked token → 401 error (validated via `GET /user` GitHub API)
- Valid token → resolves GitHub username, constructs `RepoConfig`, proceeds to MCP handler

Error responses for auth failures use generic messages and include `Cache-Control: no-store`.
