"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/send";

type OrgEntry = {
  name: string;
  website: string;
  instagram: string;
  description: string;
};

type AmbassadorResult = { ok: true } | { ok: false; error: string };

export async function submitAmbassadorApplication(
  fullName: string,
  email: string,
  phone: string,
  university: string,
  orgs: OrgEntry[]
): Promise<AmbassadorResult> {
  if (!fullName.trim()) return { ok: false, error: "Full name is required." };
  if (!email.trim() || !email.includes("@")) return { ok: false, error: "A valid email is required." };
  if (!university.trim()) return { ok: false, error: "University name is required." };
  if (orgs.length === 0 || !orgs[0].name.trim()) return { ok: false, error: "At least one org name is required." };

  const svc = createServiceClient();
  const { data: admins } = await svc.from("users").select("email").eq("is_site_admin", true);
  if (!admins || admins.length === 0) return { ok: false, error: "Could not reach admins. Try again later." };

  const orgsHtml = orgs
    .filter((o) => o.name.trim())
    .map(
      (o, i) => `
      <div style="border-left:3px solid #e5e7eb;margin:12px 0;padding:8px 12px">
        <strong>Org ${i + 1}: ${o.name}</strong><br/>
        ${o.website ? `Website: <a href="${o.website}">${o.website}</a><br/>` : ""}
        ${o.instagram ? `Instagram: <a href="${o.instagram}">${o.instagram}</a><br/>` : ""}
        ${o.description ? `<em>${o.description}</em>` : ""}
      </div>`
    )
    .join("");

  const html = `
    <h2>New Campus Ambassador Application</h2>
    <p><strong>Name:</strong> ${fullName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
    <p><strong>University:</strong> ${university}</p>
    <h3>Organizations</h3>
    ${orgsHtml}
    <p style="color:#9ca3af;font-size:13px">— UniPodium Ambassador Applications</p>
  `;

  await Promise.all(
    admins.map((a) =>
      sendEmail({
        to: a.email,
        subject: `[Ambassador Application] ${fullName} — ${university}`,
        html,
      })
    )
  );

  return { ok: true };
}
