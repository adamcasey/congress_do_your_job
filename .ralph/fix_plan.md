# Ralph Fix Plan

## Project State (as of 2026-03-13)

- Next.js 16.1.6 + TypeScript + Tailwind CSS on MongoDB Atlas
- Build: passing | Tests: 339 passing across 40 files
- Branch: `dev` | Production redirects to `/coming-soon` (feature-flagged via LaunchDarkly)
- MVP features partially built: rep lookup, bill tracking, waitlist, AI bill summaries, scorecard engine + UI
- Representative lookup now uses Google Civic Information API (chamber detection fixed)

## High Priority

- [x] The scorecard feature under `/scorecard` has been fixed:
  - Loading UI (animated skeleton) already existed and displays while scorecard loads
  - Score = 51 for all legislators fixed: `isWithinPeriod` now uses `introducedDate` (always present in Congress.gov list responses) instead of `updateDate` (which is absent from member sponsored-legislation list items, causing all bills to be filtered out)
  - Chamber label fixed: `members/search` API now normalizes "House of Representatives" → "House" before returning, so the `m.chamber === "House"` check works correctly
  - Formula section removed from the expanded category detail panel in the UI

## Medium Priority

## Low Priority

- [x] Implement Stripe membership/payment flow
- [ ] Implement Lob.com physical mail integration
- [ ] Add Eisenhower Fund pooled donation logic
- [ ] Mobile-specific layout optimizations
- [ ] Performance: evaluate if LaunchDarkly client-side SDK is needed (adds bundle weight)

## Notes

- Build: `npm run build` | Tests: `npm test` | Dev: `npm run dev`
- 11 API endpoints under `/api/v1/` + 1 cron + 2 test endpoints
- Feature flags via LaunchDarkly (client + server SDKs)
- Redis caching via Upstash for API responses
- Scorecard calculator tests: 32/32 in tests/backend/services/scorecard-calculator.test.ts
- Scorecard data collector tests: 11 tests covering legislation, bipartisanship, defaults, error handling
- Scorecard API tests: 11 tests in tests/backend/api/scorecard.test.ts
- homepage-cleanup changes cherry-picked to dev and merged to main directly
- All completed work tracked in `.ralph/COMPLETED_WORK.md`
