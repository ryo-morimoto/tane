# Design: setup-flow

## Overview

Three changes to reduce setup from 3 manual steps to 1:

```
Before:
  1. User discovers and visits github.com/apps/tane-app/installations/new
  2. User creates "ideas" repo manually on GitHub
  3. User visits /auth/github for OAuth token

After:
  1. User visits /auth/github → install + OAuth + auto-create repo
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

## Change 2: Auto-create repository

### `ensureRepo` (src/github.ts)

Restore auto-creation logic:

```typescript
export async function ensureRepo(config: RepoConfig): Promise<void> {
  try {
    await gh(`/repos/${config.owner}/${config.repo}`, config.token);
  } catch (e) {
    if (e instanceof GitHubApiError && e.status === 404) {
      try {
        await gh("/user/repos", config.token, {
          method: "POST",
          body: JSON.stringify({
            name: config.repo,
            private: true,
            description: "Idea management repository powered by tane",
            auto_init: true,
          }),
        });
        return;
      } catch (createError) {
        if (createError instanceof GitHubApiError && createError.status === 403) {
          throw new Error(
            `Failed to create repository. Ensure the tane GitHub App is installed: https://github.com/apps/${appSlug}/installations/new`
          );
        }
        throw createError;
      }
    }
    throw e;
  }
}
```

Problem: `ensureRepo` currently takes only `RepoConfig`. It needs `appSlug` for error messages.

Solution: Add `appSlug` to `RepoConfig` or pass it as a separate parameter. Since `appSlug` is unrelated to repo config, pass it as a second parameter:

```typescript
export async function ensureRepo(config: RepoConfig, appSlug: string): Promise<void>
```

The `appSlug` flows from `Env` → `handleMcp` → `createIdea` → `ensureRepo`.

### GitHub App permission

Add **Administration: Read & Write** to the GitHub App. Existing installations will see a permission update prompt.

## Change 3: Actionable error messages

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
| 403 | `Permission denied. Ensure the tane GitHub App is installed: {installUrl}` |
| 404 | `Repository not found. Ensure the tane GitHub App has access: {installUrl}` |
| other | `An error occurred: {message}` |

## Files changed

| File | Change |
|------|--------|
| `src/auth.ts` | `AuthConfig.appSlug`, redirect URL change |
| `src/auth.test.ts` | Update tests for new redirect target |
| `src/github.ts` | `ensureRepo` auto-creation restored, `appSlug` param |
| `src/github-repository.test.ts` | Update ensureRepo tests |
| `src/mcp.ts` | Error wrapping, `formatError`, pass `appSlug` |
| `src/index.ts` | `Env.GITHUB_APP_SLUG`, pass to handlers |
| `src/index.test.ts` | Update env mock |
| `wrangler.toml` | Add `[vars]` section with `GITHUB_APP_SLUG` |
