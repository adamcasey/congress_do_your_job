# CongressDoYourJob.com

### Technical & Product Overview

---

## 1. Purpose

**CongressDoYourJob.com** is a calm, neutral, plain-English platform that answers one question:

**“What did Congress actually do this week — and what didn’t they do?”**

The site avoids ideology, tribal language, outrage, and red vs. blue framing entirely.

Core principles:

1. **Clarity** – Plain-English summaries, zero spin.
2. **Neutrality** – No party labels, no ideological framing, no moral judgments.
3. **Accountability-through-information** – Focus on behavior, attendance, deadlines, and legislative output.

This is _journalistic civic reporting_, not activism.

Revenue target: **$30,000/year by Year 3**, primarily via premium tools and subscriptions.

---

## 2. Core Product Pillars

### 2.1 Weekly Summary (Plain-English Newsroom Style)

A newsroom-style writeup explaining:

- What moved
- What stalled
- What deadlines were missed
- What hearings occurred
- What slipped behind schedule
- What to expect next week

Tone: calm, factual, concise.  
No ideology. No commentary. No blame.

---

### 2.2 Congressional Chores List (Signature Feature)

A living, auto-updated list of tasks Congress was _supposed_ to complete but has not yet.

Each item includes:

- What it is
- Why it matters
- When it was due
- Current status
- Links to primary sources

This becomes the user’s “What’s going on?” board — nonjudgmental, explanatory, simple.

---

### 2.3 Productivity Dashboard

A daily-updated, neutral visualization of congressional behavior:

- Bills introduced
- Bills advanced out of committee
- Bills passed
- Hearings held
- Committee meetings
- Vote attendance
- Committee attendance
- Days in session vs. recess
- Floor hours worked

Everything is presented visually and in plain English.  
No red/blue. No party-based grouping. No ideological context.

---

### 2.4 Member Profiles (Behavioral, Not Partisan)

Each member of Congress gets a page showing:

- Vote attendance
- Committee hearing attendance
- Bills sponsored
- Bills advanced
- Co-sponsorship diversity (“broad support score” showing how often they work with colleagues who generally vote differently, without labeling ideology)
- A timeline of activity
- Committee assignments

**No party labels. No D/R/I. No political color cues.**  
Just clean, behavioral data and neutral explanation.

#### Civility Score (Procedural Definition)

The Civility Score records only **documented, official decorum-related events**, such as:

- Withdrawn remarks entered into the Congressional Record
- Formal reprimands
- Violations of House or Senate decorum rules
- Personal attacks made during official proceedings

It **does not** evaluate tone, ideology, rhetoric, or intent.  
Only events recorded in the Congressional Record or verified transcripts are counted.

---

### Procedural Professionalism Score

A neutral, behavior-based metric evaluating how consistently an elected official adheres to formal institutional processes and responsibilities.

| Category                            | Max Points | How It’s Calculated                                                                              | Data Source                                          |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Attendance & Participation          | +30        | % of roll-call votes attended + % of scheduled committee hearings attended                       | Congress.gov → votes + committee reports             |
| Legislative Follow-Through          | +20        | Milestones reached on bills sponsored (introduced → committee → advanced → passed)               | Congress.gov bill actions / GovTrack bill_status     |
| Collaboration Consistency           | +15        | Diversity of co-sponsors based on voting-pattern dissimilarity (no party labels used)            | Bill co-sponsor data + roll-call similarity matrices |
| Decorum Compliance (Public Conduct) | −20        | Documented decorum violations: withdrawn remarks, official reprimands, breaches of chamber rules | Congressional Record + C-SPAN transcripts            |
| Administrative Compliance           | −10        | Late or missing mandatory disclosures (financial, travel, ethics)                                | House/Senate disclosure logs                         |

#### Notes on Neutrality

- This score does **not** measure ideology, tone, or political preference.
- All data must come from **public, documented, verifiable sources**.
- Collaboration scores rely on **voting-pattern differences**, not party affiliation.
- The entire system reflects **institutional professionalism**, not political alignment.

---

### 2.5 User Tracking Tools (Primary Monetization)

Users can track:

- Bills
- Members
- Committees
- “What changed since last week” summaries

**Free tier**: limited tracking.

**Premium tier** unlocks:

- Unlimited tracked items
- Personalized weekly digest
- Alerts when tracked bills or members update
- Exportable charts
- Advanced filtering and historical data

This is the most scalable revenue engine for the site.

---

## 3. Tone & Brand Philosophy

- Plain English
- No outrage, snark, or partisan framing
- No moral judgments
- No “left” or “right” references
- No red or blue visuals
- No speculation about motives
- No ideological scoring
- Always explain _what happened_, never _why someone did it_

Brand positioning: **The calm adult in the room.**

Comparable influences:

- NPR
- Tangle News
- ProPublica explainer style
- Apple-like minimalism in UI

---

## 4. Data Pipeline & System Architecture

### 4.1 Data Sources

- **Congress.gov API** (bills, actions, statuses)
- Committee calendars
- Floor schedules
- Public legislative XML/JSON feeds
- Optional: GovTrack or similar datasets (where licensing permits)

---

### 4.2 Ingestion Flow

