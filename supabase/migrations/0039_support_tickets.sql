-- Real support channel (spec section 11, الدعم والملاحظات). There was no
-- in-app way for a user to reach the team before this — no table, no
-- screen, nothing. This adds one: tickets + a threaded reply, with a
-- real (optional) satisfaction rating the user sets themselves.
-- Safe to re-run: idempotent.

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  type text not null default 'other' check (type in ('bug', 'account', 'content', 'suggestion', 'other')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  app_version text,
  device text,
  satisfaction smallint check (satisfaction between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;

drop policy if exists "users manage their own tickets" on public.support_tickets;
create policy "users manage their own tickets" on public.support_tickets for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "admins manage all tickets" on public.support_tickets;
create policy "admins manage all tickets" on public.support_tickets for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  from_admin boolean not null default false,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;

drop policy if exists "ticket owner reads own thread" on public.support_messages;
create policy "ticket owner reads own thread" on public.support_messages for select
  to authenticated
  using (exists (select 1 from public.support_tickets t where t.id = support_messages.ticket_id and t.user_id = auth.uid()));

drop policy if exists "ticket owner posts in own thread" on public.support_messages;
create policy "ticket owner posts in own thread" on public.support_messages for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and from_admin = false
    and exists (select 1 from public.support_tickets t where t.id = support_messages.ticket_id and t.user_id = auth.uid())
  );

drop policy if exists "admins manage all messages" on public.support_messages;
create policy "admins manage all messages" on public.support_messages for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create index if not exists support_tickets_user_id_idx on public.support_tickets (user_id);
create index if not exists support_tickets_status_idx on public.support_tickets (status);
create index if not exists support_messages_ticket_id_idx on public.support_messages (ticket_id);

-- Keeps ticket.updated_at honest so "آخر نشاط" sorting in the admin inbox
-- reflects real activity instead of only the ticket's creation time.
create or replace function public.touch_support_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.support_tickets set updated_at = now() where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists support_messages_touch_ticket on public.support_messages;
create trigger support_messages_touch_ticket
  after insert on public.support_messages
  for each row execute function public.touch_support_ticket();
