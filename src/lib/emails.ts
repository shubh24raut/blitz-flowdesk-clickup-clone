import type { EmailMessage } from "./resend";

/**
 * Transactional email templates. Plain inline-styled HTML (email clients ignore
 * stylesheets) with a text fallback. Every user-supplied value is escaped.
 */

const BRAND = "#5B5CF6";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout({ heading, body, cta, url, footer }: { heading: string; body: string; cta: string; url: string; footer: string }): string {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f5ff;font-family:Inter,Segoe UI,Arial,sans-serif;color:#111827">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px">
          <tr><td>
            <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:${BRAND}">FlowDesk</p>
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:600">${heading}</h1>
            <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#475569">${body}</p>
            <a href="${safeUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px">${cta}</a>
            <p style="margin:24px 0 0;font-size:12px;line-height:18px;color:#94a3b8">${footer}<br>If the button doesn't work, paste this link into your browser:<br><a href="${safeUrl}" style="color:${BRAND};word-break:break-all">${safeUrl}</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function resetPasswordEmail({ to, name, url }: { to: string; name: string; url: string }): EmailMessage {
  return {
    to,
    subject: "Reset your FlowDesk password",
    html: layout({
      heading: "Reset your password",
      body: `Hi ${escapeHtml(name)}, we received a request to reset your FlowDesk password. The link expires in 1 hour.`,
      cta: "Choose a new password",
      url,
      footer: "If you didn't ask for this, you can ignore this email — your password stays the same.",
    }),
    text: `Hi ${name},\n\nReset your FlowDesk password (link expires in 1 hour):\n${url}\n\nIf you didn't ask for this, ignore this email.`,
  };
}

export function verifyEmailEmail({ to, name, url }: { to: string; name: string; url: string }): EmailMessage {
  return {
    to,
    subject: "Verify your email for FlowDesk",
    html: layout({
      heading: "Confirm your email",
      body: `Hi ${escapeHtml(name)}, confirm this address to finish setting up your FlowDesk account.`,
      cta: "Verify email",
      url,
      footer: "If you didn't create a FlowDesk account, you can ignore this email.",
    }),
    text: `Hi ${name},\n\nConfirm your email for FlowDesk:\n${url}`,
  };
}

export function invitationEmail({
  to,
  inviterName,
  organizationName,
  role,
  url,
}: {
  to: string;
  inviterName: string;
  organizationName: string;
  role: string;
  url: string;
}): EmailMessage {
  const org = escapeHtml(organizationName);
  return {
    to,
    subject: `${inviterName} invited you to ${organizationName} on FlowDesk`,
    html: layout({
      heading: `Join ${org} on FlowDesk`,
      body: `${escapeHtml(inviterName)} invited you to the <strong>${org}</strong> workspace as ${escapeHtml(role)}. The invitation expires in 7 days.`,
      cta: "Accept invitation",
      url,
      footer: "If you weren't expecting this invitation, you can ignore this email.",
    }),
    text: `${inviterName} invited you to the ${organizationName} workspace on FlowDesk as ${role}.\n\nAccept the invitation (expires in 7 days):\n${url}`,
  };
}
