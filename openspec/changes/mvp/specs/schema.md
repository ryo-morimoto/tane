# Schema

## Idea Type

Idea has the following fields:

| Field | Type | Required |
|-------|------|----------|
| id | string | yes |
| title | string | yes |
| status | IdeaStatus | yes |
| created_at | string (ISO 8601) | yes |
| updated_at | string (ISO 8601) | yes |
| tags | string[] | yes (can be empty) |
| body | string | yes (can be empty) |

## Status Lifecycle

`seed` → `growing` → `refined` → `archived` / `dropped`

- Default is `seed`
- Any status can transition to `dropped`
- No transition back from `archived`

## ID Generation

`generateId(title, date)` → `{YYYY-MM-DD}-{slug}`

### Scenarios

- `generateId("My First Idea", "2025-04-01")` → `"2025-04-01-my-first-idea"`
- `generateId("日本語タイトル", "2025-04-01")` → non-ASCII chars removed, fallback ID if empty
- `generateId("Hello World!!!", "2025-04-01")` → symbols removed → `"2025-04-01-hello-world"`
- `generateId("", "2025-04-01")` → fallback for empty title

## Zod Schema Validation

### Scenarios

- Valid frontmatter object → parse succeeds
- Invalid `status` value → parse fails
- `tags` is not a string array → parse fails
- `created_at` is empty → parse fails
