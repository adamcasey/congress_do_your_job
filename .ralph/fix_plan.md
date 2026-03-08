# Ralph Fix Plan

## Project State (as of 2026-03-07)

- Next.js 16.1.6 + TypeScript + Tailwind CSS on MongoDB Atlas
- Build: passing | Tests: 266 passing across 33 files
- Branch: `dev` | Production redirects to `/coming-soon` (feature-flagged via LaunchDarkly)
- MVP features partially built: rep lookup, bill tracking, waitlist, AI bill summaries, scorecard engine + UI

## High Priority — Dashboard Housekeeping (do these before anything else)

- [x] **Remove all LaunchDarkly references from the backend**
  - Audited all files under `src/app/api/`, `src/lib/`, `src/middleware.ts` — no server-side LD imports found
  - `launchdarkly-node-server-sdk` is not present in package.json; all evaluation is client-side via `launchdarkly-react-client-sdk`
  - Build: passing | Tests: 281/281 passing
- [x] **Navbar styling overhaul**
  - border-b-2 + shadow-sm on solid white bg; icon h-10/w-10 (28px img); brand text-lg font-semibold
  - Nav links + auth consolidated into single right-side flex group; padding px-4/semibold
- [x] **Legislation list pagination** (`/legislation`)
  - API route now accepts `offset` param; default page size changed to 8
  - Created `useLegislationSearch` hook using `useInfiniteQuery` (8 results/page)
  - `LegislationSearch` refactored to use the hook: raw `useState+useEffect` fetch removed, named handlers extracted, "Load More" button added
  - 5 tests added in `tests/frontend/hooks/useLegislationSearch.test.ts`
  - Build: passing | Tests: 286/286 passing
- [x] **Fix BillDetailsModal positioning**
  - Root cause: `backdrop-blur-sm` on ancestor can trap `fixed` descendants; `overflow = "unset"` was wrong cleanup
  - Fix: `createPortal` renders modal directly on `document.body`, bypassing CSS containment from any ancestor
  - Fix: save/restore `document.body.style.overflow` properly instead of hardcoding `"unset"`
  - Added `mx-4` for mobile safety; `aria-modal` + `role="dialog"` + `aria-labelledby` for a11y
  - Build: passing | Tests: 286/286 passing
- [x] **Event handler refactor (entire codebase)**
  - Full audit confirmed no violations remain; all setState calls in event props are already wrapped in named handlers
  - `LegislationSearch.tsx` was fixed in the pagination loop; `RecentBills`, `ScorecardLookup`, `RepresentativeLookup` were already clean
  - Build: passing | Tests: 286/286 passing
- [x] **One component per file (entire codebase)**
  - `StatusBadge` → `src/components/ui/StatusBadge.tsx` (with `Status` type + `statusStyles`)
  - `SectionHeader` → `src/components/ui/SectionHeader.tsx` (with `DataStatus` type)
  - Both exported from `src/components/ui/index.ts`; `src/app/page.tsx` updated to import them
  - `BillDetailModal` → `src/components/legislation/BillDetailModal.tsx`; `LegislationSearch.tsx` updated to import it
  - `CategoryRow` → `src/components/scorecard/CategoryRow.tsx` (with helpers `getBarColor`, `formatInputKey`, display maps)
  - `ScorecardCategoryBreakdown.tsx` reduced to a thin wrapper that imports `CategoryRow`
  - Build: passing | Tests: 286/286 passing
- [ ] **react-query adoption (entire codebase)**
  - All data fetching must go through react-query (`useQuery`, `useMutation`, `useInfiniteQuery`)
  - No component should manage async data with raw `useState` + `useEffect` fetching patterns
  - Audit the full codebase and refactor every data-fetching hook or component that bypasses react-query
  - Use `useInfiniteQuery` for paginated lists (e.g. legislation load more)
- [ ] **Fix legislation search relevance** (`/legislation`)
  - Exact title match should always appear first in results
  - Add fuzzy-search support to handle misspellings and partial/incomplete search strings
  - Verify: searching "Protecting our Communities from Sexual Predators Act" returns that bill as result #1
- [ ] **Reusable SearchBar component with clear button**
  - All search inputs across the site must use a single shared `SearchBar` component
  - Component must include an "X" clear button on the right side of the input
  - Replace existing ad-hoc search inputs in `LegislationSearch`, scorecard lookup, and any other location with this component

## High Priority — Previously tracked

- [x] GitHub flagged 8 dependency vulnerabilities (6 high, 2 moderate) on the repo that need to be addressed
  - Upgraded Next.js 16.1.3 → 16.1.6 via `npm audit fix`; all 4 CVEs resolved (DoS via Image Optimizer, RSC deserialization, PPR memory, rollup path traversal)
