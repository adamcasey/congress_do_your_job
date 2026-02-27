# CODE_REVIEW_INSTRUCTIONS.md – [REVIEW_TARGET]

## Review Scope

**What to review**:

- [ ] Single file / component: [path, e.g., components/hero.tsx]
- [ ] Pull request / branch: [branch name or PR link]
- [ ] Feature area: [e.g., petition builder form flow]
- [ ] Diff / pasted code: [paste or describe the code block to review]

**Review Focus** (prioritize in this order):

1. Correctness & bug risk
2. Alignment with project principles (calm tone, non-partisan UX, Eisenhower aesthetic)
3. Performance & bundle size implications
4. Accessibility (WCAG 2.1 AA)
5. Type safety & runtime validation
6. Maintainability & adherence to existing patterns
7. Test coverage & test quality
8. Security (input handling, PII, rate limiting)
9. Best-practice violations (Next.js 14+, TypeScript strict, Tailwind, Server Components)

## Strict Rules – Follow Exactly

- Be brutally honest but constructive. No sugar-coating serious issues.
- Never assume missing context — if something is unclear, list it as a question.
- Do NOT suggest large refactors unless they are low-risk / high-value and clearly justified.
- Do NOT rewrite large sections of code unless explicitly asked.
- Prefer small, surgical suggestions with clear rationale.
- Use conventional commit-style subject lines for suggested changes (e.g., `fix:`, `refactor:`, `perf:`, `test:`).
- Structure output strictly as shown below — no deviation.

## Required Output Structure

1. **Overall Assessment** (1–3 sentences)
   - Severity summary (clean / minor issues / moderate concerns / critical problems)
   - High-level recommendation (merge as-is / needs fixes / major rework)

2. **Strengths** (bullets)
   - What is done particularly well

3. **Critical / High Severity Issues** (numbered, only if present)
   - File + line range
   - Description
   - Impact (user / perf / security / maintainability)
   - Suggested fix (code snippet if < 10 lines)
   - Conventional commit subject suggestion

4. **Medium / Low Severity Issues & Suggestions** (bullets)
   - Same format as above, grouped by category if many
   - Include perf, a11y, DX, naming, comments, etc.

5. **Questions / Clarifications Needed** (bullets)
   - Anything ambiguous or requiring decision

6. **Test Coverage & Edge Cases**
   - Current coverage of changed/new code
   - Missing test scenarios (list 2–5 most important)

7. **Summary Recommendation**
   - Approve / Approve with changes / Block / Needs discussion
   - Estimated effort for fixes (XS / S / M / L)

Begin now: Read /Users/adamcasey/Desktop/Copilot Prompts/INSTRUCTIONS.md and this file fully, confirm understanding, then perform the review using ONLY the structure above.
