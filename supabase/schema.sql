-- ================================================================================
-- PUBCONV DATABASE SCHEMA
-- ================================================================================
-- Run this entire file in the Supabase SQL Editor on a fresh project.
-- All tables, RLS policies, storage, functions, triggers, and views are included.
-- Last updated: 2026-02-19
-- ================================================================================


-- ================================================================================
-- 1. CORE TABLES
-- ================================================================================

-- profiles: One row per auth user
CREATE TABLE IF NOT EXISTS profiles (
  id              uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username        text        UNIQUE,
  avatar_url      text,
  bio             text,
  role            text        DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_banned       boolean     DEFAULT false,
  theme           text        DEFAULT 'zinc',
  last_avatar_update timestamptz,
  updated_at      timestamptz,

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- messages: Chat messages with reply threading and emoji reactions
CREATE TABLE IF NOT EXISTS messages (
  id           uuid     DEFAULT gen_random_uuid() PRIMARY KEY,
  content      text     NOT NULL,
  user_id      uuid     REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reply_to_id  uuid     REFERENCES messages(id) ON DELETE SET NULL,
  reactions    jsonb    DEFAULT '{}'::jsonb,
  is_deleted   boolean  DEFAULT false,
  created_at   timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- feedbacks: User-submitted feedback (admin-only visibility)
CREATE TABLE IF NOT EXISTS feedbacks (
  id         uuid     DEFAULT gen_random_uuid() PRIMARY KEY,
  content    text     NOT NULL,
  user_id    uuid     REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- app_config: Global settings (maintenance mode, sign-up toggle, etc.)
CREATE TABLE IF NOT EXISTS app_config (
  key   text    PRIMARY KEY,
  value boolean DEFAULT false
);

-- Seed default config values
INSERT INTO app_config (key, value) VALUES
  ('maintenance_mode', false),
  ('disable_signup',   false)
ON CONFLICT (key) DO NOTHING;


-- ================================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ================================================================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by everyone." ON messages
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Authenticated users can insert messages." ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- feedbacks
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feedbacks are viewable by admins only." ON feedbacks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert feedback." ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config is viewable by everyone." ON app_config
  FOR SELECT USING (true);


-- ================================================================================
-- 3. STORAGE (Avatar bucket)
-- ================================================================================

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar"    ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar"    ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar"    ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND name LIKE (auth.uid() || '%'));

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND name LIKE (auth.uid() || '%'));


-- ================================================================================
-- 4. FUNCTIONS & TRIGGERS
-- ================================================================================

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    NULL  -- Uses InitialsAvatar on the frontend
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Block banned users from sending messages
CREATE OR REPLACE FUNCTION public.check_is_banned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = true
  ) THEN
    RAISE EXCEPTION 'User is banned';
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE PROCEDURE public.check_is_banned();

-- Toggle emoji reaction on a message (one reaction per user per message)
CREATE OR REPLACE FUNCTION public.toggle_message_reaction(
  p_message_id UUID,
  p_emoji      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id          TEXT;
  v_current_reactions JSONB;
  v_emoji_users       JSONB;
  v_new_emoji_users   JSONB;
  v_final_reactions   JSONB;
  v_key               TEXT;
  v_already_reacted   BOOLEAN;
BEGIN
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT reactions INTO v_current_reactions
  FROM messages WHERE id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  IF v_current_reactions IS NULL THEN
    v_current_reactions := '{}'::jsonb;
  END IF;

  -- Check if user already has this emoji
  v_emoji_users := COALESCE(v_current_reactions -> p_emoji, '[]'::jsonb);
  v_already_reacted := v_emoji_users @> to_jsonb(v_user_id);

  -- Remove user from ALL emojis (one-reaction-per-user rule)
  v_final_reactions := '{}'::jsonb;
  FOR v_key IN SELECT jsonb_object_keys(v_current_reactions)
  LOOP
    SELECT jsonb_agg(elem) INTO v_new_emoji_users
    FROM jsonb_array_elements(v_current_reactions -> v_key) elem
    WHERE elem::text <> ('"' || v_user_id || '"');

    IF v_new_emoji_users IS NOT NULL AND jsonb_array_length(v_new_emoji_users) > 0 THEN
      v_final_reactions := jsonb_set(v_final_reactions, ARRAY[v_key], v_new_emoji_users);
    END IF;
  END LOOP;

  -- If user did NOT already have this emoji, add them now
  IF NOT v_already_reacted THEN
    v_emoji_users     := COALESCE(v_final_reactions -> p_emoji, '[]'::jsonb);
    v_new_emoji_users := v_emoji_users || to_jsonb(v_user_id);
    v_final_reactions := jsonb_set(v_final_reactions, ARRAY[p_emoji], v_new_emoji_users);
  END IF;

  UPDATE messages SET reactions = v_final_reactions WHERE id = p_message_id;
  RETURN v_final_reactions;
END;
$$;

-- Refresh the admin_stats materialized view
CREATE OR REPLACE FUNCTION public.refresh_admin_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_stats;
END;
$$;

-- Delete messages older than 30 days and return count
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM messages
    WHERE created_at < now() - INTERVAL '30 days'
    RETURNING *
  )
  SELECT count(*) INTO deleted_count FROM deleted;
  RETURN deleted_count;
END;
$$;


-- ================================================================================
-- 5. ADMIN STATS VIEW
-- ================================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS admin_stats AS
SELECT
  (SELECT count(*) FROM profiles)                         AS total_users,
  (SELECT count(*) FROM profiles WHERE is_banned = true)  AS banned_users,
  (SELECT count(*) FROM profiles WHERE role = 'admin')    AS admin_users,
  (SELECT count(*) FROM messages)                         AS total_messages,
  (SELECT count(*) FROM feedbacks)                        AS total_feedbacks,
  now()                                                   AS last_refreshed;

-- Required unique index for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS admin_stats_idx ON admin_stats (last_refreshed);

-- Access control: only authenticated users (admins should be enforced in app layer)
REVOKE SELECT ON TABLE public.admin_stats FROM anon;
GRANT  SELECT ON TABLE public.admin_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_admin_stats()   TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_messages()  TO authenticated;


-- ================================================================================
-- 6. REALTIME PUBLICATIONS
-- ================================================================================

-- Enable Realtime for live chat and config changes
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE app_config;
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles; -- Optional


-- ================================================================================
-- 7. SCHEDULED JOBS (Supabase Pro / pg_cron only)
-- ================================================================================
-- Uncomment these if you upgrade to a paid plan that includes pg_cron.

/*
SELECT cron.schedule(
  'refresh-admin-stats',
  '0 * * * *',           -- Every hour
  $$ SELECT public.refresh_admin_stats(); $$
);

SELECT cron.schedule(
  'cleanup-old-messages',
  '0 3 * * *',           -- Daily at 3 AM UTC
  $$ SELECT public.cleanup_old_messages(); $$
);
*/
