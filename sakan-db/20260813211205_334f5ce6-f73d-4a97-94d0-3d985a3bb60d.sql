-- 1. Conversations: prevent participant hijack
CREATE OR REPLACE FUNCTION public.guard_conversation_participants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.user_low  := OLD.user_low;
    NEW.user_high := OLD.user_high;
    NEW.id         := OLD.id;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS conversations_guard_participants ON public.conversations;
CREATE TRIGGER conversations_guard_participants
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.guard_conversation_participants();

-- 2. Messages: only the sender may change content
CREATE OR REPLACE FUNCTION public.guard_message_content_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() = OLD.sender_id THEN
    RETURN NEW;
  END IF;

  -- Non-sender participants may only update delivery/read state, their own
  -- hide list, pin state and cached translations.
  NEW.id              := OLD.id;
  NEW.conversation_id := OLD.conversation_id;
  NEW.sender_id       := OLD.sender_id;
  NEW.body            := OLD.body;
  NEW.kind            := OLD.kind;
  NEW.attachment_path := OLD.attachment_path;
  NEW.attachment_name := OLD.attachment_name;
  NEW.attachment_size := OLD.attachment_size;
  NEW.attachment_mime := OLD.attachment_mime;
  NEW.reply_to_id     := OLD.reply_to_id;
  NEW.edited_at       := OLD.edited_at;
  NEW.deleted_at      := OLD.deleted_at;
  NEW.created_at      := OLD.created_at;
  NEW.moderation      := OLD.moderation;
  NEW.source_language := OLD.source_language;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS messages_guard_content_updates ON public.messages;
CREATE TRIGGER messages_guard_content_updates
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.guard_message_content_updates();

-- 3. Profiles: restrict anonymous column access to the showcase columns
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, display_name, birth_year, gender, looking_for, country_code, city,
  is_verified, last_seen_at, avatar_url, presence_status, hide_last_seen,
  is_active, is_hidden, onboarding_complete, created_at, completeness
) ON public.profiles TO anon;