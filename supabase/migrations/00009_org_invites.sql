-- ============================================================
-- 00009 — org invite links
-- ============================================================

create table public.org_invites (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  org_id      uuid not null references public.orgs(id) on delete cascade,
  created_by  uuid not null references public.users(id),
  created_at  timestamptz not null default now(),
  use_count   integer not null default 0
);

create index org_invites_code_idx on public.org_invites(code);

alter table public.org_invites enable row level security;

-- Anyone authenticated can look up an invite by code (needed for landing page)
create policy "invites_read_all" on public.org_invites
  for select to authenticated using (true);

-- Directors can create invites for their own org
create policy "invites_insert_directors" on public.org_invites
  for insert to authenticated
  with check (public.has_org_role(org_id, 'director'));

-- Directors can revoke invites for their own org
create policy "invites_delete_directors" on public.org_invites
  for delete to authenticated
  using (public.has_org_role(org_id, 'director'));

grant all on public.org_invites to service_role;
grant select, insert, delete on public.org_invites to authenticated;
