-- يلا نسافر — قاعدة البيانات الكاملة
-- المعرّفات نصية (يولّدها التطبيق عشان يشتغل بدون نت)، و updated_at بالملي ثانية للمزامنة (last-write-wins).
-- كل الجداول عليها RLS. المحتوى العام (المدن، الأماكن، القصص، الدول، المفاتيح) يكتب فيه المشرف بس.

create or replace function now_ms() returns bigint language sql stable as $$ select (extract(epoch from now()) * 1000)::bigint $$;
create or replace function uid() returns text language sql stable as $$ select auth.uid()::text $$;

-- ===================== الملفات =====================
create table profiles (
  id text primary key,
  name text not null default 'مسافر',
  handle text unique,
  color text default '#3b6cf0',
  bio text default '',
  city text default '',
  languages text[] default '{}',
  travel_since int,
  verified boolean default false,
  local_expert_city text,
  avatar_url text,
  cover_scene text default 'desert',
  interests text[] default '{}',
  cuisines text[] default '{}',
  dietary text[] default '{}',
  traveler_type text,
  budget text,
  pace text,
  privacy_trips text default 'private' check (privacy_trips in ('private','followers','public')),
  show_here boolean default false,
  is_admin boolean default false,
  deleted boolean default false,
  updated_at bigint default now_ms()
);
create or replace function is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = uid()), false) $$;

create table follows (
  id text primary key, follower_id text not null references profiles(id), following_id text not null references profiles(id),
  deleted boolean default false, updated_at bigint default now_ms(), unique (follower_id, following_id)
);

-- ===================== المحتوى العام =====================
create table cities (
  id text primary key, name text not null, country text, country_code text, region text, scene text, lat double precision, lng double precision,
  blurb text, best_months int[], budget_per_day int, flight_from_ruh int, temp_now int, temp_night int,
  our_rating numeric, our_count int, google_rating numeric, google_count int, "group" text,
  deleted boolean default false, updated_at bigint default now_ms()
);
create table places (
  id text primary key, name text not null, category text not null, city_id text references cities(id), kind text, cuisine text,
  price_level int, avg_min int, avg_max int, rating numeric, rating_count int, lat double precision, lng double precision, address text,
  phone text, website text, menu_url text, open text, close text, amenities text[] default '{}', tags text[] default '{}',
  scene text, photo text, description text, featured boolean default false, sponsored boolean default false, trending boolean default false,
  best_time text, duration_min int default 60, event_dates text, ticket_from int, affiliate_url text, google_place_id text unique,
  deleted boolean default false, updated_at bigint default now_ms()
);
create table seasonal_stories (
  id text primary key, title text, scene text, city_id text, slides jsonb default '[]', starts_at date, ends_at date,
  deleted boolean default false, updated_at bigint default now_ms()
);
create table country_info (
  id text primary key, code text unique, name text, visa_sa text, visa_gcc text, passport_months int, currency text, plugs text, sim text,
  emergency text, embassy text, source_url text, deleted boolean default false, updated_at bigint default now_ms()
);
create table app_flags (
  id text primary key, key text unique, enabled boolean default false, deleted boolean default false, updated_at bigint default now_ms()
);
insert into app_flags (id, key) values ('sponsored_places','sponsored_places'),('affiliate_booking','affiliate_booking'),('premium','premium');

-- ===================== الرحلات =====================
create table trips (
  id text primary key, title text not null, city_id text references cities(id), start_date date, end_date date, flex_month int, flex_days int,
  dates_mode text default 'fixed', traveler_type text, needs text[] default '{}', owner_id text not null references profiles(id),
  visibility text default 'private', scene text, planned_budget int default 0, invite_code text unique, published boolean default false,
  offline_saved_at bigint, created_at bigint default now_ms(), deleted boolean default false, updated_at bigint default now_ms()
);
create table trip_members (
  id text primary key, trip_id text not null references trips(id), user_id text not null references profiles(id),
  role text default 'member' check (role in ('organizer','member','viewer')), deleted boolean default false, updated_at bigint default now_ms(),
  unique (trip_id, user_id)
);
create or replace function trip_role(t text) returns text language sql stable security definer set search_path = public as $$
  select role from trip_members where trip_id = t and user_id = uid() and not deleted limit 1 $$;
create or replace function is_member(t text) returns boolean language sql stable as $$ select trip_role(t) is not null $$;
create or replace function can_edit(t text) returns boolean language sql stable as $$ select trip_role(t) in ('organizer','member') $$;

