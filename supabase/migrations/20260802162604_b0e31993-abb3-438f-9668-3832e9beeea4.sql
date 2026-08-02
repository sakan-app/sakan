-- ============================================================
-- SAKAN — PHASE 1 CORE SCHEMA
-- ============================================================

-- ---------- ENUMS ----------
CREATE TYPE public.app_role            AS ENUM ('user','moderator','admin');
CREATE TYPE public.gender              AS ENUM ('male','female');
CREATE TYPE public.marital_status      AS ENUM ('single','divorced','widowed');
CREATE TYPE public.language_code       AS ENUM ('ar','en','de','ru');
CREATE TYPE public.religiosity_level   AS ENUM ('practicing','moderate','cultural','prefer_not_say');
CREATE TYPE public.photo_kind          AS ENUM ('avatar','gallery','verification');
CREATE TYPE public.verification_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.report_status       AS ENUM ('open','reviewing','resolved','dismissed');
CREATE TYPE public.notification_type   AS ENUM ('like','match','message','profile_view','verification','system');
CREATE TYPE public.subscription_status AS ENUM ('trialing','active','past_due','canceled','expired');
CREATE TYPE public.payment_status      AS ENUM ('pending','succeeded','failed','refunded');
CREATE TYPE public.consent_type        AS ENUM ('terms','privacy','marketing','cookies');
CREATE TYPE public.log_level           AS ENUM ('debug','info','warn','error');

-- ---------- SHARED TRIGGER FUNCTION ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name        text NOT NULL,
  birth_date          date,
  gender              public.gender,
  looking_for         public.gender,
  country_code        char(2),
  city                text,
  bio                 text,
  avatar_url          text,
  marital_status      public.marital_status,
  height_cm           smallint,
  education           text,
  occupation          text,
  religiosity         public.religiosity_level,
  preferred_language  public.language_code NOT NULL DEFAULT 'ar',
  is_verified         boolean NOT NULL DEFAULT false,
  is_active           boolean NOT NULL DEFAULT true,
  is_hidden           boolean NOT NULL DEFAULT false,
  onboarding_complete boolean NOT NULL DEFAULT false,
  completeness        smallint NOT NULL DEFAULT 0,
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_display_name_len CHECK (char_length(display_name) BETWEEN 2 AND 60),
  CONSTRAINT profiles_bio_len          CHECK (bio IS NULL OR char_length(bio) <= 2000),
  CONSTRAINT profiles_height_range     CHECK (height_cm IS NULL OR height_cm BETWEEN 120 AND 250),
  CONSTRAINT profiles_completeness     CHECK (completeness BETWEEN 0 AND 100),
  CONSTRAINT profiles_country_upper    CHECK (country_code IS NULL OR country_code = upper(country_code))
);

CREATE INDEX profiles_browse_idx    ON public.profiles (gender, looking_for, country_code, last_seen_at DESC)
  WHERE is_active AND NOT is_hidden;
CREATE INDEX profiles_birth_date_idx ON public.profiles (birth_date);
CREATE INDEX profiles_verified_idx   ON public.profiles (is_verified) WHERE is_verified;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- profile completeness, computed server-side so the client can never fake it
CREATE OR REPLACE FUNCTION public.compute_profile_completeness()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  score smallint := 0;
BEGIN
  IF NEW.display_name   IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.birth_date     IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.gender         IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.looking_for    IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.country_code   IS NOT NULL THEN score := score + 10; END IF;
  IF NEW.city           IS NOT NULL THEN score := score +  5; END IF;
  IF NEW.avatar_url     IS NOT NULL THEN score := score + 15; END IF;
  IF NEW.bio IS NOT NULL AND char_length(NEW.bio) >= 60 THEN score := score + 15; END IF;
  IF NEW.marital_status IS NOT NULL THEN score := score +  5; END IF;
  IF NEW.education      IS NOT NULL THEN score := score +  5; END IF;
  IF NEW.occupation     IS NOT NULL THEN score := score +  5; END IF;
  NEW.completeness := LEAST(score, 100);
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_completeness
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.compute_profile_completeness();

-- ============================================================
-- ROLES (separate table — never on profiles)
-- ============================================================
CREATE TABLE public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX user_roles_user_idx ON public.user_roles (user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','moderator')
  );
$$;

