import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// DEV ONLY — delete before deploying to prod
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    // If user already exists, just update their password and confirm them
    if (error.message.includes("already")) {
      const list = await supabase.auth.admin.listUsers();
      const existing = list.data.users.find((u) => u.email === email);
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
        });
        return NextResponse.json({ ok: true, note: "updated existing user" });
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.user.id });
}
