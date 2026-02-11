# Design: setup-flow

## Overview

Two changes to reduce setup friction. No additional GitHub App permissions required.

```
Before:
  1. User discovers and visits github.com/apps/tane-app/installations/new (URL not surfaced)
  2. User creates "ideas" repo manually on GitHub
  3. User visits /auth/github for OAuth token

After:
  1. User visits /auth/github → App install + OAuth in one flow
  2. On first tool use, error guides user to create "ideas" repo via direct link
```

## Change 1: Unified install + auth redirect

### `handleAuthRedirect` (src/auth.ts)

Current: redirects to `https://github.com/login/oauth/authorize?...`

New: redirects to `https://github.com/apps/{GITHUB_APP_SLUG}/installations/new`

GitHub's "Request user authorization (OAuth) during installation" setting handles the rest:
- User installs App → GitHub starts OAuth → redirects to `/auth/callback` with `code` + `state`
- If App is already installed, GitHub skips install and goes straight to OAuth

The `state` cookie is still set for CSRF protection. The callback handler is unchanged — it receives `code` and `state` the same way.

### AuthConfig change

```typescript
// Before
interface AuthConfig {
  clientId: string;
  clientSecret: string;
}

// After
interface AuthConfig {
  clientId: string;
  clientSecret: string;
  appSlug: string;
}
```

### Env change (src/index.ts, wrangler.toml)

```typescript
interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_APP_SLUG: string;  // new
}
```

`GITHUB_APP_SLUG` is not a secret — it can be set directly in `wrangler.toml` as a `[vars]` value.

```toml
[vars]
GITHUB_APP_SLUG = "tane-app"
```

### Redirect URL construction

```
https://github.com/apps/{appSlug}/installations/new?state={state}
```

Note: The `state` parameter is passed as a query parameter on the install URL. GitHub forwards it to the callback URL after OAuth. This preserves CSRF protection through the existing cookie-based verification.

The callback URL is configured in the GitHub App settings (not passed as `redirect_uri` in the URL). This is a GitHub App behavior difference from plain OAuth Apps.

## Change 2: Actionable error messages

### `ensureRepo` (src/github.ts)

No auto-creation. Improve error message with direct link to create the repo:

```typescript
export async function ensureRepo(config: RepoConfig): Promise<void> {
  try {
    await gh(`/repos/${config.owner}/${config.repo}`, config.token);
  } catch (e) {
    if (e instanceof GitHubApiError && e.status === 404) {
      throw new Error(
        `Repository not found. Create it at https://github.com/new?name=${config.repo}&private=true then retry.`
      );
    }
    throw e;
  }
}
```

No signature change, no `appSlug` parameter needed.

### MCP tool errors (src/mcp.ts)

Wrap tool callbacks in try/catch to produce actionable errors:

```typescript
async ({ title, tags, body }) => {
  try {
    const idea = await createIdea(config, { title, tags, body });
    return { content: [{ type: "text", text: `Created: ${idea.id}` }] };
  } catch (e) {
    return { content: [{ type: "text", text: formatError(e, appSlug, origin) }], isError: true };
  }
}
```

### `formatError` helper (src/mcp.ts)

Maps `GitHubApiError` status codes to user-facing messages:

| Status | Message |
|--------|---------|
| 401 | `Authentication failed. Re-authorize at {origin}/auth/github` |
| 403 | `Permission denied. Ensure the tane GitHub App is installed and has access to the ideas repository: https://github.com/apps/{appSlug}/installations/new` |
| other | `An error occurred: {message}` |

Errors from `ensureRepo` (not `GitHubApiError`) are passed through as-is, since they already contain actionable messages.

## GitHub App permissions

**No changes.** Contents: Read & Write remains the only permission. Administration is intentionally omitted.

## GitHub App settings change (manual)

- Enable: "Request user authorization (OAuth) during installation"

## Files changed

| File | Change |
|------|--------|
| `src/auth.ts` | `AuthConfig.appSlug`, redirect URL → install URL |
| `src/auth.test.ts` | Update tests for new redirect target |
| `src/github.ts` | `ensureRepo` error message with create URL |
| `src/github-repository.test.ts` | Update ensureRepo test |
| `src/mcp.ts` | Error wrapping with `formatError`, `appSlug` from env |
| `src/index.ts` | `Env.GITHUB_APP_SLUG`, pass to handlers |
| `src/index.test.ts` | Update env mock |
| `wrangler.toml` | Add `[vars]` section with `GITHUB_APP_SLUG` |
