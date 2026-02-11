# Error Messages

Provide actionable error messages when setup is incomplete.

## Current state

- Missing token → `{"error":"Missing or invalid Authorization header"}` (401)
- Invalid token → `{"error":"Invalid or expired token"}` (401)
- Repo not found → MCP tool error: `Repository "owner/ideas" not found. Please create it on GitHub first.`
- App not installed → same as invalid token (GitHub API returns 401 for uninstalled app tokens)

## Target state

Error messages guide users to the specific action needed.

## MCP tool errors

### Scenarios

- Repo not found (404) after auto-create attempt fails → `"Failed to create the ideas repository. Please check that the tane GitHub App is installed on your account: https://github.com/apps/{app-slug}/installations/new"`
- GitHub API returns 403 on repo operations → `"Permission denied. Please ensure the tane GitHub App is installed and has access to the ideas repository: https://github.com/apps/{app-slug}/installations/new"`
- GitHub API returns 401 during tool execution → `"Authentication failed. Your token may have expired. Please re-authorize at https://{origin}/auth/github"`

## Auth endpoint errors

No changes needed — existing error responses (400, 403) are adequate for the OAuth flow.
