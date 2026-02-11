---
description: "Full automated cycle: Plan → Implement → Verify → Review → Learn → Archive"
---
# Compound Ship

## Instructions

You are running the full compound engineering cycle for: **$ARGUMENTS**

Read `openspec/learnings/LEARNINGS.md` first — apply past learnings throughout.

### Phase 1: Plan

Check if `openspec/changes/` already has a folder for this change.

**If no existing change:**
1. Run `/opsx:new` with a slug derived from `$ARGUMENTS`
2. Run `/opsx:ff` to generate proposal, specs, design, tasks
3. STOP and tell the human: "Proposal ready for review. Approve to continue, or edit specs/ first."
4. Wait for human approval before proceeding.

**If change already exists (proposal.md present):**
1. Read all artifacts in the change folder
2. Proceed to Phase 2

### Phase 2: Implement

1. Run `uvx showboat --help` to learn the tool (first time only)
2. Implement using **Red/Green TDD**:
   - For each task in tasks.md:
     a. Write a failing test
     b. Run tests, confirm failure
     c. Write minimum code to pass
     d. Run tests, confirm pass
     e. Check off the task: `- [x]`
   - Run full test suite after all tasks

### Phase 3: Verify

Create execution evidence using Showboat. **NEVER edit demo.md directly.**

```bash
CHANGE="<change-slug>"
DEMO="openspec/changes/$CHANGE/demo.md"

# Initialize
showboat init "$DEMO" "$CHANGE - Demo"

# Record test results
showboat exec "$DEMO" bash 'bun test 2>&1 | tail -30'

# For each scenario in specs/:
# Read openspec/changes/$CHANGE/specs/ and exercise every scenario
showboat note "$DEMO" '## Scenario: <description>'
showboat exec "$DEMO" bash '<command that exercises the scenario>'

# If this project has a Web UI:
# rodney start
# rodney open <url>
# showboat image "$DEMO" 'rodney screenshot <name>.png && echo <name>.png'
# rodney stop

# Verify reproducibility
showboat verify "$DEMO"

# Summary
showboat note "$DEMO" '## Checkpoint Summary
- Tests: N passed
- Scenarios demonstrated: N/N
- showboat verify: passed/failed'
```

Every scenario in `openspec/changes/$CHANGE/specs/` MUST have a corresponding
`showboat exec` in demo.md. If an exec fails: fix the code, `showboat pop`, re-exec.

### Phase 4: Review

Review your own work. Create `openspec/changes/$CHANGE/review.md`:

```markdown
# Review: $CHANGE

## Code Review
- [ ] All tests pass
- [ ] No unnecessary dependencies added
- [ ] Error handling covers edge cases
- [ ] Types are correct and complete

## Demo Review
- [ ] All spec scenarios covered in demo.md
- [ ] showboat verify passed
- [ ] No hardcoded test data in production code

## Issues Found
### [MUST FIX]
- (list critical issues)

### [SHOULD FIX]
- (list improvements)

### [NOTE]
- (observations for future reference)
```

**[MUST FIX] auto-correction:**
- Attempt to fix each [MUST FIX] issue
- Re-run tests and `showboat verify` after each fix
- If a fix fails twice, STOP and report to human:
  "Could not auto-fix: <issue>. Human intervention needed."

### Phase 5: Learn

Extract learnings and append to `openspec/learnings/LEARNINGS.md`:

```markdown
## <change-slug> (<date>)

### What worked
- ...

### What didn't work
- ...

### Patterns discovered
- ...

### Issues found in demo that tests missed
- ...
```

Also create `openspec/changes/$CHANGE/learnings.md` with change-specific details.

### Phase 6: Archive

1. Confirm all [MUST FIX] issues are resolved
2. Run `/opsx:archive $CHANGE`
3. demo.md and review.md are archived together as verification evidence

## Rules

- NEVER skip the verify phase
- NEVER edit demo.md directly — always use showboat commands
- NEVER add `<!-- no-checkpoint -->` yourself — only humans can opt out
- ALWAYS read LEARNINGS.md before planning
- If showboat verify fails, fix and re-verify before proceeding to review
- Stop for human approval after Phase 1 (plan) if this is a new change