create table trip_items (
  id text primary key, trip_id text not null references trips(id), place_id text, title text, day date, slot text, time text,
  duration_min int, added_by text, via text, note text, "order" int default 0, deleted boolean default false, updated_at bigint default now_ms()
);
create table trip_expenses (
  id text primary key, trip_id text not null references trips(id), paid_by text, amount numeric, currency text default 'SAR',
  amount_sar numeric, fx_rate numeric default 1, category text, split_between text[] default '{}', note text, from_chat boolean,
  created_at bigint default now_ms(), deleted boolean default false, updated_at bigint default now_ms()
);
create table trip_checklist (
  id text primary key, trip_id text not null references trips(id), "group" text, title text, assignee_id text, done boolean default false,
  due date, deleted boolean default false, updated_at bigint default now_ms()
);
create table trip_documents (
  id text primary key, trip_id text not null references trips(id), owner_id text not null, kind text, visibility text default 'shared',
  title text, data jsonb default '{}', file_uri text, starts_at text, deleted boolean default false, updated_at bigint default now_ms()
);
create table trip_date_votes (
  id text primary key, trip_id text not null references trips(id), user_id text not null, date date not null,
  deleted boolean default false, updated_at bigint default now_ms()
);

-- ===================== المحادثات =====================
create table chats (
  id text primary key, type text not null, trip_id text, community_id text, member_ids text[] default '{}', title text,
  pinned text[] default '{}', muted text[] default '{}', deleted boolean default false, updated_at bigint default now_ms()
);
create or replace function in_chat(c text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from chats where id = c and uid() = any(member_ids)) $$;
create table messages (
  id text primary key, chat_id text not null references chats(id), sender_id text not null, kind text default 'text', body text,
  place_id text, poll_id text, expense_id text, plan jsonb, created_at bigint default now_ms(), deleted boolean default false, updated_at bigint default now_ms()
);
create index on messages (chat_id, created_at);
create table polls (
  id text primary key, chat_id text not null references chats(id), question text, options jsonb default '[]', votes jsonb default '{}',
  closed boolean default false, target jsonb, created_by text, deleted boolean default false, updated_at bigint default now_ms()
);
create table chat_reads (
  id text primary key, chat_id text not null, user_id text not null, last_read_at bigint, deleted boolean default false, updated_at bigint default now_ms()
);

-- ===================== المجتمع =====================
create table posts (
  id text primary key, user_id text not null references profiles(id), photos text[] default '{}', photo_uris text[] default '{}',
  body text check (char_length(body) <= 500), place_id text, trip_id text, type text default 'post', likes text[] default '{}', comments int default 0,
  created_at bigint default now_ms(), deleted boolean default false, updated_at bigint default now_ms()
);
create table place_reviews (
  id text primary key, user_id text not null, place_id text not null, rating int check (rating between 1 and 5), tags text[] default '{}', text text,
  created_at bigint default now_ms(), deleted boolean default false, updated_at bigint default now_ms()
);
create table communities (
  id text primary key, name text not null, icon text, color text, description text,
  status text default 'pending' check (status in ('pending','approved','rejected')), requested_by text, member_ids text[] default '{}',
  moderator_ids text[] default '{}', reject_reason text, deleted boolean default false, updated_at bigint default now_ms()
);
create table reports (
  id text primary key, reporter_id text not null, community_id text, message_id text, user_id text, reason text, status text default 'open',
  created_at bigint default now_ms(), deleted boolean default false, updated_at bigint default now_ms()
);
create table notifications (
  id text primary key, user_id text not null, kind text, actor_id text, text text, created_at bigint default now_ms(), read boolean default false,
  ref_id text, deleted boolean default false, updated_at bigint default now_ms()
);
create table checkins (
  id text primary key, user_id text not null, place_id text, city_id text, created_at bigint default now_ms(), deleted boolean default false, updated_at bigint default now_ms()
);
create table stamps (
  id text primary key, user_id text not null, city_id text, date date, manual boolean default false, deleted boolean default false, updated_at bigint default now_ms()
);
create table saved_places (id text primary key, user_id text not null, place_id text not null, deleted boolean default false, updated_at bigint default now_ms());
create table wishes (id text primary key, user_id text not null, city_id text not null, deleted boolean default false, updated_at bigint default now_ms());
create table location_shares (
  id text primary key, user_id text not null, with_user_id text not null, expires_at bigint, active boolean default true,
  deleted boolean default false, updated_at bigint default now_ms()
);

