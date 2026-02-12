# Repository Setup Guidance

Guide users to create the `ideas` repository via actionable error messages. No auto-creation, no Administration permission.

## Current state

- `ensureRepo` throws a generic error: `Repository "owner/ideas" not found. Please create it on GitHub first.`
- No link, no instructions on how to create it

## Target state

- `ensureRepo` error message includes a direct link to create the repository
- GitHub App permissions remain **Contents: Read & Write only** (no Administration)

## ensureRepo changes

### Scenarios

- Repo exists → no-op (unchanged)
- Repo does not exist (404) → error with actionable message including create URL:
  `"Repository not found. Create it at https://github.com/new?name=ideas&private=true&description=Idea+management+repository+powered+by+tane then retry."`

## Rationale for not auto-creating

- `POST /user/repos` requires Administration: Read & Write on the GitHub App
- Administration permission also allows repo deletion — too broad for a one-time operation
- Providing a direct `github.com/new` link with pre-filled parameters is nearly as convenient
