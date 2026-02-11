# Tasks

## Project Initialization

- [x] Create Cloudflare Worker project with `wrangler init` (TypeScript)
- [x] Edit `package.json`. dependencies: `@modelcontextprotocol/sdk`, `yaml`, `zod`. devDependencies: `wrangler`, `@cloudflare/workers-types`, `vitest`
- [x] Configure `wrangler.toml`. name, compatibility_date
- [x] `tsconfig.json` — Cloudflare Workers config. `"types": ["@cloudflare/workers-types"]`, `"lib": ["ES2022"]`

## Schema Layer

- [ ] Create `src/schema.ts`
  - `IDEA_STATUSES` const array (`seed`, `growing`, `refined`, `archived`, `dropped`)
  - `IdeaStatus` type
  - `Idea` interface (id, title, status, created_at, updated_at, tags, body)
  - `IdeaFrontmatterSchema` (zod schema, excluding body)
  - `generateId(title: string, date?: string): string` — `{YYYY-MM-DD}-{slug}` format. date defaults to current date
  - Test: `src/schema.test.ts`

## Markdown Layer

- [ ] Create `src/markdown.ts`
  - `parseIdea(content: string): Idea` — split by `---`, parse YAML, validate with zod
  - `serializeIdea(idea: Idea): string` — combine frontmatter + body
  - `ideaToSummary(idea: Idea): string` — single-line summary for list display
  - Test: `src/markdown.test.ts` (including round-trip tests)

## GitHub API — Utilities

- [ ] Create utility functions in `src/github.ts`
  - `gh(path, token, options?)` — fetch wrapper. Adds Authorization header, handles errors
  - `base64Encode(str: string): string` — UTF-8 base64 encoding using TextEncoder
  - `base64Decode(b64: string): string` — UTF-8 base64 decoding using TextDecoder
  - `getUser(token: string): Promise<{ login: string }>` — GET /user
  - Test: `src/github.test.ts` (base64 round-trip, gh header injection)

## GitHub API — IdeasRepository

- [ ] Add `IdeasRepository` class to `src/github.ts`
  - constructor: `(token: string, owner: string, repo?: string)` — repo defaults to `"ideas"`
  - `ensureRepo()` — check if repo exists, create if not
  - `create(idea: Idea)` — PUT contents API
  - `get(id: string): Promise<Idea>` — GET contents API + base64 decode + parseIdea
  - `update(idea: Idea)` — GET (fetch SHA) → PUT
  - `list(statusFilter?: string): Promise<Idea[]>` — list directory → fetch each file
  - `search(query: string): Promise<Idea[]>` — fetch all via list → filter by title/body/tags
  - Test: `src/github-repository.test.ts` (mock fetch, verify CRUD)

## Core Layer

- [ ] Create `src/core.ts`
  - `createIdea(repo, params): Promise<Idea>` — generate ID, set dates, call repo.create
  - `listIdeas(repo, statusFilter?): Promise<Idea[]>`
  - `getIdea(repo, id): Promise<Idea>`
  - `updateIdea(repo, id, params): Promise<Idea>` — fetch existing, merge, update updated_at
  - `searchIdeas(repo, query): Promise<Idea[]>`
  - Test: `src/core.test.ts` (mock IdeasRepository)

## Auth Handler

- [ ] Create `src/auth.ts`
  - `AuthConfig` type: clientId, clientSecret, baseUrl
  - `handleAuthRedirect(config): Response` — redirect to GitHub OAuth URL
  - `handleAuthCallback(config, url): Response` — exchange code for token, return HTML
  - `exchangeCode(config, code): Promise<string>` — POST github.com/login/oauth/access_token
  - `extractToken(req: Request): string | null` — extract Bearer token from Authorization header
  - Test: `src/auth.test.ts` (extractToken patterns, redirect URL validation)

## MCP Handler

- [ ] Create `src/mcp.ts`
  - `handleMcp(req: Request, env: Env): Promise<Response>`
  - Create `McpServer` + `WebStandardStreamableHTTPServerTransport` per request
  - Get GitHub user from Bearer token and create `IdeasRepository`
  - Register 5 MCP tools: create_idea, list_ideas, get_idea, update_idea, search_ideas
  - Each tool calls Core layer functions
  - Tool parameters defined with zod
- [ ] Verify whether `nodejs_compat` flag is needed (check if MCP SDK uses Node.js APIs)

## Entry Point

- [ ] Update `src/index.ts`
  - URL routing:
    - `POST|GET|DELETE /mcp` → handleMcp
    - `GET /auth/github` → handleAuthRedirect
    - `GET /auth/callback` → handleAuthCallback
    - `GET /health` → `{ status: "ok" }`
    - Default → 404
  - Test: `src/index.test.ts` (routing only)

## Deploy and Verification

- [ ] `wrangler secret put GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- [ ] `wrangler deploy`
- [ ] Access `/auth/github` in browser to verify auth flow
- [ ] Connect with MCP client (Claude Desktop, etc.) using the obtained token
- [ ] Verify each tool: create → list → get → update → search
- [ ] Confirm `ideas/` directory and Markdown files are created in the GitHub repository
