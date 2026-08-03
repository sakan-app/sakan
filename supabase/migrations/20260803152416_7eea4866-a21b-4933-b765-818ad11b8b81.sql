CREATE OR REPLACE FUNCTION public.notify_on_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  low_name text;
  high_name text;
BEGIN
  SELECT display_name INTO low_name FROM public.profiles WHERE id = NEW.user_low;
  SELECT display_name INTO high_name FROM public.profiles WHERE id = NEW.user_high;

  INSERT INTO public.notifications (user_id, actor_id, type, title, body, data)
  VALUES
    (NEW.user_low, NEW.user_high, 'match', COALESCE(high_name, 'match'), NULL, jsonb_build_object('match_id', NEW.id)),
    (NEW.user_high, NEW.user_low, 'match', COALESCE(low_name, 'match'), NULL, jsonb_build_object('match_id', NEW.id));
  RETURN NEW;
END $function$;