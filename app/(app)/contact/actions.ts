"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/send";

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function sendContactMessage(
  _prev: ContactResult | null,
  formData: FormData
): Promise<ContactResult> {
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!subject) return { ok: false, error: "Subject is required." };
  if (body.length < 10) return { ok: false, error: "Message is too short." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const svc = createServiceClient();
  const { data: admins } = await svc.from("users").select("email").eq("is_site_admin", true);
  if (!admins || admins.length === 0) {
    return { ok: false, error: "No admin contacts found." };
  }

  const senderLabel = user?.email ?? "Anonymous";
  const html = `
    <h2>Contact message from UniPodium</h2>
    <p><b>From:</b> ${senderLabel}</p>
    <p><b>Subject:</b> ${subject}</p>
    <hr/>
    <p style="white-space:pre-wrap">${body.replace(/</g, "&lt;")}</p>
  `;

  await Promise.all(
    admins.map((a) =>
      sendEmail({ to: a.email, subject: `[UniPodium Contact] ${subject}`, html })
    )
  );

  return { ok: true };
}

export async function sendHelpQuery(
  _prev: ContactResult | null,
  formData: FormData
): Promise<ContactResult> {
  const question = String(formData.get("question") ?? "").trim();

  if (question.length < 10) return { ok: false, error: "Please describe your issue in more detail." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const svc = createServiceClient();
  const { data: admins } = await svc.from("users").select("email").eq("is_site_admin", true);
  if (!admins || admins.length === 0) {
    return { ok: false, error: "No admin contacts found." };
  }

  const senderLabel = user?.email ?? "Anonymous";
  const html = `
    <h2>Help query from UniPodium</h2>
    <p><b>From:</b> ${senderLabel}</p>
    <hr/>
    <p style="white-space:pre-wrap">${question.replace(/</g, "&lt;")}</p>
  `;

  await Promise.all(
    admins.map((a) =>
      sendEmail({ to: a.email, subject: `[UniPodium Help] Query from ${senderLabel}`, html })
    )
  );

  return { ok: true };
}
