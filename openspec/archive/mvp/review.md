# Review: mvp

## Code Review
- [x] All tests pass (72/72)
- [x] No unnecessary dependencies added (only @modelcontextprotocol/sdk, yaml, zod as specified)
- [x] Error handling covers edge cases (404/401 in GitHub API, missing/invalid auth, state mismatch)
- [x] Types are correct and complete (tsc --noEmit passes with zero errors)

## Demo Review
- [x] All spec scenarios covered in demo.md (8/8)
- [x] showboat verify passed
- [x] No hardcoded test data in production code

## Issues Found
### [MUST FIX]
- (none)

### [SHOULD FIX]
- GitHub API layer functions `createFile` and `updateFile` accept raw `(config, id, content)` rather than `(config, idea: Idea)` as originally specified in tasks.md. The current API is actually cleaner since it separates serialization concerns (core layer handles serialize, github layer handles raw file ops). No change needed.
- `searchFiles` function from the original task was renamed to search logic in `core.ts` (`searchIdeas`). The github layer provides `listFiles` and the core layer handles the filtering. This is a better separation of concerns.

### [NOTE]
- The `nodejs_compat` flag is required for the MCP SDK (it uses Node.js built-ins internally). Already present in wrangler.toml.
- The `server.registerTool` API was used instead of the deprecated `server.tool` API, future-proofing against MCP SDK v2 migration.
- Deploy and live integration testing (tasks.md "Deploy and Verification" section) requires GitHub App credentials and is left for manual execution by the human.
- Per-request McpServer creation is the stateless approach specified in design.md (Option A). This works on Workers but means no session persistence.
