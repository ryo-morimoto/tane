# Auto-create Repository

Automatically create the `ideas` repository on first use, eliminating the manual setup step.

## Current state

- `ensureRepo` checks if repo exists; throws error with message if not found (404)
- User must manually create `ideas` repo on GitHub before using tane
- GitHub App has Contents: Read & Write only

## Target state

- `ensureRepo` auto-creates the repository if it doesn't exist
- GitHub App has Administration: Read & Write added (required for `POST /user/repos` via `ghu_` token)

## ensureRepo changes

### Scenarios

- Repo exists → no-op (unchanged)
- Repo does not exist (404) → create private repo named `ideas` with description and auto_init
- Repo creation fails (403: insufficient permissions) → error with actionable message: "Failed to create repository. Ensure the GitHub App has Administration permission."
- Repo creation fails (other error) → propagate error

## GitHub App permission changes

- Add: Repository permissions → Administration: Read & Write
- Existing users will see a permission update request on next visit

## Security consideration

- Administration: Read & Write allows repo deletion, not just creation
- Mitigation: server code only calls `POST /user/repos` with hardcoded name `ideas` in `ensureRepo`
- No other code path uses Administration-level endpoints
