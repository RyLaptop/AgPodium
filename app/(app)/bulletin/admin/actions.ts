"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getResend, FROM_EMAIL } from "@/lib/email/resend";

type Result = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { data: profile } = await supabase.from("users").select("is_site_admin").eq("id", user.id).single();
  if (!profile?.is_site_admin) return { error: "Not authorized." };
  return { userId: user.id };
}

export async function adminUpdateUser(
  targetUserId: string,
  formData: FormData
): Promise<Result> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  const fullName = (formData.get("full_name") as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim() || null;
  const isSiteAdmin = formData.get("is_site_admin") === "true";

  const svc = createServiceClient();

  if (email) {
    const { error } = await svc.auth.admin.updateUserById(targetUserId, { email });
    if (error) return { ok: false, error: error.message };
  }

  const { error: profileErr } = await svc
    .from("users")
    .update({ full_name: fullName, ...(email ? { email } : {}), is_site_admin: isSiteAdmin })
    .eq("id", targetUserId);

  if (profileErr) return { ok: false, error: profileErr.message };
  return { ok: true };
}

export async function adminDeleteUser(targetUserId: string): Promise<Result> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, error: auth.error };

  if (auth.userId === targetUserId) return { ok: false, error: "Cannot delete your own account." };

  const svc = createServiceClient();
  const { error } = await svc.auth.admin.deleteUser(targetUserId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendTestEmail(): Promise<{ ok: boolean; message: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { ok: false, message: auth.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: "No email on your account." };

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, message: "RESEND_API_KEY is not set in Vercel environment variables." };
  }
  if (!process.env.RESEND_FROM_EMAIL) {
    return { ok: false, message: "RESEND_FROM_EMAIL is not set — add it in Vercel env vars (e.g. noreply@agpodium.com)." };
  }

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "AgPodium email test ✓",
      html: `<p>Test email from AgPodium.</p><p><b>From:</b> ${FROM_EMAIL}</p><p><b>To:</b> ${user.email}</p>`,
    });
    if ("error" in result && result.error) {
      return { ok: false, message: `Resend API error: ${JSON.stringify(result.error)}` };
    }
    return { ok: true, message: `Sent to ${user.email} from ${FROM_EMAIL}. Check your inbox and spam folder.` };
  } catch (err) {
    return { ok: false, message: `Exception: ${String(err)}` };
  }
}
