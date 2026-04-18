import { BaseEmailLayout } from "../layouts/BaseEmailLayout";
import { DigestBill, DigestStats } from "@/services/digest-generator";

export interface WeeklyDigestProps {
  editionNumber: number;
  weekOf: string;
  headline: string;
  overallSummary: string;
  stats: DigestStats;
  featuredBills: DigestBill[];
}

function renderBillRow(bill: DigestBill): string {
  const billLabel = `${bill.type} ${bill.number}`;
  const actionLine = bill.latestAction
    ? `<p style="margin: 6px 0 0 0; padding: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
        <strong style="color: #94a3b8;">Latest action:</strong> ${bill.latestAction}
       </p>`
    : "";

  return `
    <tr>
      <td style="padding: 20px 0; border-top: 1px solid #e2e8f0;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td>
              <span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">
                ${billLabel}
              </span>
              <p style="margin: 0; padding: 0; color: #0f172a; font-size: 15px; font-weight: 600; line-height: 1.4;">
                ${bill.title}
              </p>
              <p style="margin: 8px 0 0 0; padding: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                ${bill.summary}
              </p>
              ${actionLine}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function WeeklyDigest({
  editionNumber,
  weekOf,
  headline,
  overallSummary,
  stats,
  featuredBills,
}: WeeklyDigestProps): string {
  const billRows = featuredBills.map(renderBillRow).join("");
  const noBillsMessage =
    featuredBills.length === 0
      ? `<tr><td style="padding: 20px 0; color: #64748b; font-size: 14px; font-style: italic;">No significant bill activity this week.</td></tr>`
      : "";

  const content = `
    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 8px 24px rgba(15,23,42,0.08); overflow: hidden;">

      <!-- Header -->
      <tr>
        <td style="padding: 40px 40px 32px 40px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">
                  Edition #${editionNumber} &bull; Week of ${weekOf}
                </p>
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; line-height: 1.3; letter-spacing: -0.01em;">
                  Congress Do Your Job
                </h1>
                <p style="margin: 6px 0 0 0; color: #cbd5e1; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.15em;">
                  Less theater. More legislation.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Weekly Summary -->
      <tr>
        <td style="padding: 28px 40px 0 40px;">
          <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 20px; font-weight: 700; line-height: 1.3;">
            ${headline}
          </h2>
          <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.7;">
            ${overallSummary}
          </p>
        </td>
      </tr>

      <!-- Stats Row -->
      <tr>
        <td style="padding: 24px 40px;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 20px; text-align: center; border-right: 1px solid #e2e8f0; width: 50%;">
                <p style="margin: 0; color: #0f172a; font-size: 32px; font-weight: 800; line-height: 1;">${stats.billsIntroduced}</p>
                <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Bills Introduced</p>
              </td>
              <td style="padding: 20px; text-align: center; width: 50%;">
                <p style="margin: 0; color: #0f172a; font-size: 32px; font-weight: 800; line-height: 1;">${stats.billsWithRecentAction}</p>
                <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Bills With Activity</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Bills in Focus -->
      <tr>
        <td style="padding: 0 40px 32px 40px;">
          <h3 style="margin: 0 0 4px 0; color: #0f172a; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">
            Bills in Focus
          </h3>
          <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px;">
            Plain-English summaries of this week's notable legislation
          </p>
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            ${billRows}
            ${noBillsMessage}
          </table>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding: 0 40px 32px 40px;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
            <tr>
              <td style="padding: 20px 24px;">
                <p style="margin: 0 0 12px 0; color: #065f46; font-size: 14px; font-weight: 600; line-height: 1.5;">
                  Want full bill text, voting records, and representative scorecards?
                </p>
                <a href="https://congressdoyourjob.com" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 10px 20px; border-radius: 8px; letter-spacing: 0.03em;">
                  Visit CongressDoYourJob.com
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 24px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
          <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px; line-height: 1.6; text-align: center;">
            You're receiving this because you signed up at <strong>CongressDoYourJob.com</strong>.<br>
            No spin, no outrage — just what Congress actually did.
          </p>
          <p style="margin: 0; color: #94a3b8; font-size: 11px; text-align: center;">
            CongressDoYourJob.com &bull; Less theater. More legislation.
          </p>
        </td>
      </tr>

    </table>
  `;

  return BaseEmailLayout({
    content,
    preheader: `Your weekly Congress briefing — ${headline}`,
  });
}
