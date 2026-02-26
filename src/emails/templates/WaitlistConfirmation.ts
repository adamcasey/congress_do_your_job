import { BaseEmailLayout } from "../layouts/BaseEmailLayout";

/**
 * Waitlist confirmation email template
 * Sent when user successfully signs up for the waitlist
 */

interface WaitlistConfirmationProps {
  email: string;
}

export function WaitlistConfirmation({ email }: WaitlistConfirmationProps): string {
  const content = `
    <!-- Main container with gradient background -->
    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; background-image: linear-gradient(135deg, #eaf4fb 0%, #ffffff 50%, #fde7e3 100%); border-radius: 24px; border: 1px solid #fbbf24; box-shadow: 0 10px 25px rgba(251, 191, 36, 0.15); overflow: hidden;">
      <!--[if gte mso 9]>
      <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;">
        <v:fill type="gradient" color="#ffffff" color2="#eaf4fb" angle="135" />
      </v:rect>
      <![endif]-->
      <tr>
        <td style="padding: 48px 40px;">

            <!-- Header -->
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <h1 style="margin: 0; padding: 0; color: #0f172a; font-size: 36px; font-weight: 700; line-height: 1.2; letter-spacing: -0.02em;">
                    Congress Do Your Job
                  </h1>
                  <p style="margin: 8px 0 0 0; padding: 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em;">
                    Less theater. More legislation.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Main Content Box -->
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(148, 163, 184, 0.15);">
              <tr>
                <td style="padding: 32px 28px;">

                  <!-- Success Badge -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <tr>
                      <td align="center">
                        <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; padding: 8px 16px; border-radius: 999px; border: 1px solid #d1fae5;">
                          You're on the list
                        </span>
                      </td>
                    </tr>
                  </table>

                  <h2 style="margin: 0 0 16px 0; padding: 0; color: #0f172a; font-size: 24px; font-weight: 700; line-height: 1.3;">
                    Thanks for joining the movement.
                  </h2>

                  <p style="margin: 0 0 16px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.6;">
                    We're building a non-partisan platform that tracks what elected officials <strong style="color: #1e293b;">actually do</strong> — not what they say on cable news or social media.
                  </p>

                  <p style="margin: 0 0 24px 0; padding: 0; color: #475569; font-size: 16px; line-height: 1.6;">
                    You'll get notified when we launch with features like:
                  </p>

                  <!-- Feature List -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 6px; vertical-align: top; padding-top: 8px; padding-right: 12px;">
                              <span style="display: inline-block; width: 6px; height: 6px; background-color: #0f172a; border-radius: 50%;"></span>
                            </td>
                            <td style="vertical-align: top;">
                              <p style="margin: 0; padding: 0; color: #0f172a; font-size: 15px; font-weight: 600; line-height: 1.5;">
                                Weekly Briefings
                              </p>
                              <p style="margin: 4px 0 0 0; padding: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                Plain-English recaps every Monday — what passed, what stalled, what slipped
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 6px; vertical-align: top; padding-top: 8px; padding-right: 12px;">
                              <span style="display: inline-block; width: 6px; height: 6px; background-color: #0f172a; border-radius: 50%;"></span>
                            </td>
                            <td style="vertical-align: top;">
                              <p style="margin: 0; padding: 0; color: #0f172a; font-size: 15px; font-weight: 600; line-height: 1.5;">
                                Behavior-First Scorecards
                              </p>
                              <p style="margin: 4px 0 0 0; padding: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                Track attendance, productivity, and bipartisan work — no party labels, no spin
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 6px; vertical-align: top; padding-top: 8px; padding-right: 12px;">
                              <span style="display: inline-block; width: 6px; height: 6px; background-color: #0f172a; border-radius: 50%;"></span>
                            </td>
                            <td style="vertical-align: top;">
                              <p style="margin: 0; padding: 0; color: #0f172a; font-size: 15px; font-weight: 600; line-height: 1.5;">
                                One-Click Petitions
                              </p>
                              <p style="margin: 4px 0 0 0; padding: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                Send calm, neutral letters to your reps — "Please pass a budget on time"
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-top: 1px solid #e2e8f0;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="width: 6px; vertical-align: top; padding-top: 8px; padding-right: 12px;">
                              <span style="display: inline-block; width: 6px; height: 6px; background-color: #0f172a; border-radius: 50%;"></span>
                            </td>
                            <td style="vertical-align: top;">
                              <p style="margin: 0; padding: 0; color: #0f172a; font-size: 15px; font-weight: 600; line-height: 1.5;">
                                Theater vs. Work Tracking
                              </p>
                              <p style="margin: 4px 0 0 0; padding: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                                Compare time spent on TV/social media vs. actual legislative work
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Divider -->
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

                  <p style="margin: 0 0 8px 0; padding: 0; color: #0f172a; font-size: 15px; font-weight: 600; line-height: 1.5;">
                    Our promise:
                  </p>
                  <ul style="margin: 0; padding: 0 0 0 20px; color: #475569; font-size: 14px; line-height: 1.7;">
                    <li style="margin-bottom: 8px;">No outrage bait, no tribalism</li>
                    <li style="margin-bottom: 8px;">Transparent methodology for all scores</li>
                    <li style="margin-bottom: 8px;">Primary sources cited for every claim</li>
                    <li style="margin-bottom: 0;">No selling your data — ever</li>
                  </ul>

                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 32px;">
              <tr>
                <td align="center" style="padding: 0;">
                  <p style="margin: 0 0 8px 0; padding: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                    We'll send you <strong>one email</strong> when we launch. No spam. No third-party data brokers.
                  </p>
                  <p style="margin: 0; padding: 0; color: #94a3b8; font-size: 12px;">
                    CongressDoYourJob.com • Less theater. More legislation.
                  </p>
                </td>
              </tr>
            </table>

        </td>
      </tr>
    </table>
  `;

  return BaseEmailLayout({
    content,
    preheader: "You're on the list! We'll notify you when Congress Do Your Job launches.",
  });
}
