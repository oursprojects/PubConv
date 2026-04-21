-- Run this entire script in your Supabase SQL Editor

-- 1. Create a function to bypass RLS securely for updating the System Configuration
CREATE OR REPLACE FUNCTION admin_update_app_config(config_key text, config_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        INSERT INTO public.app_config (key, value)
        VALUES (config_key, config_value)
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Only admins can update app config';
    END IF;
END;
$$;

-- 2. Create a function to bypass RLS securely for banning users
CREATE OR REPLACE FUNCTION admin_toggle_ban_user(target_user_id uuid, ban_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        UPDATE public.profiles SET is_banned = ban_status WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Only admins can ban users';
    END IF;
END;
$$;

-- 3. Create a function to bypass RLS securely for deleting feedbacks
CREATE OR REPLACE FUNCTION admin_delete_feedback(target_feedback_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        DELETE FROM public.feedbacks WHERE id = target_feedback_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Only admins can delete feedbacks';
    END IF;
END;
$$;

-- 4. Create a function to bypass RLS securely for deleting messages
CREATE OR REPLACE FUNCTION admin_delete_message(target_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        DELETE FROM public.messages WHERE id = target_message_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Only admins can delete messages';
    END IF;
END;
$$;

-- 5. Create a function to clear all messages (excluding general channel id 000... if needed)
CREATE OR REPLACE FUNCTION admin_clear_all_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        DELETE FROM public.messages WHERE id != '00000000-0000-0000-0000-000000000000';
    ELSE
        RAISE EXCEPTION 'Unauthorized: Only admins can clear messages';
    END IF;
END;
$$;
