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
    const result = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if ("error" in result && result.error) {
      console.error("[sendEmail] Resend error:", result.error, { to, subject });
    }
  } catch (err) {
    console.error("[sendEmail] Exception:", err, { to, subject });
  }
}
