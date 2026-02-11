# GitHub API

## gh (fetch wrapper)

### Scenarios

- Successful response → returns parsed JSON
- 404 response → appropriate error
- 401 response → authentication error
- Authorization header is correctly set

## IdeasRepository

### ensureRepo

- Repo exists → no-op
- Repo does not exist → create new (private, with description)

### create

- New Idea → creates file via `PUT /repos/{owner}/{repo}/contents/ideas/{id}.md`
- base64-encoded content is correct
- Commit message is set

### get

- Existing ID → returns Idea object (base64 decode → parseIdea)
- Non-existing ID → error

### update

- Existing Idea → fetches current SHA then PUTs (optimistic locking)
- SHA mismatch (concurrent update) → 409 error

### list

- Directory has files → returns Idea[]
- statusFilter specified → filtered results
- Directory empty or does not exist → empty array

### search

- Query matches ideas → returns matched Idea[]
- No matches → empty array
- Search targets: title + body + tags

## base64 encode/decode

### Scenarios

- ASCII string → correct encode/decode
- Japanese (UTF-8 multibyte) → correct encode/decode
- Empty string → empty string

## getUser

- Valid token → `{ login: "username" }`
- Invalid token → error