- [x] Refactor feature flags to use existing LaunchDarkly flags
  - Added useFeatureFlag(flag) hook to src/config/launchdarkly.tsx; eliminates the hasLdState+in-check+Boolean cast pattern duplicated in 3 components
  - Removed launchdarkly-node-server-sdk (installed but never used; all evaluation is client-side via launchdarkly-react-client-sdk)
  - Removed dead featureFlagKeys export
  - FlagGate, homepage, coming-soon page all updated to use the new hook
  - 9 tests added in tests/frontend/hooks/useFeatureFlag.test.ts
  - Build: passing | Tests: 275/275 passing across 34 files
- [x] Add the latest react-query
  - Installed @tanstack/react-query v5.90+; wrapped app layout with QueryClientProvider
  - Refactored useCongressStats, useRecentLegislation, useBillDetails, useBillSummary, useDistrictSnapshot to useQuery
  - Added useDebounce hook; ScorecardLookup reduced from 8→3 useState hooks via useQuery
  - Moved formatDate to shared src/lib/format-date.ts (resolved ScorecardCard TODO)
  - Added tests/frontend/test-utils.tsx with createQueryWrapper for test isolation
  - Build: passing | Tests: 266/266 passing across 33 files
- [x] Go through codebase and complete all lingering `TODO` comments
  - choreList source strings → real Congress.gov search/topic URLs with link rendering
  - dataStatusBadge.todo.label: "TODO: connect to live data" → "Static data" (was user-visible)
  - Added "Look up any member's scorecard →" link from homepage to /scorecard
  - scorecard/page.tsx: removed stale expose-to-dashboard comment
  - cache.ts: replaced DataDog TODO with accurate Sentry doc comment
  - scorecard-data-collector.ts: converted committee endpoint TODO to informational comment
  - Build: passing | Tests: 275/275 passing
- [x] Wire up scorecard UI for beta testing
  - Added `searchMembers()` to `congress-api.ts` (GET /member?q=... with currentMember filter)
  - Created `GET /api/v1/members/search?q=<name>` — returns matching current members, cached 30d
  - Built `ScorecardLookup` client component: debounced member search autocomplete, period selector (session/yearly/quarterly), scorecard display with loading skeleton and error state
  - Created `/scorecard` page with header, lookup form, and methodology link footer
  - Added `/scorecard/error.tsx` error boundary
  - Build: passing | Tests: 199/199 passing across 27 files

## Medium Priority

- [x] Add legislation search feature
  - Added `searchBills(query, options)` to `congress-api.ts` (Congress.gov q JSON param)
  - Created `GET /api/v1/legislation/search?q=<query>&limit=<n>` — keyword search with 2h cache, falls back to recent bills when no query
  - Built `LegislationSearch` client component: debounced 400ms input, bill cards with status badges, Explain modal with BillTimeline + AI summary, abort controller for request cancellation
  - Created `/legislation` page
  - Build: passing | Tests: 199/199 passing
- [x] Improve responsive timeline UI
  - Active stage dot shows `animate-ping` pulsing ring (color-matched to stage color)
  - CSS-only `group-hover` tooltip on every node: current stage → "Active for X days", introduced → "X days ago", completed → "Completed", pending → "Not yet reached"
  - Converted to Client Component; connector bars rounded with overflow-hidden fill animation
  - Build: passing | Tests: 199/199 passing
- [x] Add Clerk authentication integration
  - Installed @clerk/nextjs v7.0.1
  - ConditionalClerkProvider: no-op fallback when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY absent
  - src/middleware.ts: protects /account, /settings, /petitions/sign; passthrough without keys
  - src/lib/auth.ts: getAuthUser() / getAuthSession() server helpers with null fallback
  - src/components/Navbar.tsx: sticky top nav with Briefing / Scorecards / Representatives + auth slot
  - src/components/NavAuthButton.tsx: Clerk v7 Show component (SignedIn/SignedOut removed in v7)
  - Footer "Weekly briefing" link fixed → /legislation
  - Activate by adding NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY to env
  - Build: passing | Tests: 281/281 passing across 35 files
- [ ] Build petition system UI and API
  - Prisma models `Petition` and `PetitionSignature` exist
  - No API routes or components built
- [x] Connect homepage "See this week's briefing" and "Open profile" buttons (currently dead)
  - "See this week's briefing" → <Link href="/legislation"> (was a dead <button>)
  - "Open profile" dead buttons removed; replaced with "Look up any member's scorecard →" link to /scorecard
- [x] Replace "TODO" source links in choreList items with real Congress.gov URLs
  - Completed in the TODO cleanup loop (choreList source strings + link rendering)
- [x] Add error boundaries to key pages
  - `src/app/error.tsx` — root catch-all: "We hit a snag" with Try again + Back to dashboard
  - `src/app/global-error.tsx` — root layout catch (self-contained html/body, inline styles, no deps)
  - `src/app/representatives/error.tsx` — contextual message for API-dependent rep lookup page
  - All three are Client Components with reset() + home link per Next.js App Router spec
  - Fixed digest-generator.ts: Date fields serialized to ISO strings in Prisma Json[] sections (build was failing)

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
