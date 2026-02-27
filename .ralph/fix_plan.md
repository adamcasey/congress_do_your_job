# Ralph Fix Plan

## Project State (as of 2026-02-25)

- Next.js 16 + TypeScript + Tailwind CSS on MongoDB Atlas
- Build: passing | Tests: 176 passing across 25 files
- Branch: `dev` | Production redirects to `/coming-soon` (feature-flagged via LaunchDarkly)
- MVP features partially built: rep lookup, bill tracking, waitlist, AI bill summaries, scorecard engine + UI

## High Priority

- [x] Extract hardcoded mock data from homepage into API-driven or config-driven sources
  - Built `/api/v1/congress/stats` → real bill advancement counts (this week vs last week) from Congress.gov
  - Added `useCongressStats` hook; productivityMetrics bills card + hero metrics now show live data
  - Remaining metrics (hearings, attendance, floor hours) show '—' / 'data coming soon'; require additional data sources
  - `SectionHeader` gained `dataStatus` prop ('todo'|'partial'|'live'); productivity section now shows 'Partial live data'
  - Static editorial sections (weeklyBriefing, deadlines, choreList, officials, civicActions) intentionally kept for digest pipeline
- [x] Fix homepage production redirect logic (was unconditionally redirecting to /coming-soon in production)
  - Fixed: `useEffect` now checks `showComingSoon` flag before redirecting
  - When flag is false (or toggled off in LaunchDarkly), homepage renders normally in production
- [ ] Implement weekly digest generation pipeline
  - Prisma model `DigestEdition` exists but no generation logic
  - Email templates exist (`WeeklyDigest.ts`) but aren't wired to cron
  - Need: data collection → summary generation → email sending
- [x] Implement scorecard scoring engine v1.0.0
  - Created `src/types/scorecard.ts` — scoring types, enums, input/output interfaces
  - Created `src/services/scorecard-calculator.ts` — pure-function engine (6 categories, transparent methodology)
  - 32 tests passing in `tests/backend/services/scorecard-calculator.test.ts`
  - Categories: attendance, legislation, bipartisanship, committee work, civility, theater ratio
  - Next: data collection service to bridge Congress.gov API → ScoringInput
- [x] Build scorecard data collection service (Congress.gov API → ScoringInput)
  - Created `src/services/scorecard-data-collector.ts` — bridges Congress.gov API to ScoringInput
  - Fetches member profile, sponsored bills, cosponsored bills in parallel
  - Legislation data: fully derived from API (bill counts, advancement stage detection)
  - Bipartisanship data: partially derived (cross-party detection via sponsor party comparison)
  - Committee, attendance, civility, theater: neutral defaults (awaiting additional data sources)
  - DataSourceReport tracks which categories are live/partial/default
  - Uses existing cache infrastructure (6-hour SCORECARD TTL)
  - 11 tests in `tests/backend/services/scorecard-data-collector.test.ts`
  - Next: scorecard API route to expose via REST
- [x] Build scorecard API route (`/api/v1/scorecard/:bioguideId`)
  - Created `src/app/api/v1/scorecard/[bioguideId]/route.ts`
  - GET endpoint: collects data via data-collector → calculates via calculator → returns scorecard + data source transparency
  - Supports `period` param: session (default), yearly, quarterly
  - Bioguide ID validation (uppercase letter + 6 digits)
  - Congress.gov 404 → 404 passthrough, proper error handling
  - Cache integration via getOrFetch with SCORECARD TTL (6h), skipCache param for dev
  - Cache status headers (X-Cache-Status, X-Cache-Stale, X-Cache-Age)
  - 10 tests in `tests/backend/api/scorecard.test.ts`
  - Next: scorecard UI components
- [x] Build scorecard UI components (score display, category breakdown, methodology page)
  - ScorecardGauge (SVG arc, grade color), ScorecardCategoryBreakdown (expandable rows), ScorecardCard
  - /scorecard/methodology static page with all formulas, weights, grade table, data limitations
  - Merged to dev → main; 168 tests passing (24 test files)

## Medium Priority

- [ ] Add Clerk authentication integration
  - Prisma `User` model has `clerkId` field ready
  - No Clerk SDK installed yet
- [ ] Build petition system UI and API
  - Prisma models `Petition` and `PetitionSignature` exist
  - No API routes or components built
- [ ] Connect homepage "See this week's briefing" and "Open profile" buttons (currently dead)
- [ ] Replace "TODO" source links in choreList items with real Congress.gov URLs
- [ ] Add error boundaries to key pages

## Low Priority

- [ ] Implement Stripe membership/payment flow
- [ ] Implement Lob.com physical mail integration
- [ ] Add Eisenhower Fund pooled donation logic
- [ ] Mobile-specific layout optimizations
- [ ] Performance: evaluate if LaunchDarkly client-side SDK is needed (adds bundle weight)

## Completed

- [x] Project enabled for Ralph
- [x] Codebase review and architecture documentation
- [x] Remove debug console.log statements from homepage (LD Debug logs)
- [x] Wire homepage email signup form to existing WaitlistForm component
- [x] Scorecard scoring engine v1.0.0 (types + calculator + 32 tests)
- [x] Scorecard data collection service (Congress.gov API → ScoringInput, 11 tests)
- [x] Scorecard API route (`/api/v1/scorecard/[bioguideId]`, 10 tests)
- [x] Fix homepage production redirect to respect `showComingSoon` feature flag

## Notes

- Build: `npm run build` | Tests: `npm test` | Dev: `npm run dev`
- 11 API endpoints under `/api/v1/` + 1 cron + 2 test endpoints
- Feature flags via LaunchDarkly (client + server SDKs)
- Redis caching via Upstash for API responses
- Scorecard calculator tests: 32/32 in tests/backend/services/scorecard-calculator.test.ts
- Scorecard data collector tests: 11 tests covering legislation, bipartisanship, defaults, error handling
- Scorecard API tests: 11 tests in tests/backend/api/scorecard.test.ts
- homepage-cleanup changes cherry-picked to dev and merged to main directly
