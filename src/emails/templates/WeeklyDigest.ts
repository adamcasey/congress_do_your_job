import { BaseEmailLayout } from "../layouts/BaseEmailLayout";
import { DigestBill, DigestStats } from "@/services/digest-generator";
import { CongressNewsItem } from "@/lib/gemini-api";

export interface WeeklyDigestProps {
  editionNumber: number;
  weekOf: string;
  headline: string;
  overallSummary: string;
  stats: DigestStats;
  newsItems: CongressNewsItem[];
  featuredBills: DigestBill[];
  congressFact?: string;
}

const NEWS_EMOJIS = ["🎭", "⚖️", "🏛️"];

function renderNewsItem(item: CongressNewsItem, index: number): string {
  const emoji = NEWS_EMOJIS[index] ?? "📋";
  const isLast = index === 2;
  const borderBottom = isLast
    ? ""
    : "border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 24px;";

  return `
    <div style="${borderBottom}">
      <p style="margin: 0 0 8px 0; display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.16em; padding: 3px 10px; border-radius: 4px;">
        ${emoji} This Week
      </p>
      <p style="margin: 6px 0 10px 0; color: #0f172a; font-size: 19px; font-weight: 800; line-height: 1.3; letter-spacing: -0.02em;">
        ${item.heading}
      </p>
      <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.75;">
        ${item.body}
      </p>
    </div>`;
}

function renderBillCard(bill: DigestBill, isLast: boolean): string {
  const billLabel = `${bill.type} ${bill.number}`;
  const borderBottom = isLast ? "" : "border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 24px;";

  const actionLine = bill.latestAction
    ? `<p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px; line-height: 1.5;">
        <strong style="color: #475569; text-transform: uppercase; letter-spacing: 0.05em; font-size: 10px;">Latest move:</strong>
        ${bill.latestAction}
       </p>`
    : "";

  const readMore = bill.url
    ? `<p style="margin: 10px 0 0 0;">
        <a href="${bill.url}" style="color: #1d4ed8; font-size: 12px; font-weight: 700; text-decoration: none;">
          Read the full bill
        </a>
       </p>`
    : "";

  return `
    <div style="${borderBottom}">
      <p style="margin: 0 0 8px 0; display: inline-block; background-color: #1e3a5f; color: #bfdbfe; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; padding: 3px 10px; border-radius: 4px;">
        🏛 ${billLabel}
      </p>
      <p style="margin: 6px 0 8px 0; color: #0f172a; font-size: 17px; font-weight: 700; line-height: 1.35; letter-spacing: -0.01em;">
        ${bill.title}
      </p>
      <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.75;">
        ${bill.summary}
      </p>
      ${actionLine}
      ${readMore}
    </div>`;
}

function sectionHeader(label: string): string {
  return `
    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr>
        <td style="padding-top: 8px; border-top: 2px solid #0f172a;">
          <span style="color: #0f172a; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em;">${label}</span>
        </td>
      </tr>
    </table>`;
}

