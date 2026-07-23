-- ============================================================
-- 00003 — site admin flag + bulletin review RLS + reminder tracking
-- ============================================================

-- ------------------------------------------------------------
-- Site admin flag (manually set — see bottom of this file)
-- ------------------------------------------------------------
alter table public.users
  add column is_site_admin boolean not null default false;

-- Admins can update any bulletin post (approve/deny).
create policy "bulletin_admin_update" on public.bulletin_posts
  for update to authenticated using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_site_admin
    )
  );

-- Admins can also read pending/denied posts that aren't theirs
-- (existing "bulletin_read_approved_or_own" policy only covers approved + own).
create policy "bulletin_admin_read_all" on public.bulletin_posts
  for select to authenticated using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.is_site_admin
    )
  );

-- ------------------------------------------------------------
-- Reminder cron dedup tracking on speak_requests
-- ------------------------------------------------------------
alter table public.speak_requests
  add column reminder_24h_sent_at timestamptz,
  add column reminder_1h_sent_at timestamptz;

-- ------------------------------------------------------------
-- After running this migration, make yourself a site admin:
--
--   update public.users set is_site_admin = true where email = 'YOUR_EMAIL@tamu.edu';
--
-- Run that once in the Supabase SQL editor. No UI for this on purpose —
-- keeps admin promotion out of the app's attack surface.
-- ------------------------------------------------------------
