-- ============================================================
-- 00002 — org joins + atomic org creation
-- ============================================================

-- Allow users to self-insert as plain 'member' only.
-- Officers/directors still require an existing director to add them (from schema 1 policy).
create policy "org_members_self_join_as_member" on public.org_members
  for insert to authenticated
  with check (user_id = auth.uid() and role = 'member');

-- Atomic org creation:
-- - Inserts into public.orgs
-- - Adds the caller as director in public.org_members
-- Runs SECURITY DEFINER to bypass the chicken-and-egg director RLS check on org_members.
create or replace function public.create_org(
  p_slug text,
  p_name text,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Not authenticated';
  end if;

  -- Basic validation (RLS on orgs would also enforce created_by = auth.uid())
  if p_slug is null or length(trim(p_slug)) < 2 then
    raise exception 'Slug must be at least 2 chars';
  end if;
  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'Name must be at least 2 chars';
  end if;

  insert into public.orgs (slug, name, description, created_by)
  values (lower(trim(p_slug)), trim(p_name), nullif(trim(p_description), ''), caller)
  returning id into new_id;

  insert into public.org_members (org_id, user_id, role)
  values (new_id, caller, 'director');

  return new_id;
end;
$$;

grant execute on function public.create_org(text, text, text) to authenticated;