-- ============================================================
-- NEW USER BOOTSTRAP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
      split_part(COALESCE(NEW.email, 'member'), '@', 1)
    ),
    NULLIF(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'preferred_language', ''), 'ar')::public.language_code
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- BLOCKING (defined early: visibility helpers depend on it)
-- ============================================================
CREATE TABLE public.blocked_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CONSTRAINT blocked_not_self CHECK (blocker_id <> blocked_id)
);
CREATE INDEX blocked_users_blocker_idx ON public.blocked_users (blocker_id);
CREATE INDEX blocked_users_blocked_idx ON public.blocked_users (blocked_id);

CREATE OR REPLACE FUNCTION public.is_blocked_between(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = _a AND blocked_id = _b)
       OR (blocker_id = _b AND blocked_id = _a)
  );
$$;

-- ============================================================
-- PHOTOS
-- ============================================================
CREATE TABLE public.photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind         public.photo_kind NOT NULL DEFAULT 'gallery',
  storage_path text NOT NULL,
  thumb_path   text,
  width        integer,
  height       integer,
  byte_size    integer,
  mime_type    text,
  position     smallint NOT NULL DEFAULT 0,
  is_primary   boolean NOT NULL DEFAULT false,
  is_approved  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, storage_path),
  CONSTRAINT photos_mime_allowed CHECK (mime_type IS NULL OR mime_type IN ('image/jpeg','image/png','image/webp','image/avif')),
  CONSTRAINT photos_size_limit   CHECK (byte_size IS NULL OR byte_size <= 10485760)
);
CREATE INDEX photos_user_idx ON public.photos (user_id, kind, position);
CREATE UNIQUE INDEX photos_one_primary_idx ON public.photos (user_id) WHERE is_primary;

CREATE TRIGGER photos_set_updated_at
  BEFORE UPDATE ON public.photos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- LIKES / MATCHES / FAVORITES
-- ============================================================
CREATE TABLE public.likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_id),
  CONSTRAINT likes_not_self CHECK (liker_id <> liked_id)
);
CREATE INDEX likes_liked_idx ON public.likes (liked_id, created_at DESC);
CREATE INDEX likes_liker_idx ON public.likes (liker_id, created_at DESC);

CREATE TABLE public.matches (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_high  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active  boolean NOT NULL DEFAULT true,
  matched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_low, user_high),
  CONSTRAINT matches_ordered CHECK (user_low < user_high)
);
CREATE INDEX matches_low_idx  ON public.matches (user_low)  WHERE is_active;
CREATE INDEX matches_high_idx ON public.matches (user_high) WHERE is_active;

CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) THEN
    INSERT INTO public.matches (user_low, user_high)
    VALUES (LEAST(NEW.liker_id, NEW.liked_id), GREATEST(NEW.liker_id, NEW.liked_id))
    ON CONFLICT (user_low, user_high) DO UPDATE SET is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER likes_create_match
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.create_match_on_mutual_like();

CREATE TABLE public.favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, favorite_id),
  CONSTRAINT favorites_not_self CHECK (user_id <> favorite_id)
);
CREATE INDEX favorites_user_idx ON public.favorites (user_id, created_at DESC);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
CREATE TABLE public.conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_low        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_high       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_low, user_high),
  CONSTRAINT conversations_ordered CHECK (user_low < user_high)
);
CREATE INDEX conversations_low_idx  ON public.conversations (user_low,  last_message_at DESC NULLS LAST);
CREATE INDEX conversations_high_idx ON public.conversations (user_high, last_message_at DESC NULLS LAST);

CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conversation_id AND (user_low = _user_id OR user_high = _user_id)
  );
$$;

CREATE TABLE public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            text NOT NULL,
  read_at         timestamptz,
  edited_at       timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_body_len CHECK (char_length(body) BETWEEN 1 AND 4000)
);
CREATE INDEX messages_conversation_idx ON public.messages (conversation_id, created_at DESC);
CREATE INDEX messages_unread_idx       ON public.messages (conversation_id) WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
     SET last_message_at = NEW.created_at, updated_at = now()
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_on_message();

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type       public.notification_type NOT NULL,
  title      text NOT NULL,
  body       text,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx   ON public.notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications (user_id) WHERE read_at IS NULL;

