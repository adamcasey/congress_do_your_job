# CongressDoYourJob.com

Less theater. More laws.

A calm, non-partisan platform that shows — in plain English — what your elected officials actually did this week, from Congress down to your city council. No spin, no outrage, just facts.

https://congressdoyourjob.com

## Features

- Weekly Digest  
  Every Monday morning: “What Did Congress Actually Do This Week?”  
  Bills advanced • Floor votes • Hearings held • Deadlines missed

- Objective “Do Your Job” Scorecards  
  Transparent 0–100 score for every representative based only on verifiable actions  
  (+ bipartisan work, attendance • – personal attacks, stock trading, shutdown games)

- Find All Your Representatives  
  Enter your address → instantly see your U.S. House member, Senators, state legislators, county officials, city council, and school board

- One-Click Petitions & Letters  
  Carefully worded, neutral demands you can send to any or all of your officials (email + optional physical mail)

- Annual Report Cards  
  Beautiful, shareable PDF summarizing what each official actually accomplished (or didn’t) over the year

## Tech Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- MongoDB Atlas
- Clerk (authentication)
- Stripe + Lob.com (payments & physical mail)
- Data from Congress.gov API, GovTrack, LegiScan, Google Civic API
- Deployed on Vercel

## Local Development

```bash
git clone https://github.com/yourusername/congressdoyourjob.git
cd congressdoyourjob
cp .env.example .env.local
npm install
npm run dev
```

Add your keys to `.env.local` (see `.env.example`).

## Contributing

Contributions welcome! **Especially**:

- Adding or improving state/local data sources
- Better plain-English summarization
- Accessibility & design improvements
- Bug fixes

Open an issue first for major changes.

## License

MIT © 2025 CongressDoYourJob.com
