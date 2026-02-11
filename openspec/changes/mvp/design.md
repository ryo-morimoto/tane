# Design

## Architecture Overview

```
┌──────────────────────────────────────────┐
│              Clients                      │
│  MCP (Claude Desktop / Cursor / etc.)    │
│  Web UI (future)                          │
│  CLI (future)                             │
└──────────┬──────────────┬────────────────┘
           │ /mcp         │ /api/*
           │ Streamable   │ REST
           │ HTTP         │ JSON
           ▼              ▼
┌──────────────────────────────────────────┐
│        Cloudflare Worker                  │
│                                           │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ │
│  │  Auth    │ │   MCP    │ │  Web API  │ │
│  │ handler  │ │ handler  │ │  handler  │ │
│  └────┬────┘ └─────┬────┘ └─────┬─────┘ │
│       │            │            │         │
│       │      ┌─────▼────────────▼───┐    │
│       │      │     Core (tools)     │    │
│       │      └──────────┬───────────┘    │
│       │                 │                 │
│       │      ┌──────────▼───────────┐    │
│       │      │   GitHub API layer   │    │
│       │      │   (fetch + parse)    │    │
│       │      └──────────┬───────────┘    │
│       │                 │                 │
└───────┼─────────────────┼────────────────┘
        │                 │
        ▼                 ▼
   GitHub OAuth      GitHub REST API
                          │
                          ▼
                   {owner}/ideas repo
                     └── ideas/
                         ├── {id}.md
                         └── ...
```

## Technology Choices

### Runtime: Cloudflare Workers

- Runs on Web Standard APIs (Request/Response/fetch)
- MCP SDK's `WebStandardStreamableHTTPServerTransport` works directly
- Global edge deployment with minimal self-hosting effort
- Generous free tier (100,000 req/day)

### Data Store: GitHub Repository

- Markdown files are the source of truth
- Git history automatically preserves how ideas evolve
- Zero infrastructure cost with no external DB
- All operations possible via GitHub API

### Auth: GitHub App OAuth

- Create a GitHub App with Contents: Read & Write permission
- User must install the App on their account and grant access to the `ideas` repository
- User must create the `ideas` repository manually before use
- Authenticate via OAuth Web flow; token (`ghu_` prefix) is not stored on the server
- Client sends token via Bearer header on every request
- Server is stateless

### Language: TypeScript

- MCP SDK is TypeScript/JavaScript
- Cloudflare Workers has native support

### Dependencies

| Library | Reason | Alternatives |
|---|---|---|
| `@modelcontextprotocol/sdk` | MCP transport + tool definitions | None (required for MCP compliance) |
| `yaml` | frontmatter parse/serialize | Custom parser not worth the effort |
| `zod` | MCP SDK dependency. Used for tool schema definitions | No additional cost |

No other libraries. GitHub API access is done directly with `fetch`.

## Layer Structure

### Schema layer (`src/schema.ts`)

- Idea type definition
- IdeaStatus enum
- ID generation function
- zod schema

### Markdown layer (`src/markdown.ts`)

- `parseIdea(content: string): Idea` — parse frontmatter + body
- `serializeIdea(idea: Idea): string` — convert Idea object to Markdown string

### GitHub API layer (`src/github.ts`)

- `RepoConfig` interface — holds `token`, `owner`, `repo` (immutable config, not a class)
- `createRepoConfig(token, owner, repo?): RepoConfig` — factory with `repo` defaulting to `"ideas"`
- Exported functions take `RepoConfig` as first argument: `ensureRepo`, `createFile`, `getFile`, `updateFile`, `listFiles`, `searchFiles`
- Calls GitHub API directly with fetch

### Core layer (`src/core.ts`)

- Business logic called by both MCP tools and Web API
- Exported functions take `RepoConfig` as first argument: `createIdea`, `listIdeas`, `getIdea`, `updateIdea`, `searchIdeas`
- MCP-specific response formatting and HTTP response construction are the caller's responsibility

### MCP handler (`src/mcp.ts`)

- `McpServer` + `WebStandardStreamableHTTPServerTransport` setup
- Tool registration
- Session management

### Web API handler (`src/api.ts`) — future

- REST endpoints
- Calls Core layer and returns JSON responses

### Auth handler (`src/auth.ts`)

- OAuth initiation (`/auth/github`)
- Callback handling (`/auth/callback`)

### Entry point (`src/index.ts`)

- Cloudflare Worker's `fetch` handler
- URL path routing: `/mcp`, `/api/*`, `/auth/*`, `/health`

## Session Management

Cloudflare Workers don't persist state between requests. MCP session management approach:

**Option A: Stateless (MVP)**
- No session IDs; create a new transport per request
- Generate McpServer + transport per initialize request
- Completes within a single request, so it works on Workers
- Limitation: Long-lived SSE streaming connections not possible

**Option B: Durable Objects (future)**
- Persist MCP sessions as Durable Objects
- Enables long-lived SSE connections and cross-session state sharing
- Requires Cloudflare paid plan

MVP uses Option A.

## Cloudflare Workers Considerations

- Project config via `wrangler.toml`
- Environment variables (secrets): `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Entry point defined with `export default { fetch }`
- MCP SDK's `WebStandardStreamableHTTPServerTransport` is Web Standard API-based and runs directly on Workers
