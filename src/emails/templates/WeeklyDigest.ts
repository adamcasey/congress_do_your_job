import { BaseEmailLayout } from "../layouts/BaseEmailLayout";
import { DigestBill, DigestStats } from "@/services/digest-generator";

export interface WeeklyDigestProps {
  editionNumber: number;
  weekOf: string;
  headline: string;
  overallSummary: string;
  stats: DigestStats;
  featuredBills: DigestBill[];
  congressFact?: string;
}

function renderBillCard(bill: DigestBill): string {
  const billLabel = `${bill.type} ${bill.number}`;
  const actionLine = bill.latestAction
    ? `<p style="margin: 10px 0 0 0; padding: 8px 12px; background-color: #f1f5f9; border-radius: 6px; color: #475569; font-size: 12px; line-height: 1.5;">
        <strong style="color: #334155; text-transform: uppercase; letter-spacing: 0.06em; font-size: 10px;">Last action &rarr;</strong>
        &nbsp;${bill.latestAction}
       </p>`
    : "";

  const cta = bill.url
    ? `<p style="margin: 12px 0 0 0;">
        <a href="${bill.url}" style="color: #2563eb; font-size: 12px; font-weight: 600; text-decoration: none; letter-spacing: 0.02em;">
          Read the full bill &rarr;
        </a>
       </p>`
    : "";

  return `
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
      <tr>
        <td style="padding: 20px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <span style="display: inline-block; background-color: #1e3a5f; color: #bfdbfe; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; padding: 3px 9px; border-radius: 4px; margin-bottom: 10px;">
            🏛 ${billLabel}
          </span>
          <p style="margin: 0 0 8px 0; color: #0f172a; font-size: 16px; font-weight: 700; line-height: 1.35; letter-spacing: -0.01em;">
            ${bill.title}
          </p>
          <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.7;">
            ${bill.summary}
          </p>
          ${actionLine}
          ${cta}
        </td>
      </tr>
    </table>`;
}

export function WeeklyDigest({
  editionNumber,
  weekOf,
  headline,
  overallSummary,
  stats,
  featuredBills,
  congressFact,
}: WeeklyDigestProps): string {
  const billCards = featuredBills.map(renderBillCard).join("");
  const noBillsMessage =
    featuredBills.length === 0
      ? `<table role="presentation" style="width: 100%; border-collapse: collapse;">
           <tr>
             <td style="padding: 20px 0; color: #64748b; font-size: 14px; font-style: italic;">
               Nothing moved through the chambers this week. We checked.
             </td>
           </tr>
         </table>`
      : "";

  const factBlock = congressFact
    ? `<!-- Congress Fact -->
       <tr>
         <td style="padding: 0 32px 28px 32px;">
           <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px;">
             <tr>
               <td style="padding: 18px 22px;">
                 <p style="margin: 0 0 6px 0; color: #92400e; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.16em;">
                   📜 Did You Know?
                 </p>
                 <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.65;">
                   ${congressFact}
                 </p>
               </td>
             </tr>
           </table>
         </td>
       </tr>`
    : "";

  const content = `
    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(15,23,42,0.07);">

      <!-- Header -->
      <tr>
        <td style="padding: 32px 32px 28px 32px; background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%);">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em;">
                  Edition #${editionNumber} &bull; ${weekOf}
                </p>
                <h1 style="margin: 0 0 4px 0; color: #ffffff; font-size: 26px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em;">
                  Congress Do Your Job
                </h1>
                <p style="margin: 0; color: #7dd3fc; font-size: 12px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;">
                  Less theater. More legislation.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Greeting -->
      <tr>
        <td style="padding: 28px 32px 0 32px;">
          <p style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px; font-weight: 700; line-height: 1.3;">
            Hey,
          </p>
          <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.7;">
            ${overallSummary}
          </p>
        </td>
      </tr>

      <!-- Stats -->
      <tr>
        <td style="padding: 24px 32px;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 18px 16px; text-align: center; border-right: 1px solid #e2e8f0; width: 50%;">
                <p style="margin: 0; color: #0f172a; font-size: 36px; font-weight: 900; line-height: 1; letter-spacing: -0.03em;">${stats.billsIntroduced}</p>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">New Bills</p>
              </td>
              <td style="padding: 18px 16px; text-align: center; width: 50%;">
                <p style="margin: 0; color: #0f172a; font-size: 36px; font-weight: 900; line-height: 1; letter-spacing: -0.03em;">${stats.billsWithRecentAction}</p>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Bills Moving</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Section header -->
      <tr>
        <td style="padding: 0 32px 14px 32px;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
                <span style="color: #0f172a; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em;">On the Hill This Week</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Bill Cards -->
      <tr>
        <td style="padding: 0 32px 28px 32px;">
          ${billCards}
          ${noBillsMessage}
        </td>
      </tr>

      ${factBlock}

      <!-- CTA -->
      <tr>
        <td style="padding: 0 32px 32px 32px;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); border-radius: 12px;">
            <tr>
              <td style="padding: 22px 24px;">
                <p style="margin: 0 0 4px 0; color: #bfdbfe; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em;">
                  Want the full picture?
                </p>
                <p style="margin: 0 0 14px 0; color: #ffffff; font-size: 15px; font-weight: 600; line-height: 1.4;">
                  Voting records, scorecards, and representative profiles — all in one place.
                </p>
                <a href="https://congressdoyourjob.com" style="display: inline-block; background-color: #f59e0b; color: #0f172a; font-size: 13px; font-weight: 800; text-decoration: none; padding: 10px 22px; border-radius: 8px; letter-spacing: 0.04em;">
                  Go to CongressDoYourJob.com &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 20px 32px 24px 32px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 11px; line-height: 1.6; text-align: center;">
            You signed up at <strong>CongressDoYourJob.com</strong>. No spin, no outrage — just what Congress did.
          </p>
          <p style="margin: 0; color: #94a3b8; font-size: 10px; text-align: center; letter-spacing: 0.04em;">
            CongressDoYourJob.com &bull; Less theater. More legislation.
          </p>
        </td>
      </tr>

    </table>
  `;

  return BaseEmailLayout({
    content,
    preheader: `Week of ${weekOf} — ${headline}`,
  });
}
