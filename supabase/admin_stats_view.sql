-- ================================================================================
-- ADMIN STATS MATERIALIZED VIEW
-- ================================================================================
-- Use this to cache expensive COUNT(*) queries for the admin dashboard.
-- Refresh the view periodically instead of running counts on every page load.

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
-- USAGE INSTRUCTIONS
-- ================================================================================
-- 
-- 1. Query the cached stats (fast):
--    select * from admin_stats;
--
-- 2. Refresh the stats (call periodically or on admin page load):
--    select refresh_admin_stats();
--
-- 3. For automatic refresh with pg_cron (Supabase Pro):
--    select cron.schedule(
--      'refresh-admin-stats',
--      '0 * * * *',  -- Every hour
--      $$ select refresh_admin_stats() $$
--    );
