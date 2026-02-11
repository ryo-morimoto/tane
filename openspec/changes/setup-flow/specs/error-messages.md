# Error Messages

Provide actionable error messages when setup is incomplete.

## Current state

- Missing token → `{"error":"Missing or invalid Authorization header"}` (401)
- Invalid token → `{"error":"Invalid or expired token"}` (401)
- Repo not found → MCP tool error: `Repository "owner/ideas" not found. Please create it on GitHub first.`
- App not installed → same as invalid token (GitHub API returns 401 for uninstalled app tokens)

## Target state

Error messages guide users to the specific action needed with direct links.

## ensureRepo error

- Repo not found (404) → `"Repository not found. Create it at https://github.com/new?name=ideas&private=true&description=Idea+management+repository+powered+by+tane then retry."`

## MCP tool errors

### Scenarios

- `GitHubApiError` 401 during tool execution → `"Authentication failed. Re-authorize at {origin}/auth/github"`
- `GitHubApiError` 403 on repo operations → `"Permission denied. Ensure the tane GitHub App is installed and has access to the ideas repository: https://github.com/apps/{appSlug}/installations/new"`
- `ensureRepo` error (plain Error, not GitHubApiError) → pass through as-is (already contains actionable message with create URL)
- Other errors → `"An error occurred: {message}"`

## Auth endpoint errors

No changes needed — existing error responses (400, 403) are adequate for the OAuth flow.
