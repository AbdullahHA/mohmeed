-- Real per-user notifications, server-generated only — a user never writes
-- their own notification rows (no fabricated "you have 3 new things" from
-- the client). Every row here traces back to a real action: a friend
-- request arriving, a request being accepted, or someone joining/being
-- added to a trip. Triggers create the rows; the client only reads its own
-- and marks them read.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('friend_request', 'friend_request_accepted', 'trip_joined', 'trip_added')),
  title text not null,
  body text,
  data jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "users read their own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.notifications;

-- friend_requests: notify the recipient a request arrived.
create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_name text;
begin
  select name into sender_name from public.profiles where id = new.sender_id;
  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.recipient_id,
    'friend_request',
    'طلب صداقة جديد',
    coalesce(sender_name, 'مستخدم') || ' أرسل لك طلب صداقة',
    jsonb_build_object('senderId', new.sender_id)
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_friend_request on public.friend_requests;
create trigger trg_notify_friend_request
  after insert on public.friend_requests
  for each row execute function public.notify_friend_request();

-- friendships: a row is only ever inserted once, by the person accepting
-- (user_id = original requester, friend_id = acceptor) — notify the
-- original requester that their request was accepted.
create or replace function public.notify_friend_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acceptor_name text;
begin
  select name into acceptor_name from public.profiles where id = new.friend_id;
  insert into public.notifications (user_id, type, title, body, data)
  values (
    new.user_id,
    'friend_request_accepted',
    'قبل طلب صداقتك',
    coalesce(acceptor_name, 'مستخدم') || ' قبل طلب صداقتك',
    jsonb_build_object('friendId', new.friend_id)
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_friend_accepted on public.friendships;
create trigger trg_notify_friend_accepted
  after insert on public.friendships
  for each row execute function public.notify_friend_accepted();

-- trip_members: notify the trip owner when someone else joins, and notify
-- the new member when someone else added them (join_trip_by_code is a
-- security-definer RPC, but auth.uid() still reflects the calling user).
create or replace function public.notify_trip_member_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trip_owner uuid;
  trip_title text;
  actor_name text;
begin
  select owner_id, title into trip_owner, trip_title from public.trips where id = new.trip_id;
  if trip_owner is null then
    return new;
  end if;
  select name into actor_name from public.profiles where id = new.profile_id;

  if auth.uid() is distinct from trip_owner then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      trip_owner,
      'trip_joined',
      'عضو جديد بالرحلة',
      coalesce(actor_name, 'مستخدم') || ' انضم لرحلة "' || coalesce(trip_title, '') || '"',
      jsonb_build_object('tripId', new.trip_id, 'profileId', new.profile_id)
    );
  end if;

  if auth.uid() is distinct from new.profile_id then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.profile_id,
      'trip_added',
      'تمت إضافتك لرحلة',
      'تمت إضافتك لرحلة "' || coalesce(trip_title, '') || '"',
      jsonb_build_object('tripId', new.trip_id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_trip_member_added on public.trip_members;
create trigger trg_notify_trip_member_added
  after insert on public.trip_members
  for each row execute function public.notify_trip_member_added();
