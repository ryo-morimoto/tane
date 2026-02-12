# Tasks

## GitHub App Settings (manual)

- [x] Enable "Request user authorization (OAuth) during installation" on tane-app
- [x] Confirm Callback URL is `https://tane.ryo-o.dev/auth/callback`

## Unified Install + Auth Redirect

- [x] Add `GITHUB_APP_SLUG` to `Env` interface in `src/index.ts`
- [x] Add `[vars]` section with `GITHUB_APP_SLUG = "tane-app"` to `wrangler.toml`
- [x] Add `appSlug` to `AuthConfig` interface in `src/auth.ts`
- [x] Update `handleAuthRedirect` to redirect to `https://github.com/apps/{appSlug}/installations/new?state={state}`
- [x] Update `src/index.ts` to pass `appSlug` from `env.GITHUB_APP_SLUG` to `AuthConfig`
- [x] Update `src/auth.test.ts` for new redirect URL and `AuthConfig` shape
- [x] Update `src/index.test.ts` env mock to include `GITHUB_APP_SLUG`

## Actionable Error Messages

- [x] Update `ensureRepo` error message to include `https://github.com/new?name=${config.repo}&private=true&description=...` link
- [x] Update `src/github-repository.test.ts` for new error message
- [x] Add `formatError(error, appSlug, origin)` helper in `src/format-error.ts`
  - `GitHubApiError` 401 → re-authorize link
  - `GitHubApiError` 403 → App install link
  - Other → pass through message
- [x] Wrap all 5 MCP tool callbacks in try/catch using `formatError`
- [x] Pass `appSlug` and `origin` from `handleMcp` into tool closures

## Deploy & Verify

- [x] `wrangler deploy`
- [x] Visit `/auth/github` → confirm redirect to App install page
- [x] Complete install + OAuth flow → confirm token is returned
- [x] Call `create_idea` without `ideas` repo → confirm error includes create link
- [x] Call `create_idea` with `ideas` repo → confirm success
