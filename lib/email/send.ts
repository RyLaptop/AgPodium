import { getResend, FROM_EMAIL } from "./resend";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resend = getResend();
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch {
    // Email failures are non-fatal
  }
}
