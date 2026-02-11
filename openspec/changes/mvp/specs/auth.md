# Auth

## OAuth Web Flow

### handleAuthRedirect

- Request → 302 redirect to GitHub OAuth URL (`github.com/login/oauth/authorize`)
- Includes `client_id` and `scope` parameters
- scope: `repo` (required for private repository access)

### handleAuthCallback

- Request with valid code → obtains token, returns HTML page displaying it
- No code → error response
- Invalid code → error response

### exchangeCode

- Valid code → returns access_token
- POST to GitHub API has correct parameters

## extractToken

### Scenarios

- `Authorization: Bearer xxx` header → `"xxx"`
- `Authorization: bearer xxx` (lowercase) → `"xxx"`
- No header → `null`
- `Authorization: Basic xxx` → `null`
