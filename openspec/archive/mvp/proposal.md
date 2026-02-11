# Proposal: tane

## Motivation

Developers have ideas that come and go. Some have a clear problem and direction but no technical design yet. Some are things you just want to try building. These vanish if not written down, and even when written down, the context gets lost.

Existing tools (GitHub Issues, Linear, BrainGrid, Notion, etc.) specialize in task management and spec structuring for "things already decided to build." They don't fit a workflow of casually stocking early-stage ideas and growing them over time.

## Solution

Build an idea management framework backed by GitHub repositories.

- Store ideas as Markdown files in an `ideas` repository
- Define a data format (Markdown schema) and workflow (lifecycle)
- Accessible from any LLM client as an MCP server
- Also provide a Web API for future Web UI and CLI access
- Hosted on Cloudflare Workers

## Scope

### MVP (this project)

- Markdown schema definition (frontmatter + body)
- GitHub API layer (direct fetch)
- GitHub App OAuth authentication
- MCP server (5 tools: create, list, get, update, search)
- Deploy as a Cloudflare Worker

### Future (separate changes)

- Web API endpoints (REST JSON)
- Web UI
- Promote feature (create a new GitHub repo from an idea)
- Refine feature (deepen concepts through AI conversation)
- CLI

## Differentiation

- **GitHub as data store**: No data locked in SaaS. Git history preserves how ideas evolve
- **MCP for no LLM lock-in**: Accessible from Claude, Cursor, Gemini, etc.
- **Focused on early-stage ideas**: From seed (one-line memo) to refined (spec-ready)
- **Minimal dependencies**: Only MCP SDK, yaml, and zod
