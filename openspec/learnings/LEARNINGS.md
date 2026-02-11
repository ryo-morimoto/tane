# Learnings

Knowledge accumulated through the project. Extracted from each change's review.

<!-- New learnings are appended below by /compound:ship -->

## review-20260211: Initial Scaffold

- Don't put non-deterministic commands (e.g. server startup) in `showboat exec`. Record only deterministic commands
- Whether `nodejs_compat` flag is needed should be verified when implementing MCP SDK
- Design document consistency review is useful even at the scaffold stage
