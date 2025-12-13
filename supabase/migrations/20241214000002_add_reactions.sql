-- Add reactions column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- Create function to toggle reaction
CREATE OR REPLACE FUNCTION toggle_message_reaction(
  p_message_id UUID,
  p_emoji TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id TEXT;
  v_current_reactions JSONB;
  v_emoji_users JSONB;
  v_new_emoji_users JSONB;
  v_final_reactions JSONB;
BEGIN
  -- Get current user ID (must be authenticated)
  v_user_id := auth.uid()::text;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current reactions for the message
  SELECT reactions INTO v_current_reactions
  FROM messages
  WHERE id = p_message_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  -- Default to empty object if null
  IF v_current_reactions IS NULL THEN
    v_current_reactions := '{}'::jsonb;
  END IF;

  -- Get users list for this emoji (default to empty array)
  v_emoji_users := v_current_reactions -> p_emoji;
  IF v_emoji_users IS NULL THEN
    v_emoji_users := '[]'::jsonb;
  END IF;

  -- Check if user is already in the list
  IF v_emoji_users @> to_jsonb(v_user_id) THEN
    -- Remove user
    SELECT jsonb_agg(elem) INTO v_new_emoji_users
    FROM jsonb_array_elements(v_emoji_users) elem
    WHERE elem::text <> ('"' || v_user_id || '"');
    
    IF v_new_emoji_users IS NULL THEN
      v_new_emoji_users := '[]'::jsonb;
    END IF;
  ELSE
    -- Add user
    v_new_emoji_users := v_emoji_users || to_jsonb(v_user_id);
  END IF;

  -- Calculate final object
  v_final_reactions := jsonb_set(v_current_reactions, ARRAY[p_emoji], v_new_emoji_users);

  -- Update the row
  UPDATE messages
  SET reactions = v_final_reactions
  WHERE id = p_message_id;

  RETURN v_final_reactions;

END;
$$;
