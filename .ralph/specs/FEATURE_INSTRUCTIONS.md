# FEATURE_INSTRUCTIONS.md – [FEATURE_NAME]

## Feature Overview

**Feature**: [Short title, e.g., "Petition Builder – Address Lookup & Demand Selection"]  
**Goal**: [One-sentence business/user value, e.g., "Allow users to enter their address, auto-detect representatives at all levels, select a pre-vetted demand, and send email/physical letter."]  
**Acceptance Criteria** (must all be met):

- [ ] List measurable outcomes here (bullet form)
- [ ] e.g., Address form validates ZIP, shows loading state, displays reps correctly
- [ ] e.g., Form submits via Server Action, integrates Lob stub
- [ ] e.g., UI matches calm Eisenhower tone (muted palette, generous whitespace)
- [ ] e.g., Mobile-first responsive, a11y AA compliant
- [ ] Tests cover ≥70% of new/changed lines (unit + integration)

## Strict Rules – Follow Exactly

1. **Branching & Git Workflow**
   - Create a new feature branch immediately: `git checkout -b [logical-kebab-case-name]`  
     Suggested name: `[BRANCH_NAME_SUGGESTION]` (e.g., `feat/petition-builder-address-lookup`)
   - All work **must** happen on this branch.
   - **Never** commit directly to `dev` or `main`.
   - Use **Conventional Commits** for every commit:  
     Format: `<type>[optional scope]: <description>`  
     Common types: `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `chore`, `ci`  
     Examples:
     - `feat(petition): add address lookup component`
     - `fix(ui): correct focus outline contrast`
     - `refactor: extract reusable form hook`
     - `test(petition): add integration test for form submission`
   - Commit often, small & focused.

2. **Planning Phase (Do First)**
   - Read the entire current codebase structure, existing patterns, and MASTER_CONTEXT.md / instructions.md.
   - Propose a detailed implementation plan before writing any code:
     - Folder/file structure changes (if any)
     - New components, hooks, Server Actions, API routes, DB schemas/models
     - Data flow (client → server → DB → response)
     - Reused existing patterns (e.g., Server Components, Tailwind classes, Zod schemas)
     - Testing approach (unit with Vitest/Jest, integration with MSW if needed)
   - Wait for my explicit approval before proceeding past planning.

3. **Coding Standards & Best Practices**
   - **Next.js App Router** (latest stable): Prefer Server Components, use `async` where possible, streaming if applicable.
   - **TypeScript**: Strict mode, no `any`, exhaustive unions, Zod for runtime validation.
   - **Tailwind**: Utility-first, follow existing design tokens/palette, shadcn/ui components if already in use.
   - **MongoDB / Mongoose** (or your ODM): Schema-first, lean queries, indexes where needed.
   - Follow **current project patterns** (file naming, folder structure, naming conventions, error handling).
   - Apply **2025+ expert best practices**:
     - Partial Prerendering / Streaming when beneficial
     - Server Actions over API routes for mutations
     - Colocation of components/logic
     - Minimal client-side JS, progressive enhancement
     - Accessibility: semantic HTML, ARIA, keyboard nav, focus states
     - Performance: image optimization, no unnecessary renders
   - Comments: Sparse but precise. Explain **why** (not what) when non-obvious.
   - **Do NOT** assume or infer anything unclear → stop and ask for clarification.

4. **Testing**
   - Add unit tests (components, hooks, utils) and integration tests (Server Actions, data flows).
   - Target ~70% coverage on new/changed code (use coverage report if available).
   - Use existing test setup (Vitest/Jest + React Testing Library + MSW if present).
   - No full E2E required unless critical user flow.

5. **Refactoring & Improvements**
   - If you spot weak areas (duplication, inefficiency, anti-patterns, security/perf concerns):
     - Document them clearly in a separate section
     - Do **NOT** fix without my explicit approval
     - Suggest alternatives with pros/cons

6. **Completion Workflow**
   - After implementing + testing the feature:
     1. Commit all changes on the feature branch
     2. Show me a `git diff` summary or key files
     3. **Stop and wait** for my review/approval
   - Only after my explicit "merge approved":
     - Merge feature branch into `dev`: `git checkout dev && git merge --no-ff [feature-branch]`
     - Merge `dev` into `main` (if appropriate): `git checkout main && git merge --no-ff dev`
     - Push all branches: `git push origin [feature-branch] dev main`
   - Delete feature branch locally/remote after merge (optional, your call)

7. **Final Output**  
   Once everything is merged and pushed:  
   Output a short **summary** (2–3 paragraphs max, plain language):
   - What was built (key changes)
   - How it was implemented (main technical decisions)
   - Why it matters (user value + alignment with project goals)

Begin now: Read /Users/adamcasey/Desktop/Copilot Prompts/INSTRUCTIONS.md in its entirety then this file fully, confirm understanding, then output your detailed implementation plan.
