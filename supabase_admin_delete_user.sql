-- Run this in the Supabase SQL Editor to allow admins to delete users natively
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify the caller is an admin safely
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        -- auth.users has cascading deletes on profiles which deletes all relationships!
        DELETE FROM auth.users WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
    END IF;
END;
$$;
