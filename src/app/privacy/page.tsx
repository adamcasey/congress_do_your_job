import { latoFont, freePressFont } from '@/styles/fonts'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Congress Do Your Job',
  description: 'Our privacy policy and data handling practices.',
}

export default function PrivacyPage() {
  return (
    <main className={`min-h-screen px-4 pb-20 pt-10 ${latoFont.className}`}>
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900"
        >
          &larr; Back to home
        </Link>

        <article className="prose prose-slate max-w-none">
          <h1 className={`${freePressFont.className} text-4xl font-semibold text-slate-900`}>Privacy Policy</h1>
          <p className="text-lg text-slate-600">Last updated: January 15, 2026</p>

          <div className="mt-8 space-y-6 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Our Commitment</h2>
              <p>
                Congress Do Your Job is committed to protecting your privacy. We collect minimal data, never sell
                your information, and maintain transparency about our practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Information We Collect</h2>
              <h3 className="text-xl font-semibold text-slate-900">Information You Provide</h3>
              <ul>
                <li>Email address (for weekly briefings and account creation)</li>
                <li>Physical address (to identify your representatives)</li>
                <li>Payment information (processed securely through Stripe)</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900">Automatically Collected Information</h3>
              <ul>
                <li>Usage analytics (via Vercel Speed Insights)</li>
                <li>Browser type and device information</li>
                <li>Pages visited and time spent on site</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">How We Use Your Information</h2>
              <ul>
                <li>Deliver weekly briefings and notifications you requested</li>
                <li>Show you information about your specific representatives</li>
                <li>Process membership payments and donations</li>
                <li>Improve site performance and user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Data Sharing</h2>
              <p>
                <strong>We never sell your data.</strong> We only share information with:
              </p>
              <ul>
                <li>
                  <strong>Service providers:</strong> Email delivery (Resend/Mailgun), payment processing (Stripe),
                  physical mail (Lob.com)
                </li>
                <li>
                  <strong>Legal requirements:</strong> When required by law or to protect our rights
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data</li>
              </ul>
              <p>
                To exercise these rights, contact us at{' '}
                <a href="mailto:privacy@congressdoyourjob.com" className="text-amber-600 hover:text-amber-700">
                  privacy@congressdoyourjob.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Data Security</h2>
              <p>
                We use industry-standard security measures including encryption, secure HTTPS connections, and
                regular security audits to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Children&apos;s Privacy</h2>
              <p>
                Our service is not directed to children under 13. We do not knowingly collect information from
                children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Changes to This Policy</h2>
              <p>
                We may update this policy periodically. We will notify users of significant changes via email or
                prominent site notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Contact Us</h2>
              <p>Questions about this privacy policy? Contact us:</p>
              <ul>
                <li>
                  Email:{' '}
                  <a href="mailto:privacy@congressdoyourjob.com" className="text-amber-600 hover:text-amber-700">
                    privacy@congressdoyourjob.com
                  </a>
                </li>
                <li>
                  General inquiries:{' '}
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
  )
}
