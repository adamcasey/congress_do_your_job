/**
 * Base email layout wrapper
 * Provides consistent styling and structure for all emails
 */

interface BaseEmailLayoutProps {
  content: string;
  preheader?: string;
}

export function BaseEmailLayout({ content, preheader }: BaseEmailLayoutProps): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        ${preheader ? `<meta name="description" content="${preheader}">` : ""}
        <title>Congress Do Your Job</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
        ${
          preheader
            ? `
        <!-- Preheader text (hidden but shows in email preview) -->
        <div style="display: none; max-height: 0px; overflow: hidden;">
          ${preheader}
        </div>
        `
            : ""
        }

        <!-- Main wrapper table -->
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; min-height: 100vh;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              ${content}
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
