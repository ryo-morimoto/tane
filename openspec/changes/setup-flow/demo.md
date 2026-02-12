# setup-flow: Unified Install + Auth, Actionable Errors

*2026-02-12T04:37:51Z*

## Tests pass (77 tests, 0 type errors)

```bash
bun test 2>&1 | grep -E '(pass|fail|expect)'
```

```output
 77 pass
 0 fail
 118 expect() calls
```

```bash
bunx tsc --noEmit 2>&1 && echo 'No type errors'
```

```output
No type errors
```

## Auth redirect targets App install page

```bash
curl -s -o /dev/null -w '%{redirect_url}\n' https://tane.ryo-o.dev/auth/github | sed 's/?state=.*//' 
```

```output
https://github.com/apps/tane-app/installations/new
```

## Health check confirms deployment

```bash
curl -s https://tane.ryo-o.dev/health && echo
```

```output
{"status":"ok"}
```

## Manual verification (token-dependent, not re-runnable)

- OAuth flow: visited /auth/github, redirected to App install page, completed OAuth, received ghu_ token
- MCP initialize: returned server info with name=tane, version=0.1.0
- create_idea: returned Created idea: 2026-02-12-setup-flow-verification with full markdown
- formatError: unit tested — 401 re-authorize link, 403 install link, other GitHubApiError wrapped, plain Error pass-through, non-Error stringified