export function WeeklyDigest({
  editionNumber,
  weekOf,
  overallSummary,
  stats,
  newsItems,
  featuredBills,
  congressFact,
}: WeeklyDigestProps): string {
  const newsSection =
    newsItems.length > 0
      ? `<tr>
           <td style="padding: 0 40px 32px 40px;">
             ${sectionHeader("This Week in Congress")}
             ${newsItems.map((item, i) => renderNewsItem(item, i)).join("")}
           </td>
         </tr>`
      : "";

  const billsBody =
    featuredBills.length > 0
      ? featuredBills.map((b, i) => renderBillCard(b, i === featuredBills.length - 1)).join("")
      : `<p style="color: #64748b; font-size: 14px; font-style: italic; margin: 0;">
           Nothing moved through the chambers this week. We checked.
         </p>`;

  const factBlock = congressFact
    ? `<tr>
         <td style="padding: 0 40px 32px 40px;">
           <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0;">
             <tr>
               <td style="padding: 16px 20px;">
                 <p style="margin: 0 0 4px 0; color: #92400e; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.16em;">
                   📜 Did You Know?
                 </p>
                 <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.7;">
                   ${congressFact}
                 </p>
               </td>
             </tr>
           </table>
         </td>
       </tr>`
    : "";

  const content = `
    <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff;">

      <!-- Wordmark -->
      <tr>
        <td style="padding: 36px 40px 8px 40px; text-align: center;">
          <p style="margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em;">
            Edition #${editionNumber} &bull; ${weekOf}
          </p>
          <h1 style="margin: 8px 0 4px 0; color: #0f172a; font-size: 28px; font-weight: 900; letter-spacing: -0.03em; line-height: 1.1;">
            Congress Do Your Job
          </h1>
          <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em;">
            Less theater. More legislation.
          </p>
        </td>
      </tr>

      <!-- Rule -->
      <tr>
        <td style="padding: 16px 40px 0 40px;">
          <div style="border-top: 1px solid #e2e8f0;"></div>
        </td>
      </tr>

      <!-- Greeting -->
      <tr>
        <td style="padding: 28px 40px 32px 40px;">
          <p style="margin: 0 0 12px 0; color: #0f172a; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
            Hey,
          </p>
          <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.75;">
            ${overallSummary}
          </p>
        </td>
      </tr>

      <!-- Stats -->
      <tr>
        <td style="padding: 0 40px 32px 40px;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <tr>
              <td style="padding: 16px 20px; text-align: center; border-right: 1px solid #e2e8f0; width: 50%;">
                <p style="margin: 0; color: #0f172a; font-size: 34px; font-weight: 900; line-height: 1; letter-spacing: -0.04em;">
                  ${stats.billsIntroduced}
                </p>
                <p style="margin: 4px 0 0 0; color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;">
                  New Bills
                </p>
              </td>
              <td style="padding: 16px 20px; text-align: center; width: 50%;">
                <p style="margin: 0; color: #0f172a; font-size: 34px; font-weight: 900; line-height: 1; letter-spacing: -0.04em;">
                  ${stats.billsWithRecentAction}
                </p>
                <p style="margin: 4px 0 0 0; color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em;">
                  Bills Moving
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${newsSection}

      <!-- Bills in Focus -->
      <tr>
        <td style="padding: 0 40px 32px 40px;">
          ${sectionHeader("Bills in Focus")}
          ${billsBody}
        </td>
      </tr>

      ${factBlock}

      <!-- Rule -->
      <tr>
        <td style="padding: 0 40px;">
          <div style="border-top: 1px solid #e2e8f0;"></div>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 28px 40px 36px 40px; text-align: center;">
          <p style="margin: 0 0 20px 0; color: #334155; font-size: 13px; line-height: 1.6;">
            Was this forwarded to you? Get the weekly briefing free at
            <a href="https://congressdoyourjob.com" style="color: #1d4ed8; font-weight: 700; text-decoration: none;">Congress Do Your Job</a>.
          </p>

          <p style="margin: 0 0 6px 0; color: #0f172a; font-size: 15px; font-weight: 900; letter-spacing: -0.02em;">
            <a href="https://congressdoyourjob.com" style="color: #0f172a; text-decoration: none;">Congress Do Your Job</a>
          </p>
          <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em;">
            Less theater. More legislation.
          </p>

          <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 11px; line-height: 1.6;">
            <a href="https://congressdoyourjob.com" style="color: #94a3b8; text-decoration: none;">Congress Do Your Job</a>
            provides weekly, non-partisan coverage of U.S. federal legislative activity.
            No spin. No outrage. Just what Congress did.
          </p>

          <p style="margin: 0 0 20px 0;">
            <a href="https://congressdoyourjob.com" style="color: #64748b; font-size: 11px; font-weight: 600; text-decoration: none;">Website</a>
            &nbsp;&bull;&nbsp;
            <a href="https://congressdoyourjob.com/unsubscribe" style="color: #64748b; font-size: 11px; font-weight: 600; text-decoration: none;">Unsubscribe</a>
            &nbsp;&bull;&nbsp;
            <a href="https://congressdoyourjob.com/privacy" style="color: #64748b; font-size: 11px; font-weight: 600; text-decoration: none;">Privacy Policy</a>
          </p>

          <p style="margin: 0; color: #cbd5e1; font-size: 10px; letter-spacing: 0.04em;">
            &copy; Congress Do Your Job &bull; Less theater. More legislation.
          </p>
        </td>
      </tr>

    </table>
  `;

  return BaseEmailLayout({
    content,
    preheader: `Week of ${weekOf}. Your plain-English Congress briefing.`,
  });
}
