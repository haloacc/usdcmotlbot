---
description: Standard workflow for all debug and feature requests - explore, plan, test, implement, verify
---

# Debug & Feature Request Workflow

**CRITICAL**: This workflow MUST be followed for ALL debug and feature requests. Never commit code changes directly without user verification.

## Phase 1: Research & Root Cause Analysis
1. Explore the codebase to understand the current implementation
2. Identify all potential root causes of the issue
3. Research best practices and optimal solutions
4. Document findings before proposing changes

## Phase 2: Implementation Planning
1. Create/update `implementation_plan.md` artifact with:
   - Problem description and root cause analysis
   - Proposed solution with rationale
   - Alternative approaches considered
   - Files to be modified
   - Potential risks or breaking changes
2. Request user review of the plan via `notify_user`
3. Wait for explicit approval before proceeding

## Phase 3: Test-Driven Development
1. Write test cases BEFORE making code changes
2. Tests should cover:
   - Expected behavior after fix
   - Edge cases
   - Regression prevention
3. Commit tests first (if applicable)

## Phase 4: Implementation
1. Make code changes according to approved plan
2. Ensure all tests pass
3. Run the app locally to verify changes work

## Phase 5: Local Verification
1. **DO NOT COMMIT YET**
2. Ask user to verify changes locally: "Please verify locally that this fix works as expected"
3. Wait for explicit user confirmation
4. Address any feedback or issues

## Phase 6: Version Control
1. Only after user confirms local verification:
   - Commit to `develop` branch first
   - Ask user to verify on preview deployment
2. Only after user confirms preview:
   - Ask: "Ready to merge to production (main)?"
   - Wait for explicit confirmation before merging to `main`

## Branch Strategy
```
develop  → Preview/Staging deployments
main     → Production deployments
```

## Anti-Patterns (NEVER DO THESE)
- ❌ Committing directly without user verification
- ❌ Pushing to main without testing on develop first
- ❌ Skipping the planning phase for "quick fixes"
- ❌ Making assumptions about what the user wants
- ❌ Bundling unrelated changes in one commit

## Exceptions
This workflow may be abbreviated ONLY when:
- User explicitly requests a quick hotfix with urgency
- Change is purely cosmetic with zero risk (typo fixes)
- User explicitly says "just do it" or similar
