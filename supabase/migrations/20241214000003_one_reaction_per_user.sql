-- Update toggle_message_reaction to allow only ONE reaction per user per message
-- When a user selects a new emoji, remove their reaction from all other emojis first

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
  v_key TEXT;
  v_already_reacted BOOLEAN;
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

  -- Check if user already has the selected emoji
  v_emoji_users := v_current_reactions -> p_emoji;
  IF v_emoji_users IS NULL THEN
    v_emoji_users := '[]'::jsonb;
  END IF;
  v_already_reacted := v_emoji_users @> to_jsonb(v_user_id);

  -- Remove user from ALL emojis first (one reaction per user rule)
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

  -- If user was NOT already on the selected emoji, add them
  IF NOT v_already_reacted THEN
    v_emoji_users := COALESCE(v_final_reactions -> p_emoji, '[]'::jsonb);
    v_new_emoji_users := v_emoji_users || to_jsonb(v_user_id);
    v_final_reactions := jsonb_set(v_final_reactions, ARRAY[p_emoji], v_new_emoji_users);
  END IF;

  -- Update the row
  UPDATE messages
  SET reactions = v_final_reactions
  WHERE id = p_message_id;

  RETURN v_final_reactions;

END;
$$;
