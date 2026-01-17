import { latoFont, freePressFont } from '@/styles/fonts'
import Link from 'next/link'
import { FeatureFlagGuard } from '@/components/FeatureFlagGuard'
import { FeatureFlag } from '@/lib/feature-flags'

export const metadata = {
  title: 'Cookie Policy | Congress Do Your Job',
  description: 'How we use cookies and tracking technologies.',
}

export default function CookiesPage() {
  return (
    <FeatureFlagGuard flag={FeatureFlag.COMING_SOON_LANDING_PAGE}>
      <main className={`min-h-screen px-4 pb-20 pt-10 ${latoFont.className}`}>
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900"
        >
          &larr; Back to home
        </Link>

        <article className="prose prose-slate max-w-none">
          <h1 className={`${freePressFont.className} text-4xl font-semibold text-slate-900`}>Cookie Policy</h1>
          <p className="text-lg text-slate-600">Last updated: January 15, 2026</p>

          <div className="mt-8 space-y-6 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">What Are Cookies?</h2>
              <p>
                Cookies are small text files stored on your device when you visit a website. They help us remember
                your preferences, understand how you use our site, and improve your experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">How We Use Cookies</h2>

              <h3 className="text-xl font-semibold text-slate-900">Essential Cookies</h3>
              <p>Required for the site to function properly:</p>
              <ul>
                <li>Authentication (Clerk session cookies)</li>
                <li>Security and fraud prevention</li>
                <li>Load balancing and performance</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900">Analytics Cookies</h3>
              <p>Help us understand how visitors use our site:</p>
              <ul>
                <li>
                  <strong>Vercel Speed Insights:</strong> Page load times, performance metrics
                </li>
                <li>
                  <strong>LaunchDarkly:</strong> Feature flag evaluation (anonymous)
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900">Functional Cookies</h3>
              <p>Remember your preferences:</p>
              <ul>
                <li>Saved representative information</li>
                <li>Notification preferences</li>
                <li>Display settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Third-Party Cookies</h2>
              <p>We use services that may set their own cookies:</p>
              <ul>
                <li>
                  <strong>Stripe:</strong> Payment processing (when making donations or purchases)
                </li>
                <li>
                  <strong>Clerk:</strong> Authentication and user management
                </li>
                <li>
                  <strong>Vercel:</strong> Hosting and performance monitoring
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Cookies We Do NOT Use</h2>
              <ul>
                <li>Advertising or tracking cookies from ad networks</li>
                <li>Social media tracking pixels (except for share buttons you click)</li>
                <li>Cross-site tracking for marketing purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Managing Cookies</h2>
              <h3 className="text-xl font-semibold text-slate-900">Browser Controls</h3>
              <p>Most browsers allow you to:</p>
              <ul>
                <li>View and delete cookies</li>
                <li>Block all cookies</li>
                <li>Block third-party cookies</li>
                <li>Clear cookies when you close your browser</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900">Impact of Blocking Cookies</h3>
              <p>If you block cookies:</p>
              <ul>
                <li>You may need to log in more frequently</li>
                <li>Some features may not work properly</li>
                <li>We cannot remember your preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Local Storage</h2>
              <p>In addition to cookies, we use browser local storage for:</p>
              <ul>
                <li>Caching feature flags (LaunchDarkly)</li>
                <li>Temporary form data (to prevent loss on accidental refresh)</li>
                <li>User interface state</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. Check this page periodically for changes. The
                &quot;Last updated&quot; date at the top indicates when this policy was last revised.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Contact</h2>
              <p>Questions about our use of cookies?</p>
              <ul>
                <li>
                  Email:{' '}
                  <a href="mailto:privacy@congressdoyourjob.com" className="text-amber-600 hover:text-amber-700">
                    privacy@congressdoyourjob.com
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </div>
    </main>
    </FeatureFlagGuard>
  )
}
