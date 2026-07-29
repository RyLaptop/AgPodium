import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/send";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://agpodium.com";

type NotifInput = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
};

export async function notify(items: NotifInput[]) {
  if (items.length === 0) return;
  const admin = createServiceClient();

  await admin.from("notifications").insert(
    items.map((n) => ({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
    }))
  );

  // Fetch emails for all recipients in one query
  const userIds = [...new Set(items.map((n) => n.userId))];
  const { data: users } = await admin
    .from("users")
    .select("id, email, full_name")
    .in("id", userIds);

  if (!users || users.length === 0) return;
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Send one email per notification, fire-and-forget (sendEmail swallows errors)
  await Promise.all(
    items.map((n) => {
      const u = userMap.get(n.userId);
      if (!u?.email) return;
      const name = u.full_name ?? u.email.split("@")[0];
      const linkHtml = n.link
        ? `<p><a href="${APP_URL}${n.link}" style="color:#2563eb;text-decoration:none">View on AgPodium →</a></p>`
        : "";
      return sendEmail({
        to: u.email,
        subject: n.title,
        html: `<p>Hi ${name},</p>
<p>${n.title}${n.body ? `<br/><span style="color:#6b7280;font-size:14px">${n.body}</span>` : ""}</p>
${linkHtml}
<p style="color:#9ca3af;font-size:13px">— AgPodium</p>`,
      });
    })
  );
}