-- ============================================================
-- VERIFICATION
-- ============================================================
CREATE TABLE public.verification_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status         public.verification_status NOT NULL DEFAULT 'pending',
  document_path  text,
  selfie_path    text,
  reviewer_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes text,
  reviewed_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX verification_requests_user_idx   ON public.verification_requests (user_id, created_at DESC);
CREATE INDEX verification_requests_status_idx ON public.verification_requests (status) WHERE status = 'pending';
CREATE UNIQUE INDEX verification_one_pending_idx ON public.verification_requests (user_id) WHERE status = 'pending';

CREATE TRIGGER verification_requests_set_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sync_profile_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.profiles SET is_verified = true  WHERE id = NEW.user_id;
    ELSIF NEW.status = 'rejected' THEN
      UPDATE public.profiles SET is_verified = false WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER verification_sync_profile
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification();

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE public.reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id     uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  reason         text NOT NULL,
  details        text,
  status         public.report_status NOT NULL DEFAULT 'open',
  reviewer_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes text,
  resolved_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_not_self CHECK (reporter_id <> reported_id),
  CONSTRAINT reports_reason_len CHECK (char_length(reason) BETWEEN 3 AND 200)
);
CREATE INDEX reports_status_idx   ON public.reports (status, created_at DESC);
CREATE INDEX reports_reported_idx ON public.reports (reported_id);

CREATE TRIGGER reports_set_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SUBSCRIPTIONS & PAYMENTS
-- ============================================================
CREATE TABLE public.subscriptions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code            text NOT NULL,
  status               public.subscription_status NOT NULL DEFAULT 'trialing',
  provider             text,
  provider_ref         text,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_ref)
);
CREATE INDEX subscriptions_user_idx ON public.subscriptions (user_id, status);

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount_cents    integer NOT NULL,
  currency        char(3) NOT NULL DEFAULT 'EUR',
  status          public.payment_status NOT NULL DEFAULT 'pending',
  provider        text,
  provider_ref    text,
  paid_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_ref),
  CONSTRAINT payments_amount_positive CHECK (amount_cents >= 0)
);
CREATE INDEX payments_user_idx ON public.payments (user_id, created_at DESC);

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- CONSENTS
-- ============================================================
CREATE TABLE public.consents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type public.consent_type NOT NULL,
  granted      boolean NOT NULL,
  version      text NOT NULL DEFAULT '1.0',
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type, version)
);
CREATE INDEX consents_user_idx ON public.consents (user_id);

-- ============================================================
-- AUDIT: ADMIN ACTIONS & ACTIVITY LOGS
-- ============================================================
CREATE TABLE public.admin_actions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action       text NOT NULL,
  target_table text,
  target_id    uuid,
  details      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_actions_admin_idx  ON public.admin_actions (admin_id, created_at DESC);
CREATE INDEX admin_actions_target_idx ON public.admin_actions (target_table, target_id);

CREATE TABLE public.activity_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  level      public.log_level NOT NULL DEFAULT 'info',
  event      text NOT NULL,
  context    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX activity_logs_created_idx ON public.activity_logs (created_at DESC);
CREATE INDEX activity_logs_user_idx    ON public.activity_logs (user_id, created_at DESC);

-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos                TO authenticated;
GRANT SELECT                          ON public.user_roles           TO authenticated;
GRANT SELECT, INSERT,         DELETE ON public.likes                 TO authenticated;
GRANT SELECT                          ON public.matches              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites             TO authenticated;
GRANT SELECT, INSERT,         DELETE ON public.blocked_users         TO authenticated;
GRANT SELECT, INSERT, UPDATE          ON public.conversations        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages              TO authenticated;
GRANT SELECT,         UPDATE, DELETE ON public.notifications         TO authenticated;
GRANT SELECT, INSERT, UPDATE          ON public.verification_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE          ON public.reports              TO authenticated;
GRANT SELECT                          ON public.subscriptions        TO authenticated;
GRANT SELECT                          ON public.payments             TO authenticated;
GRANT SELECT, INSERT                  ON public.consents             TO authenticated;
GRANT SELECT                          ON public.admin_actions        TO authenticated;
GRANT SELECT                          ON public.activity_logs        TO authenticated;

