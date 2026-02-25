# Ralph Fix Plan

## Project State (as of 2026-02-24)
- Next.js 16 + TypeScript + Tailwind CSS on MongoDB Atlas
- Build: passing | Tests: 143 passing across 22 files
- Branch: `dev` | Production redirects to `/coming-soon`
- MVP features partially built: rep lookup, bill tracking, waitlist, AI bill summaries

## High Priority
- [ ] Extract hardcoded mock data from homepage into API-driven or config-driven sources
  - `page.tsx` has inline arrays for weeklyBriefing, deadlines, choreList, productivityMetrics, officials, civicActions
  - All display "TODO: connect to live data" badges
  - Should pull from Congress.gov API or MongoDB
- [ ] Fix homepage production redirect logic (currently unconditionally redirects to /coming-soon in production regardless of feature flag state)
  - The `useEffect` at line ~291 ignores the `showComingSoon` flag value
- [ ] Implement weekly digest generation pipeline
  - Prisma model `DigestEdition` exists but no generation logic
  - Email templates exist (`WeeklyDigest.ts`) but aren't wired to cron
  - Need: data collection → summary generation → email sending
- [ ] Implement scorecard calculation engine
  - Prisma model `Scorecard` and `ScoreComponent` exist
  - `scorecard-calculator.test.ts` exists with 32 tests (has helper functions)
  - Need: data ingestion → scoring algorithm → storage → display

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

## Notes
- Build: `npm run build` | Tests: `npm test` | Dev: `npm run dev`
- 10 API endpoints under `/api/v1/` + 1 cron + 2 test endpoints
- Feature flags via LaunchDarkly (client + server SDKs)
- Redis caching via Upstash for API responses
- Flaky test: `scorecard-calculator.test.ts` occasionally fails in full suite but passes in isolation
