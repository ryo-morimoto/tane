# Proposal: setup-flow

## Motivation

The current setup for tane requires three separate manual steps that users must discover on their own:

1. Install the GitHub App on their account (`github.com/apps/tane-app/installations/new` — URL not surfaced anywhere)
2. Create the `ideas` repository manually
3. Authorize via `/auth/github` to obtain a token

This is too complex. Users don't know about the App install requirement, can't discover the install URL, and get a confusing 404 when the `ideas` repo doesn't exist.

## Solution

Unify the setup into a single-entry-point flow:

- **App Install + OAuth in one redirect chain**: User visits `/auth/github`, gets directed through App installation (if needed) and OAuth authorization in sequence
- **Auto-create `ideas` repo on first use**: Eliminate the manual repo creation step. When `create_idea` is called and the repo doesn't exist, create it automatically
- **Clear error messages**: If something is missing (App not installed, no repo access), return actionable error messages with URLs

## Scope

- Integrate GitHub App installation into the auth flow (using `setup_url` or install URL redirect)
- Restore `ensureRepo` auto-creation (requires adding Administration: Read & Write permission to the GitHub App)
- Improve error messages when App is not installed or repo is inaccessible

## Trade-offs

- Adding Administration permission is broader than ideal (allows repo deletion), but the alternative (manual setup) is unacceptable UX
- Mitigation: server code only ever creates one specific repo (`ideas`) with a hardcoded name
