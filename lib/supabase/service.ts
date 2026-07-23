import { createClient } from "@supabase/supabase-js";

// Service-role client for server-only code (cron routes) that needs to
// read/write across all orgs, bypassing RLS. Never import this from
// anything reachable by a client component or a user-triggered server action.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