A daily scheduled job:

1. Fetches the latest data
2. Normalizes and deduplicates items
3. Updates bill statuses
4. Updates attendance records
5. Updates committee work history
6. Generates diff data for “what changed this week”

---

### 4.3 Internal API Layer

Expose normalized data through internal endpoints such as:

- `/api/bills`
- `/api/members`
- `/api/committees`
- `/api/chores`
- `/api/status-changes`

These endpoints feed both the public site and premium tools.

---

### 4.4 Recommended Stack

| Layer     | Technology                            | Reason                                      |
| --------- | ------------------------------------- | ------------------------------------------- |
| Frontend  | Next.js 14+, TypeScript, Tailwind CSS | Fast, SEO-friendly, modern DX               |
| Backend   | Next.js API routes / Server Actions   | Simple, unified stack                       |
| Database  | Postgres or Supabase                  | Strong relational structure, easy analytics |
| Auth      | Supabase Auth or Clerk                | Drop-in, battle-tested                      |
| Payments  | Stripe Billing                        | Clean subscription management               |
| Email     | Resend or Mailgun                     | Weekly digests, premium reports             |
| Hosting   | Vercel                                | Ideal for Next.js, simple deployments       |
| Analytics | Plausible or PostHog                  | Privacy-first                               |

---

## 5. Monetization Strategy

**Target:** ~$30,000/year within ~3 years.

### 5.1 Primary Revenue (Most Predictable)

#### Premium Subscription ($7–9/month)

Includes:

- Unlimited tracked bills
- Unlimited tracked members
- Weekly personalized briefings
- Alerts for updates on tracked items
- Trendlines and exports

#### Premium Newsletter ($5/month or $50/year)

A richer version of the Weekly Summary with:

- Extended analysis
- Historical comparisons
- Additional context on timelines and delays

Together these can produce **$25k–$35k/year** with roughly 300–400 paying subscribers.

---

### 5.2 Additional Revenue Streams

#### Educator & Classroom Licensing

- $250–$500 per school per year
- Includes simplified dashboards and printable charts/summaries for students

Projected: **$5k–$10k/year** at modest adoption.

#### Institutional Data Licensing

Universities, journalists, and civic organizations license:

- Bill timeline data
- Attendance datasets
- Chores-list data

Projected: **$5k–$10k/year** with a small number of institutional clients.

#### Neutral Corporate Sponsorship

No political organizations.

Eligible categories:

- Productivity tools
- Education/civics tools
- News literacy programs

Limit to 1 sponsor per weekly edition to preserve trust.

Projected: **$8k–$15k/year**.

#### Annual “State of Congressional Productivity” Report

- Designed PDF / web report
- Sold at $20–$30 each

Projected: **$5k–$10k/year**.

---

## 6. Product Roadmap (12–36 Months)

### Phase 1 — MVP (0–3 Months)

- Basic ingestion pipeline (Congress.gov + minimal normalization)
- Site-wide Productivity Dashboard
- Weekly Summary page
- Congressional Chores List (v1)
- Light member profiles (attendance + basic activity)
- Email capture for future digests
- Neutral, minimalist design system

---

### Phase 2 — v1 Public Launch (3–9 Months)

- Full member profiles (attendance, bills, committees, collaboration stats)
- Search (bills, members, committees)
- Bill timelines (introduced → committee → advanced → passed)
- User accounts
- Free tracking tools
- Weekly digest email: “What changed this week”

---

### Phase 3 — Monetization (9–18 Months)

- Premium tracking tier (unlimited tracking + alerts + exports)
- Premium newsletter (extended weekly analysis)
- Educator/classroom edition (dashboards + lesson-friendly summaries)
- Institutional licensing pricing + integrations
- Sponsorship framework (strict neutrality and category limits)

---

### Phase 4 — Expansion (18–36 Months)

- Optional state-level legislature support (if demand is strong)
- Mobile app (React Native / Expo, after web is stable)
- Annual productivity report (paid product)
- Advanced analytics dashboards for power users
- Partnerships with civics orgs, educators, and neutral media brands

---

## 7. Non-Negotiable Principles

1. **No party labels** (no D/R/I anywhere in the UI).
2. **No ideological framing** (“left,” “right,” “liberal,” “conservative” avoided entirely).
3. **No red or blue** in the visual identity or data visualizations.
4. **No political advertising** (no campaigns, PACs, or partisan organizations).
5. **No moral judgments or editorializing** in summaries or metrics.
6. **Data and process over opinion** at all times.
7. **Everything in plain English** (no unexplained jargon).

These principles are central to user trust and brand identity.

---

## 8. Long-Term Vision

CongressDoYourJob becomes:

- A weekly habit for politically exhausted but civically engaged Americans.
- A resource teachers use to help students understand how Congress works in practice.
- A reference for journalists who want neutral trend data and timelines.
- A civic staple akin to a “governance weather report” — factual, regular, calm.

The brand stands for:

- **Clarity**
- **Seriousness**
- **Neutrality**
- **Accountability**
- **Adult conversation**

CongressDoYourJob.com is built for adults, moderates, independents, and anyone tired of the noise who still cares about how the country is governed.
