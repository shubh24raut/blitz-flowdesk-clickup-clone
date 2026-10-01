import "server-only";
import { Resend } from "resend";

/** Resend client for transactional email. `null` when RESEND_API_KEY isn't configured. */
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Reserved example/test domains (RFC 2606) never receive mail — e.g. end-to-end test accounts. */
const RESERVED_DOMAIN = /@(?:[^@]+\.)?(?:example\.(?:com|org|net)|[^@]+\.(?:test|example|invalid|localhost))$/i;

/**
 * Sends one email. Without an API key (local dev) the message is logged instead,
 * so auth flows keep working. Throws when Resend rejects the message.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (RESERVED_DOMAIN.test(message.to)) {
    console.info(`[email] skipped "${message.subject}" to reserved address ${message.to}`);
    return;
  }
  if (!resend || !from) {
    console.info(`[email] RESEND_API_KEY/EMAIL_FROM not set — would send "${message.subject}" to ${message.to}\n${message.text}`);
    return;
  }
  const { error } = await resend.emails.send({ from, ...message });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/**
 * Fire-and-forget variant for auth callbacks: responding without waiting avoids
 * leaking (through timing) whether an address has an account. Failures are logged.
 */
export function queueEmail(message: EmailMessage): void {
  sendEmail(message).catch((error: unknown) => console.error(`[email] failed to send "${message.subject}" to ${message.to}`, error));
}
