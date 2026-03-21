# BUGFIX_INSTRUCTIONS.md – [BUG_OR_ISSUE_ID]

## Issue Overview

**Issue**: [Short title, e.g., "Petition form submission fails on invalid ZIP codes" / "Address lookup component re-renders excessively"]  
**Type**: [Bug / Performance / Technical Debt / Accessibility / Security / Other]  
**Severity**: [Critical / High / Medium / Low]  
**Reproduction Steps**:

1.
2.
3. **Observed Behavior**: [Describe what happens now]  
   **Expected Behavior**: [Describe what should happen]  
   **Environment**: [Browser(s), device(s), Next.js version, etc. if relevant]  
   **Related Links**: [GitHub issue #, Sentry error, Lighthouse report URL, etc.]

## Acceptance Criteria (all must be met)

- [ ] Root cause identified and documented
- [ ] Fix resolves the reported issue without introducing regressions
- [ ] No unintended side effects in related flows (e.g., other form submissions, other pages)
- [ ] Performance improved or maintained (if perf-related: Lighthouse score unchanged or better, no added CLS/LCP issues)
- [ ] Tests added/updated to prevent regression (target ≥70% coverage on changed code)
- [ ] UI/tone remains calm, accessible (WCAG 2.1 AA), and aligned with project principles
- [ ] Change is minimal and respects existing patterns

## Strict Rules – Follow Exactly

1. **Branching & Git Workflow**
   - Create a new fix branch immediately: `git checkout -b [logical-kebab-case-name]`  
     Suggested name: `fix/[component-or-area]-[short-issue-slug]`  
     Examples: `fix/petition-form-zip-validation`, `perf/address-lookup-rerenders`
   - All work **must** happen on this branch. Never commit to `dev` or `main`.
   - Use **Conventional Commits**:  
     Common types for fixes: `fix`, `perf`, `refactor`, `test`  
     Examples:
     - `fix(petition): guard against invalid ZIP in address lookup`
     - `perf(ui): memoize rep list rendering`
     - `test(address): add unit test for invalid input handling`
   - Commit small, focused, and often.

2. **Diagnosis & Planning Phase (Do First)**
   - Read relevant codebase sections, MASTER_CONTEXT.md, and instructions.md.
   - **Do NOT** jump to code changes.
   - First output a clear diagnosis & plan:
     - Root cause hypothesis (with evidence: stack trace, console logs, profiler data, etc.)
     - Proposed minimal fix(es)
     - Files/components affected
     - Potential side effects / areas to regression-test
     - Testing strategy (unit, integration, manual verification steps)
     - If perf-related: before/after metrics you plan to measure
   - Wait for my explicit approval before writing any code.

3. **Coding Standards & Best Practices**
   - Follow existing project patterns (naming, structure, error handling, Tailwind usage).
   - Apply current best practices for Next.js / TypeScript / Tailwind / MongoDB:
     - Prefer memoization (React.memo, useMemo) for perf issues
     - Use Server Components / Server Actions where appropriate
     - Validate inputs with Zod
     - Avoid unnecessary client-side state
     - Keep changes surgical — prefer fixes over large refactors unless approved
   - Comments: Only where non-obvious (e.g., “Why we debounce here”).
   - **Never** assume or infer missing context → stop and ask for clarification immediately.

4. **Testing & Validation**
   - Add or update unit/integration tests to cover the fixed behavior and prevent regression.
   - Target ~70% coverage on changed lines.
   - If perf-related: include before/after measurements (e.g., React DevTools profiler, Lighthouse).
   - Manually verify the fix in relevant environments.
   - No full E2E required unless the bug is in a critical path.

5. **Refactoring & Broader Improvements**
   - If you identify related weaknesses (duplication, brittle code, missed edge cases, perf opportunities):
     - Document them in a separate “Observations” section
     - Do **NOT** fix or refactor them without my explicit approval
     - Suggest targeted next steps with trade-offs

6. **Completion & Review Workflow**
   - After implementing + testing:
     1. Commit all changes on the fix branch
     2. Provide:
        - `git diff` summary or key changed files
        - Verification steps I should run
        - Any new test coverage numbers
     3. **Stop and wait** for my review/approval
   - Only after my explicit “merge approved”:
     - Merge fix branch into `dev`: `git checkout dev && git merge --no-ff [fix-branch]`
     - Merge `dev` into `main` (if appropriate): `git checkout main && git merge --no-ff dev`
     - Push all branches: `git push origin [fix-branch] dev main`
   - (Optional) Delete feature branch locally/remote after merge

7. **Final Output**  
   Once merged and pushed:  
   Output a concise **summary** (2–3 paragraphs max, plain language):
   - What the issue was and its root cause
   - How it was fixed (key code changes, techniques used)
   - Verification results and why the fix matters (user impact, stability, perf)

Begin now: Read /Users/adamcasey/Desktop/Copilot Prompts/INSTRUCTIONS.md and this file fully, confirm understanding, then output your diagnosis and detailed fix plan.
