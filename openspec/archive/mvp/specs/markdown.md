# Markdown

## Format

```markdown
---
title: My Idea
status: seed
created_at: "2025-04-01"
updated_at: "2025-04-01"
tags: [ai, tools]
---

The idea body goes here.
```

## parseIdea

Markdown string → Idea object

### Scenarios

- Valid Markdown → all fields parsed correctly
- Frontmatter only (no body) → `body` is empty string
- Invalid `---` delimiters → error
- Invalid YAML in frontmatter → error
- Zod validation failure (invalid status, etc.) → error

## serializeIdea

Idea object → Markdown string

### Scenarios

- Idea with all fields set → frontmatter + `---` + body format
- Idea with empty body → frontmatter + `---` only (handle trailing newline)
- `parseIdea(serializeIdea(idea))` === `idea` (round-trip)

## ideaToSummary

Single-line summary for list display

### Scenarios

- `ideaToSummary(idea)` → format like `"[seed] My Idea (2025-04-01)"`
- With tags → tags included
