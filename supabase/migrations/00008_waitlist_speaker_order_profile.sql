-- ============================================================
-- 00008 — meeting waitlist, speaker order, user profile fields
-- ============================================================

-- Waitlist for full meetings
create table public.meeting_waitlist (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.meetings(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(meeting_id, user_id)
);

create index meeting_waitlist_meeting_idx on public.meeting_waitlist(meeting_id, created_at);

alter table public.meeting_waitlist enable row level security;

create policy "waitlist_read_own_or_officer" on public.meeting_waitlist
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.meetings m
      where m.id = meeting_id and public.has_org_role(m.org_id, 'officer')
    )
  );

create policy "waitlist_insert_self" on public.meeting_waitlist
  for insert to authenticated with check (user_id = auth.uid());

create policy "waitlist_delete_self" on public.meeting_waitlist
  for delete to authenticated using (user_id = auth.uid());

grant all on public.meeting_waitlist to service_role;
grant select, insert, delete on public.meeting_waitlist to authenticated;

-- Speaker ordering (set when approved, used to sort the lineup)
alter table public.speak_requests
  add column if not exists speaker_order integer;

-- User profile fields
alter table public.users
  add column if not exists bio text,
  add column if not exists major text;
