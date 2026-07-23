create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "users read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "users dismiss own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

create index notifications_user_idx
  on public.notifications(user_id, created_at desc)
  where dismissed_at is null;

grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
