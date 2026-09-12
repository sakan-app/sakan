
-- 1. Message enrichments -------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.message_kind AS ENUM ('text','image','file');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.moderation_verdict AS ENUM ('pending','approved','flagged','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS kind public.message_kind NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_size integer,
  ADD COLUMN IF NOT EXISTS attachment_mime text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_language public.language_code,
  ADD COLUMN IF NOT EXISTS moderation public.moderation_verdict NOT NULL DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON public.messages (conversation_id, created_at DESC);

-- 2. Moderation flags -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_type text NOT NULL,
  subject_id uuid,
  verdict public.moderation_verdict NOT NULL DEFAULT 'pending',
  categories text[] NOT NULL DEFAULT '{}',
  score numeric,
  excerpt text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.moderation_flags TO authenticated;
GRANT ALL ON public.moderation_flags TO service_role;
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own or staff read flags" ON public.moderation_flags;
CREATE POLICY "own or staff read flags" ON public.moderation_flags
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "insert own flags" ON public.moderation_flags;
CREATE POLICY "insert own flags" ON public.moderation_flags
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 3. AI compatibility cache ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.compatibility_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score smallint NOT NULL CHECK (score BETWEEN 0 AND 100),
  summary text,
  strengths text[] NOT NULL DEFAULT '{}',
  considerations text[] NOT NULL DEFAULT '{}',
  language public.language_code NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, candidate_id, language)
);
GRANT SELECT ON public.compatibility_scores TO authenticated;
GRANT ALL ON public.compatibility_scores TO service_role;
ALTER TABLE public.compatibility_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own compatibility" ON public.compatibility_scores;
CREATE POLICY "read own compatibility" ON public.compatibility_scores
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 4. Saved searches -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manage own saved searches" ON public.saved_searches;
CREATE POLICY "manage own saved searches" ON public.saved_searches
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. Conversation bootstrap helper ---------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  lo uuid;
  hi uuid;
  cid uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF other_user IS NULL OR other_user = me THEN RAISE EXCEPTION 'invalid participant'; END IF;
  IF public.is_blocked_between(me, other_user) THEN RAISE EXCEPTION 'blocked'; END IF;

  lo := LEAST(me, other_user);
  hi := GREATEST(me, other_user);

  SELECT id INTO cid FROM public.conversations WHERE user_low = lo AND user_high = hi;
  IF cid IS NULL THEN
    INSERT INTO public.conversations (user_low, user_high) VALUES (lo, hi) RETURNING id INTO cid;
  END IF;
  RETURN cid;
END $$;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

-- 6. Presence heartbeat ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET last_seen_at = now() WHERE id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;

-- 7. Conversation bump on new message ------------------------------------
CREATE OR REPLACE FUNCTION public.bump_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
     SET last_message_at = NEW.created_at, updated_at = now()
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS bump_conversation_on_message ON public.messages;
CREATE TRIGGER bump_conversation_on_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_conversation();

-- 8. Notification fan-out -------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient uuid;
  sender_name text;
BEGIN
  SELECT CASE WHEN c.user_low = NEW.sender_id THEN c.user_high ELSE c.user_low END
    INTO recipient FROM public.conversations c WHERE c.id = NEW.conversation_id;
  IF recipient IS NULL THEN RETURN NEW; END IF;
  SELECT display_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, data)
  VALUES (recipient, NEW.sender_id, 'message', COALESCE(sender_name, 'Sakan'),
          LEFT(COALESCE(NEW.body, ''), 120),
          jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notify_on_message_trigger ON public.messages;
CREATE TRIGGER notify_on_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE liker_name text;
BEGIN
  SELECT display_name INTO liker_name FROM public.profiles WHERE id = NEW.liker_id;
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, data)
  VALUES (NEW.liked_id, NEW.liker_id, 'like', COALESCE(liker_name, 'Sakan'), NULL,
          jsonb_build_object('liker_id', NEW.liker_id));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notify_on_like_trigger ON public.likes;
CREATE TRIGGER notify_on_like_trigger
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

CREATE OR REPLACE FUNCTION public.notify_on_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, actor_id, type, title, body, data)
  VALUES
    (NEW.user_low, NEW.user_high, 'match', 'match', NULL, jsonb_build_object('match_id', NEW.id)),
    (NEW.user_high, NEW.user_low, 'match', 'match', NULL, jsonb_build_object('match_id', NEW.id));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS notify_on_match_trigger ON public.matches;
CREATE TRIGGER notify_on_match_trigger
AFTER INSERT ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.notify_on_match();

-- 9. Realtime -------------------------------------------------------------
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER TABLE public.favorites REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['messages','conversations','notifications','likes','matches','favorites','profiles'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