-- ===================== الصلاحيات (RLS) =====================
do $$ declare t text; begin
  foreach t in array array['profiles','follows','cities','places','seasonal_stories','country_info','app_flags','trips','trip_members','trip_items',
    'trip_expenses','trip_checklist','trip_documents','trip_date_votes','chats','messages','polls','chat_reads','posts','place_reviews','communities',
    'reports','notifications','checkins','stamps','saved_places','wishes','location_shares'] loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- الملفات: الكل يقرأ، كل واحد يعدّل ملفه، والمشرف يقدر يوثّق ويعطي صلاحيات
create policy profiles_read on profiles for select using (true);
create policy profiles_write on profiles for insert with check (id = uid() and is_admin = false);
create policy profiles_update on profiles for update using (id = uid() or is_admin()) with check (is_admin() or (id = uid() and is_admin = (select p.is_admin from profiles p where p.id = uid())));

create policy follows_read on follows for select using (true);
create policy follows_write on follows for all using (follower_id = uid()) with check (follower_id = uid());

-- المحتوى العام
do $$ declare t text; begin
  foreach t in array array['cities','places','seasonal_stories','country_info','app_flags'] loop
    execute format('create policy %I on %I for select using (true)', t || '_read', t);
    execute format('create policy %I on %I for all using (is_admin()) with check (is_admin())', t || '_admin', t);
  end loop;
end $$;

-- الرحلات: الأعضاء، أو منشورة حسب الخصوصية
create policy trips_read on trips for select using (
  is_member(id) or owner_id = uid()
  or (published and visibility = 'public')
  or (published and visibility = 'followers' and exists (select 1 from follows f where f.follower_id = uid() and f.following_id = owner_id and not f.deleted))
);
create policy trips_insert on trips for insert with check (owner_id = uid());
create policy trips_update on trips for update using (can_edit(id));

create policy members_read on trip_members for select using (is_member(trip_id) or exists (select 1 from trips t where t.id = trip_id and t.published));
create policy members_insert on trip_members for insert with check (
  (user_id = uid() and exists (select 1 from trips t where t.id = trip_id and t.owner_id = uid())) or trip_role(trip_id) = 'organizer');
create policy members_update on trip_members for update using (trip_role(trip_id) = 'organizer' or user_id = uid());

do $$ declare t text; begin
  foreach t in array array['trip_items','trip_expenses','trip_checklist','trip_date_votes'] loop
    execute format('create policy %I on %I for select using (is_member(trip_id) or exists (select 1 from trips x where x.id = trip_id and x.published))', t || '_read', t);
    execute format('create policy %I on %I for insert with check (can_edit(trip_id))', t || '_insert', t);
    execute format('create policy %I on %I for update using (can_edit(trip_id))', t || '_update', t);
  end loop;
end $$;
-- المستندات: المشتركة للأعضاء، والخاصة لصاحبها بس
create policy docs_read on trip_documents for select using ((visibility = 'shared' and is_member(trip_id)) or owner_id = uid());
create policy docs_write on trip_documents for insert with check (owner_id = uid() and is_member(trip_id));
create policy docs_update on trip_documents for update using (owner_id = uid());

-- المحادثات
create policy chats_read on chats for select using (uid() = any(member_ids));
create policy chats_insert on chats for insert with check (uid() = any(member_ids));
create policy chats_update on chats for update using (uid() = any(member_ids));
create policy messages_read on messages for select using (in_chat(chat_id));
create policy messages_insert on messages for insert with check (in_chat(chat_id) and (sender_id = uid() or sender_id = 'system'));
create policy messages_update on messages for update using (sender_id = uid());
create policy polls_rw on polls for all using (in_chat(chat_id)) with check (in_chat(chat_id));
create policy reads_rw on chat_reads for all using (user_id = uid()) with check (user_id = uid());

-- المجتمع
create policy posts_read on posts for select using (true);
create policy posts_write on posts for insert with check (user_id = uid());
create policy posts_update on posts for update using (user_id = uid());
create policy reviews_read on place_reviews for select using (true);
create policy reviews_write on place_reviews for insert with check (user_id = uid());
create policy reviews_update on place_reviews for update using (user_id = uid());
create policy communities_read on communities for select using (status = 'approved' or requested_by = uid() or is_admin());
create policy communities_request on communities for insert with check (requested_by = uid() and status = 'pending');
create policy communities_update on communities for update using (is_admin() or uid() = any(moderator_ids));
create policy reports_insert on reports for insert with check (reporter_id = uid());
create policy reports_admin on reports for select using (is_admin());
create policy reports_resolve on reports for update using (is_admin());
create policy notifs_own on notifications for all using (user_id = uid()) with check (true);

