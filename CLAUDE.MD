# CongressDoYourJob.com - Project Context for Claude

## Project Overview

CongressDoYourJob.com is a non-partisan civic engagement platform that provides objective, plain-English information about what elected officials actually do. The mission is "Less theater. More laws."

**Target Users:** Everyday Americans, regardless of party affiliation, frustrated with political theater who want civility and real legislative results
**Revenue Goal:** ~$50k/year within 4–5 years via memberships + partnerships
**Philosophy:** No outrage. No tribalism. Eisenhower-style pragmatism.

## Git Workflow

This project uses a four-tier branching strategy:

```
main (production-ready, deployed to congressdoyourjob.com)
  ↑
dev (integration branch, stable features)
  ↑
demo (preview features not quite ready for production)
  ↑
feature/* (individual features cut from dev)
```

### Branch Purposes

- **main**: Production-ready code only. Deployed to live site.
- **dev**: Integration branch for stable, tested features. Should always be in a deployable state.
- **demo**: Preview/staging branch for features that work but need more testing or user feedback before going to production. Can be deployed to a staging URL.
- **feature/***: Individual feature branches cut from `dev`. Naming convention: `feature/feature-name` (e.g., `feature/add-auth`, `feature/scorecard-logic`)

### Workflow Process

1. **Create feature branch from dev**: `git checkout dev && git checkout -b feature/your-feature`
2. **Work on feature**: Commit changes to feature branch
3. **Sync with dev periodically**: `git rebase dev` (preferred over merge)
4. **When feature is complete**: Merge into `demo` first for testing
5. **After demo testing**: Merge from `demo` into `dev`
6. **When dev is stable**: Merge `dev` into `main` for production release

### Key Rules

- **Never commit directly to main, dev, or demo** - always use feature branches
- **Prefer rebase over merge** when syncing feature branches with dev
- **Use pull requests** for merging feature branches into demo/dev
- **Test on demo** before promoting to dev
- **Keep main stable** - only merge well-tested code from dev

## Tech Stack

- **Frontend:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes + Server Actions
- **Database:** MongoDB Atlas
- **Authentication:** Clerk
- **Payments:** Stripe (memberships, donations)
- **Physical Mail:** Lob.com API
- **Email:** Resend or Mailgun + React Email
- **Hosting:** Vercel
- **Data Sources:** Congress.gov API, GovTrack, LegiScan, Google Civic Information API

## Core Features

### 1. Representative Lookup

- User enters address → shows all representatives (federal, state, county, city, school board)
- Powered by Google Civic Information API
- Saves to user profile

### 2. Weekly Digest

- Every Monday: "What Did Congress Actually Do This Week?"
- Plain-English recaps of federal + state activity
- Bills advanced, votes, hearings, deadlines missed

### 3. Civility & Productivity Scorecards

- Objective 0–100 score per official, updated weekly
- **Plus points:** bipartisan co-sponsorship, attendance, clean funding votes
- **Minus points:** personal attacks, suspicous stock trading, shutdown brinkmanship
- Transparent methodology

### 4. One-Click Petitions & Letters

- Pre-written neutral templates (e.g., "Pass a budget on time")
- Sends emails to user's representatives
- Optional physical letters via Lob.com ($2–3)
- Public tally of supporters

### 5. Annual Report Cards

- Beautiful PDF per district/ward
- Summarizes what each official accomplished
- Shareable on social media

### 6. The Eisenhower Fund

- Users pledge $5–$20/month
- Money pooled in Stripe account
- When bipartisan bills pass → thank-you donations to sponsors
- Positive reinforcement culture

### 7. Legistlation Scorecards

- Calculate likelihood a bill will be challenged all the way to the supreme court
- Track promises legislators give about a bill and assign Passing/Failing grade when appropriate
- Transparent methodology

### 8. Paid Membership ($5–$10/month or $50–$100/year)

- Early access to digests & report cards
- "I'm a Do Your Job voter" badge + window cling
- Quarterly Zoom calls with legislators (Stretch goal that needs further scoping)
- Ad-free experience
- Target: 800–1,000 members

## Project Structure

Currently in early stages. Expected structure:

```
/src
  /app              - Next.js App Router pages
  /components       - React components
  /lib              - Utility functions, API clients
  /types            - TypeScript types
  /api              - API routes
/public             - Static assets
/prisma or /models  - Database schemas
```

## Development Guidelines

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Reusable components adhering to DRY-principles
- Comments when necessary but never more than a 1 comments : 10 lines of code ratio
- Tailwind CSS for styling
- Optimize for Consistency & Availability (CAP Theorem)
- Server Components by default, Client Components when needed
- Client-side state management should be a mix of the Context API and local state management. Avoid prop-drilling more than 2-layers deep.
- Design resilient APIs as defined by this [blog post](https://embedded.gusto.com/blog/defensive-programming-api-clients/)

### Key Principles

- **Neutrality first:** No partisan language, ever. Never mention an official's political party
- **Plain English:** Avoid jargon, explain everything clearly
- **Transparency:** Show all methodology, data sources, calculations
- **Privacy-conscious:** Minimal data collection, no selling user data
- **Accessibility:** WCAG 2.1 AA compliance
- **Design:** Minimalist but eye-catching, dazzling, and aesthetically beautiful desings throughout
- **Viewports:** Optimize for desktop screens but always consider mobile designs

### Data Handling

- Weekly scraping/API calls to Congress.gov, state legislatures
- Cache heavily to minimize API costs
- Store scorecard methodology in version control
- All scoring algorithms must be publicly documented

## Data Collection & Information Sources

### Core Data Strategy

Our approach prioritizes **structured, verifiable data** from official sources over media coverage. We focus on what legislators DO, not what they SAY.

### Primary Data Sources (Official Records)

#### Federal Level
1. **Congress.gov API** (Official legislative data)
   - Bill introductions, co-sponsorships, amendments
   - Committee assignments and hearings
   - Floor votes (yea/nay/present/absent)
   - Full bill text and status updates
   - **Update frequency:** Real-time via API

2. **New York Times Congress API** (News and legislative context)
   - Article coverage of major legislation
   - Member profiles and voting context
   - Floor activity summaries
   - **Update frequency:** Real-time
   - **Note:** Used for context and summaries, not primary voting data

3. **Senate.gov & House.gov** (Official sites)
   - Floor schedules and calendars
   - Committee hearing transcripts
   - Member office contact information
   - **Update frequency:** Daily scraping

4. **Congressional Record** (Official proceedings)
   - Floor speeches and remarks
   - Extensions of remarks
   - **Note:** Used ONLY for documented statements made on the floor, not for scoring rhetoric

#### State & Local Level
1. **OpenStates API** (50-state legislatures)
   - Bill tracking across all states
   - Legislator profiles and votes
   - Committee information
   - **Update frequency:** Varies by state (daily to weekly)

2. **LegiScan API** (State legislation)
   - Bill text and status
   - Roll call votes
   - Fiscal notes
   - **Update frequency:** Real-time for 30+ states

3. **State Government Websites** (Direct scraping)
   - Legislative calendars
   - Committee schedules
   - Local ordinances
   - **Update frequency:** Weekly for MVP

### Secondary Sources (Behavior & Context)

#### Stock Trading & Ethics
1. **House Stock Watcher / Senate Stock Watcher** (Community projects)
   - Congressional stock disclosures (STOCK Act)
   - Timing analysis relative to committee work
   - **Update frequency:** Daily

2. **OpenSecrets / Center for Responsive Politics**
   - Campaign contributions
   - Lobbying relationships
   - **Update frequency:** Quarterly

#### Media & Public Statements
**Critical for scoring:** Social media activity and media interviews ARE tracked to highlight the theater vs. work ratio.

**What we measure:**
1. **Time spent on media appearances** - TV interviews, podcasts, cable news hits
2. **Social media activity volume** - Tweet frequency, Instagram posts, TikToks
3. **Promises made vs. votes cast** - Track commitments made in interviews against actual legislative action

**How this affects scoring:**
- **Minus points:** High media activity + low legislative productivity = "All talk, no action"
- **Neutral/Plus points:** Media activity proportional to legislative work = "Communicating while governing"
- **Example metric:** "Senator X posted 47 tweets this week but missed 3 committee votes"

**Approach:**
1. **Social Media APIs** - Twitter/X API, Meta Graph API (public posts only)
2. **Media appearance tracking** - Manual curation of major news appearances (C-SPAN, Sunday shows)
3. **Volume tracking only** - We count post frequency and media appearances, NOT content quality or ideology
4. **Promise Tracker integration** - When politicians make specific legislative commitments in media, we track vs. actual votes
5. **Human review required** - ALL sentiment analysis and promise tracking reviewed by editorial team for accuracy before publication
6. **Transparent methodology** - "We measure time allocation: governing vs. performing"

**Data Sources:**
- Twitter/X API (public posts, engagement metrics)
- Meta Graph API (Facebook/Instagram public posts)
- YouTube API (for official channels)
- Cable news appearance databases (manual for MVP, automated later)
- Podcast appearance tracking (optional Phase 2+)

### Web Scraping Strategy

#### What We Will Scrape
1. **C-SPAN hearing transcripts** (when API unavailable)
   - Committee hearings for attendance tracking
   - Floor proceedings for recorded statements
   - **Tool:** Cheerio + Puppeteer (for dynamic content)
   - **Frequency:** Weekly batch jobs

2. **State legislature websites** (where APIs don't exist)
   - Bill status pages
   - Committee schedules
   - Roll call votes
   - **Tool:** Playwright for reliable state site navigation
   - **Frequency:** Weekly, with exponential backoff

3. **Local government sites** (Phase 2+)
   - City council agendas and minutes
   - County board meetings
   - **Tool:** Custom scrapers per municipality
   - **Frequency:** Monthly for MVP cities

#### What We Will NOT Scrape
- Personal blogs or campaign websites (unofficial sources)
- Paywalled news content
- Private social media accounts

**What We WILL Track (via APIs, not scraping):**
- Public social media posts (Twitter/X API, Meta Graph API)
- Cable news transcripts (for promise tracking and media appearance counts)
- Op-eds (to count media engagement time vs. legislative time)

**Rationale:** We measure the RATIO of theater to work. Social media IS theater - and we quantify exactly how much time is spent performing vs. governing.

### Theater vs. Work Tracking

#### The Promise Tracker & Media Activity Monitor
**Core Premise:** Politicians spend too much time on TV and Twitter, not enough time legislating. We quantify this.

**What We Track:**

1. **Media Appearances (Theater)**
   - TV interviews (Sunday shows, cable news, late night)
   - Podcast appearances
   - Op-eds written
   - Social media posts (tweets, Instagram, TikTok, Facebook)
   - Press conferences (non-legislative)

2. **Legislative Work (The Job)**
   - Committee attendance
   - Floor votes
   - Bill sponsorships/co-sponsorships
   - Amendment proposals
   - Constituent casework (when publicly reported)

3. **Promise Tracking**
   - Community-sourced or auto-detected commitments made in media
   - Track specific legislative promises against actual votes
   - Display: "Senator X promised to support Bill Y on Meet the Press (Oct 2024). They voted NO."
   - Highlight broken promises AND kept promises (neutral presentation)

**Scoring Impact:**
- **Theater-to-Work Ratio** - Core metric displayed prominently
- Example: "This week: 23 social media posts, 4 TV appearances, 2 committee votes missed, 0 bills advanced"
- **High theater + low work = minus points**
- **Promises broken = minus points**
- **Promises kept = plus points**

**Implementation Strategy:**

**MVP (Phase 1):**
1. Manual media appearance logging (editorial team tracks major TV/podcast)
2. Twitter/X API integration for post counting (automated)
3. Community submission form for promise tracking → human editorial review and approval required
4. Simple ratio display: "Media posts this week: 34 | Legislative actions: 6"
5. All promise tracking manually verified by editorial team before publication

**Phase 2:**
1. Automated TV appearance detection (partner with TV Eyes or similar) → flagged for human review
2. Meta Graph API (Instagram/Facebook) for automated post counting
3. YouTube API for video content counting
4. Natural Language Processing for promise extraction → flags potential promises → MANDATORY human review and approval
5. Integration with fact-checking organizations for cross-verification
6. Editorial workflow system: Automated flagging → Human review queue → Approval → Publication

**Safeguards:**
- We count VOLUME of media activity, not judge CONTENT (no ideology scoring)
- Only track promises about SPECIFIC legislation (not vague platitudes)
- Display full quotes with timestamp citations
- **MANDATORY human review** - All sentiment analysis, promise tracking, and media content interpretation reviewed by editorial team for accuracy before publication
- No automated scoring based on statement content - only verifiable actions (votes, attendance, bill sponsorships)
- Automated systems flag potential promises/commitments → human editors verify and approve
- Clear methodology page: "We measure time allocation, not political positions"

**User Experience:**
- Weekly digest includes: "Top 10 Most Active on Social Media vs. Top 10 Most Productive Legislators"
- Representative profiles show: "Theater vs. Work" chart (time series)
- Tooltip explains: "Media activity includes interviews and social posts. Legislative work includes votes, committee participation, and bill sponsorship."

### Data Processing Pipeline

```
1. Collection (Automated)
   ↓
2. Validation (Check for API errors, missing data)
   ↓
3. Enrichment (Merge data from multiple sources)
   ↓
4. Automated Flagging (NLP flags potential promises, high theater-to-work ratios, anomalies)
   ↓
5. Scoring (Run transparent algorithms on verifiable data only)
   ↓
6. MANDATORY Human Review (Editorial team verifies all sentiment analysis, promise tracking, media interpretations)
   ↓
7. Editorial Approval (Content must be approved before going live)
   ↓
8. Publication (Monday morning release)
```

**Critical:** Steps 6-7 are non-negotiable. No automated content about politician statements or promises goes live without human verification.

### Handling Bias & Errors

- **All data sources cited** - Users can click through to original records
- **Version control for scoring** - GitHub tracks every methodology change
- **Community corrections** - Users can flag errors with supporting evidence
- **Transparent retractions** - If we get something wrong, we publish the correction prominently

### Technology Stack for Data Collection

- **Scraping:** Playwright (reliable for state sites), Cheerio (lightweight HTML parsing)
- **Scheduling:** Vercel Cron Jobs (free tier: 2 jobs) + GitHub Actions (complex workflows)
- **Storage:** MongoDB collections for raw data, transformed views for UI
- **Caching:** Redis (Upstash free tier) for API response caching
- **Monitoring:** Sentry for scraper failures, PostHog for data pipeline analytics

## External APIs & Services

### Required API Keys

- Google Civic Information API (free)
- Congress.gov API (free but requires key)
- New York Times Congress API (free with key - replaces deprecated ProPublica API)
- Twitter/X API (for social media tracking)
- Meta Graph API (Facebook/Instagram public posts)
- YouTube Data API (for official channel tracking)
- Clerk (auth)
- Stripe (payments)
- Lob.com (physical mail)
- Resend/Mailgun (email)

### Optional/Future

- OpenStates API (state legislatures)
- LegiScan (state bills)
- Cicero API (representative lookup fallback)

## Revenue Streams

1. **Memberships:** $40–60k/year (target: 800–1,000 members)
2. **Eisenhower Fund fees:** $5–10k/year
3. **Physical letter fees:** $3–8k/year
4. **Foundation grants:** $20–50k one-time
5. **Sponsorships:** $5–15k/year

## Roadmap

### Phase 1: MVP (Months 1–4)

- Address lookup
- Weekly digest
- Basic petition tool
- Stripe membership integration

### Phase 2: Enhanced Features (Months 5–6)

- Lob.com integration for physical letters
- PDF report card generator

### Phase 3: Eisenhower Fund (Months 7–8)

- Pooled donation logic
- Thank-you payment system

### Phase 4: Growth (Month 12+)

- First 500 paying members
- Marketing partnerships (Tangle, The Dispatch, Braver Angels)

### Future (Years 2–3)

- Local government expansion (city councils)
- Mobile app (React Native/Expo)
- Browser extension
- API for journalists/academics

## Common Tasks

### When adding features

1. Ensure neutrality - no partisan framing
2. Write in plain English
3. Document methodology if it affects scores
4. Consider mobile experience
5. Add to weekly digest if relevant

### When working with scorecard logic

- All algorithms must be transparent and documented
- Changes to scoring require updating methodology page
- Test against real data before deploying
- Version control all scoring criteria changes

### When integrating APIs

- Cache aggressively
- Handle rate limits gracefully
- Log all external API calls
- Have fallbacks for critical features

## Testing Strategy

- Unit tests for scoring algorithms (critical for trust)
- Integration tests for API integrations
- E2E tests for key user flows (signup, petition sending)
- Manual review of all weekly digests before publishing

## Tone & Voice

- **Calm, factual, slightly formal**
- Think NPR, not Twitter
- Assume 8th-grade reading level
- Use active voice
- Avoid superlatives and emotional language
- Example: "Congress passed 3 bills this week" not "Congress FINALLY passed bills"

## Important Notes

- **Never** inject political opinions
- **Always** cite sources for claims
- **Transparent** methodology trumps sophisticated algorithms
- **Simple** beats clever
- **Trust** is the product

## Questions to Ask

When implementing features, consider:

1. Is this neutral and non-partisan?
2. Would both parties' supporters find this fair?
3. Is the methodology transparent and documented?
4. Does this advance "Less theater. More laws"?
5. Can a typical American understand this without political knowledge?

## Contact & Resources

- Full project overview: `Project_CongressDoYourJob.md`
- README: `README.md`
- Target domain: https://congressdoyourjob.com
