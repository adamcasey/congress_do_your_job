import { latoFont, freePressFont } from '@/styles/fonts'
import Link from 'next/link'
import { FeatureFlagGuard } from '@/components/FeatureFlagGuard'
import { FeatureFlag } from '@/lib/feature-flags'

export const metadata = {
  title: 'Accessibility Statement | Congress Do Your Job',
  description: 'Our commitment to digital accessibility.',
}

export default function AccessibilityPage() {
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
          <h1 className={`${freePressFont.className} text-4xl font-semibold text-slate-900`}>
            Accessibility Statement
          </h1>
          <p className="text-lg text-slate-600">Last updated: January 15, 2026</p>

          <div className="mt-8 space-y-6 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Our Commitment</h2>
              <p>
                Congress Do Your Job is committed to ensuring digital accessibility for all people, including those
                with disabilities. We are continually improving the user experience and applying relevant
                accessibility standards.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Conformance Status</h2>
              <p>
                We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These guidelines
                help make web content more accessible to people with disabilities and all users in general.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Accessibility Features</h2>
              <ul>
                <li>
                  <strong>Semantic HTML:</strong> Proper heading hierarchy and landmark regions
                </li>
                <li>
                  <strong>Keyboard Navigation:</strong> All interactive elements are keyboard accessible
                </li>
                <li>
                  <strong>Screen Reader Support:</strong> ARIA labels and descriptions where needed
                </li>
                <li>
                  <strong>Color Contrast:</strong> Text meets WCAG AA contrast requirements
                </li>
                <li>
                  <strong>Responsive Design:</strong> Works on all device sizes
                </li>
                <li>
                  <strong>Clear Language:</strong> Plain English, 8th-grade reading level target
                </li>
                <li>
                  <strong>Focus Indicators:</strong> Visible focus states for keyboard users
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Known Limitations</h2>
              <p>We are actively working to address the following:</p>
              <ul>
                <li>Some complex data visualizations may not be fully screen-reader accessible yet</li>
                <li>PDFs generated for report cards are being improved for accessibility</li>
                <li>Third-party embedded content may not meet our accessibility standards</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Assistive Technologies</h2>
              <p>This site is designed to be compatible with:</p>
              <ul>
                <li>Screen readers (NVDA, JAWS, VoiceOver)</li>
                <li>Keyboard-only navigation</li>
                <li>Voice recognition software</li>
                <li>Screen magnification tools</li>
                <li>Browser text size adjustments</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Feedback and Contact</h2>
              <p>
                We welcome feedback on the accessibility of Congress Do Your Job. If you encounter accessibility
                barriers, please let us know:
              </p>
              <ul>
                <li>
                  Email:{' '}
                  <a
                    href="mailto:accessibility@congressdoyourjob.com"
                    className="text-amber-600 hover:text-amber-700"
                  >
                    accessibility@congressdoyourjob.com
                  </a>
                </li>
                <li>
                  General inquiries:{' '}
                  <a href="mailto:hello@congressdoyourjob.com" className="text-amber-600 hover:text-amber-700">
                    hello@congressdoyourjob.com
                  </a>
                </li>
              </ul>
              <p>We aim to respond to accessibility feedback within 5 business days.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Alternative Formats</h2>
              <p>
                If you need information from this site in an alternative format (large print, audio, braille, etc.),
                please contact us and we will work with you to provide it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Ongoing Efforts</h2>
              <p>We are committed to continuous improvement through:</p>
              <ul>
                <li>Regular accessibility audits</li>
                <li>User testing with people who use assistive technologies</li>
                <li>Training our team on accessibility best practices</li>
                <li>Incorporating accessibility into our design and development process</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Technical Specifications</h2>
              <p>Accessibility relies on the following technologies:</p>
              <ul>
                <li>HTML5</li>
                <li>CSS3</li>
                <li>JavaScript (with graceful degradation where possible)</li>
                <li>ARIA (Accessible Rich Internet Applications)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">Assessment and Remediation</h2>
              <p>This statement was created on January 15, 2026.</p>
              <p>
                This website was last assessed for accessibility compliance on January 15, 2026. We conduct regular
                assessments and make improvements on an ongoing basis.
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
    </FeatureFlagGuard>
  )
}