-- الخصوصية: الوصولات لصاحبها بس (الغرباء يشوفون عدد عبر city_presence)
create policy checkins_own on checkins for all using (user_id = uid()) with check (user_id = uid());
create policy stamps_read on stamps for select using (true);
create policy stamps_write on stamps for all using (user_id = uid()) with check (user_id = uid());
create policy saved_own on saved_places for all using (user_id = uid()) with check (user_id = uid());
create policy wishes_own on wishes for all using (user_id = uid()) with check (user_id = uid());
create policy shares_rw on location_shares for all using (user_id = uid() or with_user_id = uid()) with check (user_id = uid());

-- ===================== دوال (RPC) =====================
-- الانضمام برمز الدعوة
create or replace function join_trip(code text) returns text language plpgsql security definer set search_path = public as $$
declare t trips; begin
  select * into t from trips where upper(invite_code) = upper(code) and not deleted;
  if t.id is null then raise exception 'invalid_invite'; end if;
  insert into trip_members (id, trip_id, user_id, role) values ('m_' || gen_random_uuid(), t.id, uid(), 'member')
    on conflict (trip_id, user_id) do update set deleted = false, updated_at = now_ms();
  update chats set member_ids = array(select distinct unnest(member_ids || uid())), updated_at = now_ms() where trip_id = t.id;
  return t.id;
end $$;

-- الإعجاب بمنشور
create or replace function toggle_like(post text) returns void language sql security definer set search_path = public as $$
  update posts set likes = case when uid() = any(likes) then array_remove(likes, uid()) else likes || uid() end, updated_at = now_ms() where id = post $$;

-- الانضمام لمجتمع
create or replace function join_community(cid text) returns text language plpgsql security definer set search_path = public as $$
declare chat_id text; begin
  update communities set member_ids = array(select distinct unnest(member_ids || uid())), updated_at = now_ms() where id = cid and status = 'approved';
  select id into chat_id from chats where community_id = cid;
  if chat_id is null then
    chat_id := 'ch_' || cid;
    insert into chats (id, type, community_id, member_ids) select chat_id, 'community', cid, member_ids from communities where id = cid;
  else
    update chats set member_ids = array(select distinct unnest(member_ids || uid())), updated_at = now_ms() where id = chat_id;
  end if;
  return chat_id;
end $$;

-- مسافرين هنا الحين: العدد للكل، والأسماء للي تتابعهم بس ومفعّلين الظهور
create or replace function city_presence(cid text) returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'count', (select count(distinct user_id) from checkins where city_id = cid and created_at > now_ms() - 30::bigint * 86400000),
    'friends', coalesce((select json_agg(distinct c.user_id) from checkins c join profiles p on p.id = c.user_id
      join follows f on f.follower_id = uid() and f.following_id = c.user_id and not f.deleted
      where c.city_id = cid and p.show_here and c.created_at > now_ms() - 30::bigint * 86400000), '[]'::json)) $$;

-- قبول أو رفض مجتمع (المشرف)
create or replace function review_community(cid text, approve boolean, reason text default null) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  update communities set status = case when approve then 'approved' else 'rejected' end, reject_reason = reason, updated_at = now_ms() where id = cid;
  insert into notifications (id, user_id, kind, text, ref_id)
    select 'n_' || gen_random_uuid(), requested_by, 'community', case when approve then 'انقبل طلب مجتمعك «' || name || '»' else 'انرفض طلب مجتمعك «' || name || '»' end, id
    from communities where id = cid;
end $$;

-- إحصائيات لوحة التحكم
create or replace function admin_stats() returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  return json_build_object(
    'users', (select count(*) from profiles), 'trips', (select count(*) from trips where not deleted),
    'posts', (select count(*) from posts where not deleted), 'messages', (select count(*) from messages),
    'pending_communities', (select count(*) from communities where status = 'pending'),
    'open_reports', (select count(*) from reports where status = 'open'),
    'active_week', (select count(distinct sender_id) from messages where created_at > now_ms() - 7::bigint * 86400000));
end $$;

-- ===================== التخزين =====================
insert into storage.buckets (id, name, public) values ('avatars','avatars', true), ('posts','posts', true), ('documents','documents', false)
  on conflict do nothing;
create policy "avatars public read" on storage.objects for select using (bucket_id in ('avatars','posts'));
create policy "own uploads" on storage.objects for insert with check (bucket_id in ('avatars','posts','documents') and (storage.foldername(name))[1] = uid());
create policy "own documents" on storage.objects for select using (bucket_id = 'documents' and (storage.foldername(name))[1] = uid());

-- الرسائل لحظياً
alter publication supabase_realtime add table messages;
