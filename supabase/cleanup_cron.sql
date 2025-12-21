-- ================================================================================
-- AUTOMATED MESSAGE CLEANUP FOR FREE TIER
-- ================================================================================
-- pg_cron requires Supabase Pro plan. For free tier, use this manual function
-- that can be called via a Supabase Edge Function or external cron service.

-- Create the cleanup function
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

-- Grant execute permission (adjust role as needed)
grant execute on function cleanup_old_messages() to authenticated;

-- ================================================================================
-- ALTERNATIVE: If you have pg_cron (Supabase Pro), use this:
-- ================================================================================
-- select cron.schedule(
--   'cleanup-old-messages',  -- job name
--   '0 3 * * *',             -- daily at 3 AM UTC
--   $$ select cleanup_old_messages() $$
-- );

-- To run manually, execute:
-- select cleanup_old_messages();

-- ================================================================================
-- ENABLE REALTIME FOR app_config TABLE
-- This allows maintenance mode changes to propagate in real-time
-- ================================================================================
alter publication supabase_realtime add table app_config;

-- ================================================================================
-- ENABLE REALTIME FOR profiles TABLE (for ban detection)
-- ================================================================================
-- Note: Only add if not already in publication
-- alter publication supabase_realtime add table profiles;
