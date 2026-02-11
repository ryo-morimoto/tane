# tane

Idea management framework backed by GitHub repositories, running on Cloudflare Workers.

Store ideas as Markdown files in a GitHub repo. Access them via MCP (Streamable HTTP) or REST API.

## Tech Stack

- Runtime: Cloudflare Workers
- Language: TypeScript
- Dependencies: @modelcontextprotocol/sdk, yaml, zod
- Auth: GitHub App OAuth
- Data: GitHub Repository (Markdown files)

## Setup

```bash
bun install
```

## Development

```bash
bun run dev        # local dev server (wrangler)
bun test           # unit tests
bun run typecheck  # type check
```

## Deploy

```bash
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
bun run deploy
```

## Design Docs

- [proposal.md](openspec/changes/mvp/proposal.md)
- [design.md](openspec/changes/mvp/design.md)
- [tasks.md](openspec/changes/mvp/tasks.md)
- [specs/](openspec/changes/mvp/specs/)
