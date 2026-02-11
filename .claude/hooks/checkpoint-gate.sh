#!/bin/bash
set -euo pipefail

# checkpoint-gate.sh
# Claude Code Stop hook: blocks completion when demo.md is missing
# for OpenSpec changes that have all tasks checked off.

CHANGES_DIR="${CLAUDE_PROJECT_DIR}/openspec/changes"
[ -d "$CHANGES_DIR" ] || exit 0

MISSING=()
NO_EXEC=()
NO_SUMMARY=()

for dir in "$CHANGES_DIR"/*/; do
  [ -d "$dir" ] || continue
  change=$(basename "$dir")
  [ "$change" = "archive" ] && continue

  TASKS="$dir/tasks.md"
  DEMO="$dir/demo.md"

  [ -f "$TASKS" ] || continue
  grep -q '<!-- no-checkpoint -->' "$TASKS" 2>/dev/null && continue
  grep -qE '^\s*- \[ \]' "$TASKS" 2>/dev/null && continue

  # All tasks done — enforce checkpoint

  if [ ! -f "$DEMO" ]; then
    MISSING+=("$change")
    continue
  fi

  if ! grep -qE '^```bash' "$DEMO" 2>/dev/null; then
    NO_EXEC+=("$change")
    continue
  fi

  if ! grep -q '## Checkpoint Summary' "$DEMO" 2>/dev/null; then
    NO_SUMMARY+=("$change")
    continue
  fi
done

if [ ${#MISSING[@]} -eq 0 ] && [ ${#NO_EXEC[@]} -eq 0 ] && [ ${#NO_SUMMARY[@]} -eq 0 ]; then
  exit 0
fi

MSG=""

if [ ${#MISSING[@]} -gt 0 ]; then
  MSG+="CHECKPOINT MISSING — completed changes need demo.md:\n"
  for c in "${MISSING[@]}"; do MSG+="  ✗ openspec/changes/$c/\n"; done
  MSG+="\n"
fi

if [ ${#NO_EXEC[@]} -gt 0 ]; then
  MSG+="NO EXEC RESULTS — demo.md has no showboat exec output:\n"
  for c in "${NO_EXEC[@]}"; do MSG+="  ⚠ openspec/changes/$c/demo.md\n"; done
  MSG+="  Use: showboat exec <demo.md> bash '<command>'\n\n"
fi

if [ ${#NO_SUMMARY[@]} -gt 0 ]; then
  MSG+="NO SUMMARY — demo.md needs '## Checkpoint Summary':\n"
  for c in "${NO_SUMMARY[@]}"; do MSG+="  ⚠ openspec/changes/$c/demo.md\n"; done
  MSG+="  Use: showboat note <demo.md> '## Checkpoint Summary ...'\n\n"
fi

echo -e "$MSG" >&2
exit 2
