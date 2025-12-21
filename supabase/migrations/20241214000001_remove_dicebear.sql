-- Update the handle_new_user trigger function to stop using DiceBear
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    NULL -- Explicitly set avatar_url to NULL to force InitialsAvatar
  );
  RETURN new;
END;
$function$;

-- Update existing profiles that might have DiceBear URLs to NULL
UPDATE public.profiles
SET avatar_url = NULL
WHERE avatar_url LIKE '%dicebear%';
