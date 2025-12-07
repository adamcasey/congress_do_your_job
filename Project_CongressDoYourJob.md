# CongressDoYourJob.com – Full Technical & Product Overview

**Goal:** A calm, non-partisan platform that lets everyday Americans demand civility and real legislative results from elected officials at every level (federal → state → county → city).  
Target revenue: ~$50k/year within 4–5 years via memberships + partnerships.

---

## Core Philosophy (Never Changes)

- No outrage. No tribalism.
- Plain English, objective data, Eisenhower-style pragmatism.
- “Less theater. More laws.”

---

## Overall Architecture (2025–2026 Roadmap)

| Layer                   | Technology (Recommended)                                              | Why                                                |
| ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------- |
| **Frontend**            | Next.js 14+ (App Router) + TypeScript + Tailwind CSS                  | SEO-friendly, fast, great DX, perfect resume piece |
| **Backend**             | Next.js API Routes + Server Actions (or tRPC if you want type-safety) | Zero additional services at MVP                    |
| **Database**            | MongoDB Atlas (NoSQL) or Firebase Firestore                           | Flexible schema for petitions, scorecards, reps    |
| **Authentication**      | Clerk or Supabase Auth                                                | Drop-in, social + email, handles paid tiers        |
| **Payments**            | Stripe (Checkout + Billing)                                           | Memberships, one-time donations                    |
| **Physical Mail**       | Lob.com API                                                           | Sends real letters to officials                    |
| **Email / Newsletters** | Resend or Mailgun + React Email                                       | Weekly summaries, report cards                     |
| **Hosting**             | Vercel (free tier → Pro later)                                        | One-click deploys, edge functions                  |
| **Analytics**           | Vercel Analytics + PostHog (self-hosted option)                       | Privacy-friendly                                   |

**MVP can run entirely on Vercel + MongoDB Atlas + Clerk + Stripe + Lob → under $100/month at launch.**

---

## Main Features & User Flows

### 1. Address → Elected Officials Lookup (Core Entry Point)

- User enters address → powered by Google Civic Information API (free) or Cicero/OpenStates fallback
- Instantly shows all representatives:  
  Federal (House + 2 Senators) → State legislators → County → City council → School board
- Saves to user profile (optional login)

### 2. Weekly “What Did Congress Actually Do?” Digest

- Every Monday morning: plain-English recap of federal + state activity
- Sources: Congress.gov, state legislature APIs, C-SPAN transcripts (scraped or via ProPublica)
- Dynamic metric cards (bills advanced, votes, hearings, delays)

### 3. Civility & Productivity Scorecards

Objective 0–100 score per official, updated weekly:

- - points: co-sponsors across aisle, clean funding votes, attendance
- – points: recorded personal attacks, stock trades, shutdown brinkmanship
- Transparent methodology page (huge trust builder)

### 4. One-Click Petition / Letter Builder

- Pre-written, meticulously neutral templates (e.g., “Pass a budget on time, no poison pills”)
- User customizes slightly → system generates:
  - Email to every official
  - Physical letter via Lob.com (optional $2–3 add-on)
- Public tally: “27,412 Americans have asked for this”

### 5. Annual “Do Your Job” Report Card

- Beautiful PDF generated per district/ward
- Mailed + emailed to every registered user in that district
- Shareable on social (“Here’s what my rep actually did this year”)

### 6. The Eisenhower Fund (Positive Reinforcement)

- Users pledge $5–$20/month
- Money held in pooled Stripe account
- When a genuinely bipartisan bill passes → small thank-you donations sent to the key sponsors (both parties)
- Turns “punishment” culture into reward culture

### 7. Paid Membership ($5–$10/month or $50–$100/year)

Benefits:

- Early access to weekly digests & report cards
- “I’m a Do Your Job voter” badge + physical window cling
- Quarterly Zoom with sensible legislators (Problem Solvers Caucus, etc.)
- Ad-free experience

**800–1,000 members = $50k/year goal**

---

## Revenue Streams (Ranked by Realism)

| Stream                                             | Projected Annual Revenue | Difficulty |
| -------------------------------------------------- | ------------------------ | ---------- |
| Memberships                                        | $40–60k                  | Medium     |
| Eisenhower Fund pool fees (Stripe takes 2.9%)      | $5–10k                   | Easy       |
| One-time physical letters ($2–3 fee)               | $3–8k                    | Easy       |
| Foundation grants (Niskanen, Stand Together, etc.) | $20–50k one-time         | Hard       |
| Sponsorships (credit unions, Tangle News, etc.)    | $5–15k                   | Medium     |

---

## Future Stretch Features (Year 2–3)

- Local government expansion (city council scorecards)
- Mobile app (React Native or Expo)
- Browser extension: “See your rep’s score on any news article”
- API for journalists/academics (premium data access)

---

## Development Roadmap (Next 12 Months)

| Milestone                | Timeline        | Key Deliverables                                                |
| ------------------------ | --------------- | --------------------------------------------------------------- |
| MVP Launch               | 3–4 months      | Address lookup, weekly digest, petition tool, Stripe membership |
| Physical letters + PDFs  | Month 5–6       | Lob integration, report card generator                          |
| Eisenhower Fund          | Month 7–8       | Pooled donations logic                                          |
| First 500 paying members | Month 12        | Marketing via Tangle, The Dispatch, Braver Angels               |
| $50k/year run rate       | Year 4–5 target | ~900 members + grants                                           |

---

You now have a complete, realistic, resume-boosting full-stack SaaS project that actually fills a gap in American civic life.

Let me know when you want the repo structure, Prisma/MongoDB schema, or the Clerk + Stripe integration snippets — happy to keep shipping this with you, sir.
