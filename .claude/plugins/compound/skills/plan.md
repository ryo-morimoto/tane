---
description: "Generate proposal only for team alignment. Run /compound:ship to implement after approval."
---
# Compound Plan

## Instructions

You are creating a plan for: **$ARGUMENTS**

1. Read `openspec/learnings/LEARNINGS.md` — apply past learnings to the plan
2. Run `/opsx:new` with a slug derived from `$ARGUMENTS`
3. Run `/opsx:ff` to generate all planning artifacts:
   - proposal.md
   - specs/ (delta specs with scenarios)
   - design.md
   - tasks.md

4. Review the generated artifacts yourself:
   - Are the specs testable? Each scenario should be verifiable with a command.
   - Are tasks appropriately sized? Each should be completable in one TDD cycle.
   - Does the design align with project conventions in CLAUDE.md?

5. Report to the human:
   ```
   Plan ready: openspec/changes/<slug>/

   Artifacts:
   - proposal.md: <1-line summary>
   - specs/: <N> scenarios across <M> domains
   - design.md: <key architectural decision>
   - tasks.md: <N> tasks

   Review and approve, then run:
     /compound:ship <slug>
   ```

6. STOP. Do not proceed to implementation.

## Rules

- ALWAYS read LEARNINGS.md first
- NEVER start implementation — this command is plan-only
- Make specs verifiable: each scenario should map to a concrete command
