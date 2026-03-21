# Ralph Fix Plan

## Project State (as of 2026-03-13)

- Next.js 16.1.6 + TypeScript + Tailwind CSS on MongoDB Atlas
- Build: passing | Tests: 339 passing across 40 files
- Branch: `dev` | Production redirects to `/coming-soon` (feature-flagged via LaunchDarkly)
- MVP features partially built: rep lookup, bill tracking, waitlist, AI bill summaries, scorecard engine + UI
- Representative lookup now uses Google Civic Information API (chamber detection fixed)

## High Priority

- [ ] Implement the roll-call vote API
  - Use Congress.gov API `house-vote/` endpoint
  - This only returns roll-call data for House members so Senate members should display some sort of "coming soon" data accordingly

## Medium Priority

- [ ] the `/methodology` page should reformat the "formula" UI so it reads less like computer code and more like a math formula

## Low Priority

- [x] Implement Lob.com physical mail integration
- [x] Add Eisenhower Fund pooled donation logic

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
