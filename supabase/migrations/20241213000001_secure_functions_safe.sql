-- Secure functions by setting search_path to public
-- We use a DO block to dynamically find the function signatures to avoid errors if arguments differ
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname IN ('refresh_admin_stats', 'cleanup_old_messages', 'handle_new_user', 'check_is_banned')
        AND pronamespace = 'public'::regnamespace
    LOOP
        RAISE NOTICE 'Securing function: %', r.func_signature;
        EXECUTE 'ALTER FUNCTION ' || r.func_signature || ' SET search_path = public, pg_temp';
    END LOOP;
END $$;

-- Secure materialized view by keeping it private
-- We attempt to revoke public access to the view
DO $$
BEGIN
    -- Check if view exists to avoid error
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'admin_stats') THEN
        REVOKE SELECT ON TABLE public.admin_stats FROM anon, authenticated;
    END IF;
END $$;
