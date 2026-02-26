import { latoFont, freePressFont } from "@/styles/fonts";
import Link from "next/link";

export const metadata = {
  title: "Terms of Use | Congress Do Your Job",
  description: "Terms and conditions for using Congress Do Your Job.",
};

export default function TermsPage() {
  return (
    <main className={`min-h-screen px-4 pb-20 pt-10 ${latoFont.className}`}>
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900">
          &larr; Back to home
        </Link>

        <article className="prose prose-slate max-w-none">
          <h1 className={`${freePressFont.className} text-4xl font-semibold text-slate-900`}>Terms of Use</h1>
          <p className="text-lg text-slate-600">Last updated: January 15, 2026</p>

          <div className="mt-8 space-y-6 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Agreement to Terms</h2>
              <p>
                By accessing or using Congress Do Your Job (&quot;the Service&quot;), you agree to be bound by these Terms of
                Use. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Use of Service</h2>
              <h3 className="text-xl font-semibold text-slate-900">Permitted Use</h3>
              <p>You may use the Service to:</p>
              <ul>
                <li>Access information about elected officials and legislation</li>
                <li>Receive weekly briefings and updates</li>
                <li>Contact your representatives through provided tools</li>
                <li>Participate in civic engagement features</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900">Prohibited Use</h3>
              <p>You may not:</p>
              <ul>
                <li>Use the Service for any illegal purpose</li>
                <li>Harass, abuse, or harm others</li>
                <li>Impersonate any person or entity</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Scrape, copy, or redistribute our content without permission</li>
                <li>Use automated systems to access the Service excessively</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">User Accounts</h2>
              <p>
                When you create an account, you are responsible for maintaining the security of your account and all activities
                that occur under it. You must provide accurate and complete information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Content and Intellectual Property</h2>
              <h3 className="text-xl font-semibold text-slate-900">Our Content</h3>
              <p>
                All content, design, graphics, and data compilations on Congress Do Your Job are owned by us or our licensors
                and protected by copyright and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-slate-900">Public Data Sources</h3>
              <p>
                Legislative data, voting records, and other government information are sourced from public APIs and databases.
                We provide links to original sources.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Payments and Subscriptions</h2>
              <ul>
                <li>Membership fees are processed through Stripe</li>
                <li>Subscriptions renew automatically unless cancelled</li>
                <li>Refunds are handled on a case-by-case basis</li>
                <li>We reserve the right to change pricing with notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Letters and Petitions</h2>
              <p>When you send letters or sign petitions through our Service, you acknowledge that:</p>
              <ul>
                <li>Messages are sent on your behalf to elected officials</li>
                <li>Your name and contact information may be shared with recipients</li>
                <li>Physical letters via Lob.com incur additional fees</li>
                <li>We are not responsible for how recipients respond or use your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Disclaimers</h2>
              <h3 className="text-xl font-semibold text-slate-900">No Warranty</h3>
              <p>
                The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee accuracy,
                completeness, or timeliness of information.
              </p>

              <h3 className="text-xl font-semibold text-slate-900">Not Legal or Political Advice</h3>
              <p>
                Information provided is for educational purposes only and does not constitute legal, political, or professional
                advice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Congress Do Your Job shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to the Service at any time, with or without cause, with
                or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Changes to Terms</h2>
              <p>
                We may modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the
                new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Governing Law</h2>
              <p>
                These terms are governed by the laws of the United States and the state where Congress Do Your Job is based,
                without regard to conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Contact</h2>
              <p>Questions about these terms?</p>
              <ul>
                <li>
                  Email:{" "}
                  <a href="mailto:legal@congressdoyourjob.com" className="text-amber-600 hover:text-amber-700">
                    legal@congressdoyourjob.com
                  </a>
                </li>
                <li>
                  General inquiries:{" "}
                  <a href="mailto:hello@congressdoyourjob.com" className="text-amber-600 hover:text-amber-700">
                    hello@congressdoyourjob.com
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
