# Install + Auth Flow

Combine GitHub App installation and OAuth authorization into a single user-facing flow.

## Current state

- `/auth/github` redirects to `github.com/login/oauth/authorize` (OAuth only)
- App installation is a separate step at `github.com/apps/tane-app/installations/new` (URL not surfaced)
- User must discover and complete both steps independently

## Target state

- Enable "Request user authorization (OAuth) during installation" on the GitHub App
- `/auth/github` redirects to `https://github.com/apps/tane-app/installations/new` for first-time users
- After installation, GitHub automatically starts OAuth flow and redirects to `/auth/callback` with `code`
- Existing `/auth/callback` handler exchanges code for token (no change needed)

## GitHub App settings changes

- Enable: "Request user authorization (OAuth) during installation"
- Callback URL must be `https://tane.ryo-o.dev/auth/callback` (already set)

## handleAuthRedirect changes

### Scenarios

- User visits `/auth/github` → 302 redirect to `https://github.com/apps/tane-app/installations/new`
  - `state` cookie is set (same CSRF protection as current)
  - GitHub shows install screen → user installs → OAuth starts → redirects to callback
- Callback receives `code`, `state`, and optionally `setup_action=install` query parameters
  - `setup_action` parameter is ignored (not needed for token exchange)
  - Existing state verification and code exchange logic handles this

## Configuration

- GitHub App name (for install URL construction) must be available as an environment variable or hardcoded
- Option A: Hardcode `tane-app` in the redirect URL
- Option B: Add `GITHUB_APP_SLUG` environment variable
- Decision: Use environment variable (`GITHUB_APP_SLUG`) for flexibility — app name may differ across deployments

## Env additions

- `GITHUB_APP_SLUG`: The GitHub App's URL slug (e.g., `tane-app`)
