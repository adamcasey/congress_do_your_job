import { BaseEmailLayout } from "../layouts/BaseEmailLayout";

/**
 * Weekly digest email template
 * Sent every Monday morning with Congressional activity recap
 *
 * TODO: Implement once weekly digest data structure is finalized
 */

interface WeeklyDigestProps {
  weekOf: string;
  billsAdvanced: number;
  hearingsHeld: number;
  deadlinesMissed: number;
  topStories: Array<{
    title: string;
    summary: string;
    status: string;
  }>;
}

export function WeeklyDigest(props: WeeklyDigestProps): string {
  const content = `
    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 40px 20px; text-align: center;">
          <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0;">
            Weekly Digest
          </h1>
          <p style="color: #64748b; font-size: 14px; margin: 8px 0 0 0;">
            Week of ${props.weekOf}
          </p>

          <div style="margin-top: 32px; padding: 24px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
              Weekly digest template coming soon. This will include:
            </p>
            <ul style="color: #475569; font-size: 14px; text-align: left; margin: 16px 0;">
              <li>Bills advanced: ${props.billsAdvanced}</li>
              <li>Hearings held: ${props.hearingsHeld}</li>
              <li>Deadlines missed: ${props.deadlinesMissed}</li>
            </ul>
          </div>
        </td>
      </tr>
    </table>
  `;

  return BaseEmailLayout({
    content,
    preheader: `Your weekly Congress briefing for ${props.weekOf}`,
  });
}
