#!/bin/bash
set -euo pipefail

# Session start hook for Claude Code on the web
# Installs project dependencies so tests, typecheck, and dev tools work

# Only run in remote (web) environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install dependencies (bun install is fast and leverages cached node_modules)
bun install
