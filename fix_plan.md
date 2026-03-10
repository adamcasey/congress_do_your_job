# Fix Plan — Congress Do Your Job

Last updated: 2026-03-09

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

---

## High Priority (Phase 1 MVP gaps)

### 1. [ ] Petition / One-Click Letter Tool
**Why:** Listed as a core Phase 1 MVP feature. Not yet implemented.
**Scope:**
- `/app/petitions/page.tsx` — petition listing page
- `Petition` Mongoose model (or Prisma schema update)
- `/api/v1/petitions` — CRUD endpoints (GET list, POST sign)
- `PetitionCard` component — shows title, description, signer count, CTA
- `usePetitionSignup` hook using React Query `useMutation`
- Email confirmation on signing (reuse Resend integration)
**Notes:** Neutral, pre-written templates only. No partisan framing.

### 2. [ ] Stripe Membership Integration
**Why:** Revenue path + Phase 1 MVP requirement.
**Scope:**
- Stripe Checkout session endpoint (`/api/v1/stripe/checkout`)
- Stripe webhook handler (`/api/v1/stripe/webhook`) — activate membership on `checkout.session.completed`
- Membership status stored in MongoDB (or Clerk metadata)
- `useSubscription` hook — queries membership status
- Membership CTA component on homepage / /members page
- `.env` additions: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
**Notes:** $5–$10/month or $50–$100/year tiers per CLAUDE.md.

### 3. [ ] ScorecardLookup Integration Test
**Why:** `ScorecardLookup` is a complex stateful component with async flows (member search, scorecard fetch) that has no dedicated component test.
**Scope:**
- `tests/frontend/components/ScorecardLookup.test.tsx`
- Cover: empty state, member search suggestions, member selection, period selector, scorecard fetch, error state
- Mock `fetch` for `/api/v1/members/search` and `/api/v1/scorecard/:id`

---

## Medium Priority

### 4. [ ] Representatives Page — District Snapshot Polish
**Why:** `DistrictSnapshotCard` is implemented but the data integration may have gaps. Validate with real Congress.gov data.
**Scope:**
- Review `/api/v1/district` response shape vs. `DistrictSnapshotCard` prop types
- Add fallback UI for missing district data (at-large districts, DC, territories)
- Ensure `RepresentativeLookup` handles Google Civic API errors gracefully

### 5. [ ] Legislation Search — URL State Persistence
**Why:** Users lose their search query on navigation. Linking to a search result is impossible.
**Scope:**
- Use `useSearchParams` + `useRouter` in `LegislationSearch` to read/write `?q=` param
- Keep client-side state in sync with URL
- Requires moving some logic to a wrapper that uses `Suspense` (Next.js requirement for `useSearchParams`)

### 6. [ ] Weekly Digest Cron — Production-Ready
**Why:** `/api/cron/weekly-digest` exists but likely has stub logic. Needs to actually fire and send emails.
**Scope:**
- Review `/app/api/cron/weekly-digest/route.ts` — identify what's stubbed
- Wire real Congress.gov data fetch into digest builder
- Wire Resend email send
- Configure Vercel cron in `vercel.json` (already has cron config, verify schedule)
- Test with a dry-run mode (no email send, just log output)

### 7. [ ] About Page — Methodology Section Expansion
**Why:** Trust is the product. The methodology page exists but may be incomplete.
**Scope:**
- Review `/app/scorecard/methodology/page.tsx` — fill in any placeholder sections
- Document each scoring category with its formula, data source, and weight
- Add "Data Transparency" section explaining what's real data vs. neutral defaults

### 8. [ ] Test Coverage — Backend API Routes
**Why:** API routes are the most critical code path for correctness, but several routes lack unit tests.
**Scope:**
- `tests/backend/api/scorecard-route.test.ts` (currently missing)
- `tests/backend/api/legislation-search-route.test.ts` (currently missing)
- `tests/backend/api/members-search-route.test.ts` (currently missing)
- Follow pattern from `tests/backend/api/waitlist-route.test.ts`

---

## Low Priority / Future

### 9. [ ] Lob.com Physical Letter Integration
**Phase 2.** Wire Lob.com API for physical letter sending from petition tool.

### 10. [ ] PDF Report Card Generator
**Phase 2.** Per-district PDF scorecards. Consider `@react-pdf/renderer` or Puppeteer headless.

### 11. [ ] Eisenhower Fund (Pooled Donations)
**Phase 3.** Requires Stripe Connect or escrow logic. Scope separately.

### 12. [ ] Local Government Expansion
**Future.** City council / county board data. Heavy scraping work, defer until Phase 4+.

---

## Technical Debt

### TD-1. [ ] Remove Gemini API placeholder
`src/lib/gemini-api.ts` has 0% test coverage and likely contains stub code. Either wire it properly or remove it until Phase 2.

### TD-2. [ ] Logger coverage gap
`src/lib/logger.ts` is at ~59% statement coverage. Add tests for the remaining log level branches.

### TD-3. [ ] GENERAL_NOTES.md — Rotate exposed API keys
`GENERAL_NOTES.md` contains plaintext API keys. These should be in `.env` only and the file should be cleaned up or added to `.gitignore`. Flag for immediate attention.

---

## Completed This Session

- [x] Reusable `SearchBar` component with clear button (`src/components/ui/SearchBar.tsx`)
- [x] Legislation search relevance: title ranking + fuzzy fallback
- [x] Member scorecard search: client-side roster filtering fix
- [x] Header nav links gated behind `show-header-navigation` feature flag
- [x] VSCode debug configuration for Next.js local dev
