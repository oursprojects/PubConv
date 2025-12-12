-- ================================================================================
-- PUBCONV DATABASE SCHEMA
-- ================================================================================
-- This file contains the complete database schema including tables, RLS policies,
-- functions, triggers, and views.

-- ================================================================================
-- 1. CORE TABLES & POLICIES
-- ================================================================================

-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  avatar_url text,
  bio text,
  role text default 'user' check (role in ('user', 'admin')),
  is_banned boolean default false,
  updated_at timestamp with time zone,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create a table for messages
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_deleted boolean default false
);

-- Set up RLS
alter table messages enable row level security;

create policy "Messages are viewable by everyone." on messages
  for select using (is_deleted = false);

create policy "Authenticated users can insert messages." on messages
  for insert with check (auth.uid() = user_id);

-- Create a table for app configuration (maintenance mode, etc.)
create table if not exists app_config (
  key text primary key,
  value boolean default false
);

-- Insert default config
insert into app_config (key, value) values
  ('maintenance_mode', false),
  ('disable_signup', false)
on conflict (key) do nothing;

alter table app_config enable row level security;

create policy "Config is viewable by everyone." on app_config
  for select using (true);

-- Create feedbacks table
create table if not exists feedbacks (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table feedbacks enable row level security;

create policy "Feedbacks are viewable by admins only." on feedbacks
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Users can insert feedback." on feedbacks
  for insert with check (auth.uid() = user_id);

-- ================================================================================
-- 2. FUNCTIONS & TRIGGERS
-- ================================================================================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to check ban status before message insert
create or replace function check_is_banned()
returns trigger as $$
begin
  if exists (select 1 from profiles where id = auth.uid() and is_banned = true) then
    raise exception 'User is banned';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_insert on messages;
create trigger on_message_insert
  before insert on messages
  for each row execute procedure check_is_banned();

-- ================================================================================
-- 3. REALTIME PUBLICATIONS
-- ================================================================================

-- Enable Realtime for tables
-- Note: 'supabase_realtime' publication usually exists by default on Supabase
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table app_config;
-- alter publication supabase_realtime add table profiles; -- Optional

-- ================================================================================
-- 4. ADMIN STATS & VIEWS
-- ================================================================================

-- Create the materialized view
create materialized view if not exists admin_stats as
select
  (select count(*) from profiles) as total_users,
  (select count(*) from profiles where is_banned = true) as banned_users,
  (select count(*) from profiles where role = 'admin') as admin_users,
  (select count(*) from messages) as total_messages,
  (select count(*) from feedbacks) as total_feedbacks,
  now() as last_refreshed;

-- Create index for faster access
create unique index if not exists admin_stats_idx on admin_stats (last_refreshed);

-- Create a function to refresh the stats
create or replace function refresh_admin_stats()
returns void as $$
begin
  refresh materialized view concurrently admin_stats;
end;
$$ language plpgsql security definer;

-- Grant access to admins
grant select on admin_stats to authenticated;
grant execute on function refresh_admin_stats() to authenticated;

-- ================================================================================
-- 5. MAINTENANCE & CLEANUP
-- ================================================================================

-- Create the cleanup function for old messages (Free Tier friendly)
create or replace function cleanup_old_messages()
returns integer as $$
declare
  deleted_count integer;
begin
  -- Delete messages older than 30 days
  with deleted as (
    delete from messages 
    where created_at < now() - interval '30 days'
    returning *
  )
  select count(*) into deleted_count from deleted;
  
  return deleted_count;
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function cleanup_old_messages() to authenticated;

-- Example pg_cron usage (Supabase Pro)
/*
select cron.schedule(
  'refresh-admin-stats',
  '0 * * * *',  -- Every hour
  $$ select refresh_admin_stats() $$
);

select cron.schedule(
  'cleanup-old-messages',
  '0 3 * * *',  -- Daily at 3 AM
  $$ select cleanup_old_messages() $$
);
*/
