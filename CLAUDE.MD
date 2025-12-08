# CongressDoYourJob.com - Project Context for Claude

## Project Overview

CongressDoYourJob.com is a non-partisan civic engagement platform that provides objective, plain-English information about what elected officials actually do. The mission is "Less theater. More laws."

**Target Users:** Everyday Americans, regardless of party affiliation, frustrated with political theater who want civility and real legislative results
**Revenue Goal:** ~$50k/year within 4–5 years via memberships + partnerships
**Philosophy:** No outrage. No tribalism. Eisenhower-style pragmatism.

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

### 7. Paid Membership ($5–$10/month or $50–$100/year)

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

### Key Principles

- **Neutrality first:** No partisan language, ever. Never mention an official's political party
- **Plain English:** Avoid jargon, explain everything clearly
- **Transparency:** Show all methodology, data sources, calculations
- **Privacy-conscious:** Minimal data collection, no selling user data
- **Accessibility:** WCAG 2.1 AA compliance

### Data Handling

- Weekly scraping/API calls to Congress.gov, state legislatures
- Cache heavily to minimize API costs
- Store scorecard methodology in version control
- All scoring algorithms must be publicly documented

## External APIs & Services

### Required API Keys

- Google Civic Information API (free)
- Congress.gov API (free but requires key)
- ProPublica Congress API (free)
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
