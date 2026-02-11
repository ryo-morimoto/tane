# tane

Idea management framework backed by GitHub repositories.
Runs on Cloudflare Workers, providing Remote MCP (Streamable HTTP) and Web API.

## Language Policy

This is an OSS project. **All text must be in English:**

- Code comments, documentation, commit messages, PR titles/descriptions
- Issue titles/descriptions, review comments
- openspec artifacts (proposals, specs, designs, tasks, learnings)

## Tech Stack

- Runtime: Cloudflare Workers
- Language: TypeScript
- Dependencies: @modelcontextprotocol/sdk, yaml, zod (nothing else)
- Auth: GitHub App OAuth
- Data: GitHub Repository (Markdown files)
- Dev: wrangler, bun

## Conventions

- Use `bunx` for package execution (not `npx`)
- Web Standard APIs only (Request/Response/fetch). No Node.js-specific APIs
- Minimal external dependencies. Don't add libraries unless necessary
- Access GitHub REST API directly with fetch (no Octokit)
- All data stored as Markdown files in GitHub repositories. No external DB

## Test Commands

- `bun test` — unit tests
- `wrangler dev` — local dev server
- `wrangler deploy` — deploy

## Development Workflow: Compound Engineering

This project uses a compound engineering workflow:
Plan → Implement → **Verify** → Review → Learn → Archive

Knowledge compounds across changes via `openspec/learnings/LEARNINGS.md`.

### Skills

| Skill | Purpose |
|-------|---------|
| `/compound:ship <description>` | Full automated cycle (with verification) |
| `/compound:plan <description>` | Generate plan only (for team alignment) |
| `/compound:review <git-range>` | Post-hoc review of existing code |

### Session Setup

Run at the start of each coding session:

- `uvx showboat --help`
- `uvx rodney --help` (if project has UI)

### Verification

```
openspec/changes/<change>/specs/     = expected (what should happen)
openspec/changes/<change>/demo.md    = actual (what did happen)
human review                         = compare specs/ and demo.md
```

### Enforcement

- **Stop hook**: checkpoint-gate.sh — blocks if demo.md is missing when all tasks are complete
- **demo.md**: edit only via showboat commands. Never edit directly
- **showboat verify**: re-runs all commands and confirms output matches

### Rules

- ALWAYS read `openspec/learnings/LEARNINGS.md` before planning
- NEVER edit demo.md directly — use showboat commands
- NEVER add `<!-- no-checkpoint -->` yourself — only humans can opt out
- If `showboat verify` fails, fix and re-verify before review
- [MUST FIX] items: auto-fix (2 attempts max, then escalate to human)