GRANT ALL ON public.profiles, public.photos, public.user_roles, public.likes,
             public.matches, public.favorites, public.blocked_users,
             public.conversations, public.messages, public.notifications,
             public.verification_requests, public.reports, public.subscriptions,
             public.payments, public.consents, public.admin_actions,
             public.activity_logs
      TO service_role;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs         ENABLE ROW LEVEL SECURITY;

-- ---------- profiles ----------
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "profiles_select_browsable" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id <> auth.uid()
    AND is_active AND NOT is_hidden
    AND NOT public.is_blocked_between(auth.uid(), id)
  );

CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_staff" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated USING (id = auth.uid());

-- users must not silently flip their own verified flag
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     AND NOT public.is_staff(auth.uid())
     AND auth.uid() IS NOT NULL THEN
    NEW.is_verified := OLD.is_verified;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_guard_privileged
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

-- ---------- photos ----------
CREATE POLICY "photos_manage_own" ON public.photos
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "photos_select_public" ON public.photos
  FOR SELECT TO authenticated
  USING (
    user_id <> auth.uid()
    AND kind <> 'verification'
    AND is_approved
    AND NOT public.is_blocked_between(auth.uid(), user_id)
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = photos.user_id AND p.is_active AND NOT p.is_hidden)
  );

CREATE POLICY "photos_select_staff" ON public.photos
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "photos_update_staff" ON public.photos
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ---------- user_roles ----------
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ---------- likes ----------
CREATE POLICY "likes_select_involved" ON public.likes
  FOR SELECT TO authenticated USING (liker_id = auth.uid() OR liked_id = auth.uid());

CREATE POLICY "likes_insert_own" ON public.likes
  FOR INSERT TO authenticated
  WITH CHECK (liker_id = auth.uid() AND NOT public.is_blocked_between(auth.uid(), liked_id));

CREATE POLICY "likes_delete_own" ON public.likes
  FOR DELETE TO authenticated USING (liker_id = auth.uid());

-- ---------- matches ----------
CREATE POLICY "matches_select_involved" ON public.matches
  FOR SELECT TO authenticated USING (user_low = auth.uid() OR user_high = auth.uid());

-- ---------- favorites ----------
CREATE POLICY "favorites_manage_own" ON public.favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- blocked_users ----------
CREATE POLICY "blocked_users_select_own" ON public.blocked_users
  FOR SELECT TO authenticated USING (blocker_id = auth.uid());

CREATE POLICY "blocked_users_insert_own" ON public.blocked_users
  FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "blocked_users_delete_own" ON public.blocked_users
  FOR DELETE TO authenticated USING (blocker_id = auth.uid());

CREATE POLICY "blocked_users_select_staff" ON public.blocked_users
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ---------- conversations ----------
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT TO authenticated USING (user_low = auth.uid() OR user_high = auth.uid());

CREATE POLICY "conversations_insert_participant" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_low = auth.uid() OR user_high = auth.uid())
    AND NOT public.is_blocked_between(user_low, user_high)
  );

CREATE POLICY "conversations_update_participant" ON public.conversations
  FOR UPDATE TO authenticated
  USING (user_low = auth.uid() OR user_high = auth.uid())
  WITH CHECK (user_low = auth.uid() OR user_high = auth.uid());

-- ---------- messages ----------
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "messages_update_participant" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()))
  WITH CHECK (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "messages_delete_sender" ON public.messages
  FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- ---------- notifications ----------
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ---------- verification_requests ----------
CREATE POLICY "verification_select_own" ON public.verification_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "verification_insert_own" ON public.verification_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "verification_select_staff" ON public.verification_requests
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "verification_update_staff" ON public.verification_requests
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ---------- reports ----------
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT TO authenticated USING (reporter_id = auth.uid());

CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status = 'open');

CREATE POLICY "reports_select_staff" ON public.reports
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "reports_update_staff" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ---------- subscriptions / payments (writes are server-side only) ----------
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "subscriptions_select_staff" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "payments_select_staff" ON public.payments
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ---------- consents ----------
CREATE POLICY "consents_select_own" ON public.consents
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "consents_insert_own" ON public.consents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ---------- audit (read-only for staff, writes service-role only) ----------
CREATE POLICY "admin_actions_select_staff" ON public.admin_actions
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "activity_logs_select_staff" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- ============================================================
-- REALTIME
-- ============================================================
ALTER TABLE public.messages      REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;