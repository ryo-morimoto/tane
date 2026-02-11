---
description: "既存コードの後追いレビュー: Verify → Review → Learn"
---
# Compound Review

## Instructions

You are reviewing existing changes: **$ARGUMENTS**

`$ARGUMENTS` is a git range (e.g., `main..feature-branch`) or a branch name.

### Step 1: Understand the changes

```bash
git log --oneline $ARGUMENTS
git diff --stat $ARGUMENTS
git diff $ARGUMENTS
```

Read the changed files and understand what was done.

### Step 2: Verify

Create execution evidence for the existing implementation.

```bash
DEMO="openspec/changes/review-$(date +%Y%m%d)/demo.md"
mkdir -p "$(dirname "$DEMO")"

showboat init "$DEMO" "Review: $ARGUMENTS"

# Run test suite
showboat exec "$DEMO" bash 'bun test 2>&1 | tail -30'

# Exercise key behaviors introduced by the changes
# (Identify from the diff what new functionality was added)
showboat note "$DEMO" '## Scenario: <behavior from diff>'
showboat exec "$DEMO" bash '<command to exercise it>'

# Verify
showboat verify "$DEMO"

showboat note "$DEMO" '## Checkpoint Summary
- Tests: N passed
- Scenarios demonstrated: N/N
- showboat verify: passed/failed'
```

### Step 3: Review

Create `openspec/changes/review-$(date +%Y%m%d)/review.md`:

- Code quality assessment
- Test coverage gaps
- Potential issues
- [MUST FIX] / [SHOULD FIX] / [NOTE] classification

**[MUST FIX] auto-correction:**
- Attempt to fix. Re-run tests + showboat verify.
- If fix fails twice, report to human.

### Step 4: Learn

Append learnings to `openspec/learnings/LEARNINGS.md`.
Create `openspec/changes/review-$(date +%Y%m%d)/learnings.md`.

### Step 5: Report

```
Review complete: openspec/changes/review-<date>/

- demo.md: <N> scenarios verified
- review.md: <N> MUST FIX, <N> SHOULD FIX, <N> NOTE
- learnings.md: <key takeaways>

[MUST FIX] items auto-fixed: <N>/<total>
Human review needed: <yes/no>
```

## Rules

- NEVER skip verification even for review-only
- ALWAYS extract learnings
- Auto-fix [MUST FIX] items (2 attempts max, then escalate to human)
