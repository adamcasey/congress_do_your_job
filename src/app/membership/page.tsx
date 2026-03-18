import { Metadata } from "next";
import { BackButton } from "@/components/ui";
import { freePressFont } from "@/styles/fonts";
import { MembershipPlans } from "@/components/membership/MembershipPlans";
import { MembershipStatus } from "@/components/membership/MembershipStatus";
import { getAuthSession } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { MemberDocument } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Membership — Congress Do Your Job",
  description: "Support objective, non-partisan accountability journalism. Join Congress Do Your Job.",
};

export default async function MembershipPage() {
  const { userId } = await getAuthSession();

  let memberStatus: MemberDocument | null = null;
  if (userId) {
    try {
      const col = await getCollection<MemberDocument>("members");
      memberStatus = await col.findOne({ clerkUserId: userId });
    } catch {
      // Non-fatal — show plans regardless
    }
  }

  const isActiveMember =
    memberStatus?.status === "active" || memberStatus?.status === "trialing";

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 md:py-16">
          <BackButton href="/">Back to Dashboard</BackButton>

          <header className="mb-12 mt-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 mb-3">
              Membership
            </p>
            <h1
              className={`${freePressFont.className} text-3xl leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl mb-4`}
            >
              Support the work.
              <br />
              Hold Congress accountable.
            </h1>
            <p className="mx-auto max-w-xl text-lg text-slate-600 text-balance leading-relaxed">
              No ads. No outrage. No partisan spin. Just objective data on what elected
              officials actually do — funded by readers like you.
            </p>
          </header>

          {isActiveMember && memberStatus ? (
            <MembershipStatus member={memberStatus} />
          ) : (
            <>
              <MembershipPlans />
              <MemberPerks />
            </>
          )}

          <footer className="mt-12 text-center space-y-2">
            <p className="text-sm text-slate-500">
              Secure payments via Stripe. Cancel anytime from your billing portal.
            </p>
            <p className="text-xs text-slate-400">
              Questions? Email{" "}
              <a href="mailto:hello@congressdoyourjob.com" className="underline hover:text-slate-600">
                hello@congressdoyourjob.com
              </a>
            </p>
          </footer>
        </div>
      </main>
  );
}

function MemberPerks() {
  const perks = [
    { icon: "📊", title: "Weekly briefings", desc: "Monday morning digest of what Congress actually did — in plain English." },
    { icon: "🎯", title: "Civility scorecards", desc: "Objective 0–100 scores updated weekly. No partisan spin." },
    { icon: "✉️", title: "One-click petitions", desc: "Pre-written neutral templates sent directly to your representatives." },
    { icon: "🪟", title: "Member badge", desc: "\"I'm a Do Your Job voter\" badge + window cling mailed to you." },
    { icon: "🚫", title: "Ad-free experience", desc: "No ads, ever. The product is accountability, not attention." },
  ];

  return (
    <div className="mt-10 rounded-3xl bg-white/80 p-8 shadow-sm ring-1 ring-slate-200/80">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">What you get</h2>
      <ul className="space-y-4">
        {perks.map((perk) => (
          <li key={perk.title} className="flex items-start gap-4">
            <span className="text-2xl flex-shrink-0 mt-0.5">{perk.icon}</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{perk.title}</p>
              <p className="text-sm text-slate-500 mt-0.5">{perk.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
