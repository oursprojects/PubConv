-- Add last_avatar_update column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_avatar_update timestamptz;

-- Create avatar bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies
-- We drop existing policies first to ensure the new ones are applied cleanly
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatar files
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );
  
-- Allow users to update/delete their own avatar
-- We check that the filename starts with the user's ID to ensure ownership
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'avatars' AND name LIKE (auth.uid() || '%') );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'avatars' AND name LIKE (auth.uid() || '%') );
