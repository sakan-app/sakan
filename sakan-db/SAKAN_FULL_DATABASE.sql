-- =====================================================================
-- SAKAN — full database bundle (storage buckets + all migrations)
-- Run once in the Supabase SQL editor, top to bottom.
-- =====================================================================

-- ---------------------------------------------------------------
-- FILE: 00000000000000_storage_buckets.sql
-- ---------------------------------------------------------------
-- SAKAN — 0) Storage buckets (run this FIRST, before the migrations)
insert into storage.buckets (id, name, public)
values
  ('avatars','avatars',false),
  ('gallery','gallery',false),
  ('chat-media','chat-media',false),
  ('wallpapers','wallpapers',false),
  ('featured','featured',false),
  ('verification','verification',false),
  ('documents','documents',false),
  ('temporary','temporary',false)
on conflict (id) do nothing;


-- ---------------------------------------------------------------
-- FILE: 20260802162604_b0e31993-abb3-438f-9668-3832e9beeea4.sql
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- FILE: 20260802162624_7b786e32-15c9-43ef-9399-b2b371ca0967.sql
-- ---------------------------------------------------------------
-- Trigger-only functions: nobody may call them directly.
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_profile_completeness()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_match_on_mutual_like()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_conversation_on_message()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_verification()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_privileged_columns()      FROM PUBLIC, anon, authenticated;

-- Policy helper functions: signed-in users only.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid)                          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid)          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid)                          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid)          TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------
-- FILE: 20260802162722_23244acc-c6e5-4128-b2b2-6ff24bf774ee.sql
-- ---------------------------------------------------------------
-- Path convention for every bucket: "<user_id>/<filename>"

-- ---------- owner-managed uploads across all buckets ----------
CREATE POLICY "storage_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('avatars','gallery','verification','documents','temporary')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('avatars','gallery','verification','documents','temporary')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('avatars','gallery','verification','documents','temporary')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('avatars','gallery','verification','documents','temporary')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('avatars','gallery','verification','documents','temporary')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- member-visible imagery (avatars + gallery) ----------
CREATE POLICY "storage_members_view_imagery" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('avatars','gallery')
    AND (storage.foldername(name))[1] <> auth.uid()::text
    AND NOT public.is_blocked_between(auth.uid(), ((storage.foldername(name))[1])::uuid)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.is_active AND NOT p.is_hidden
    )
  );

-- ---------- staff review access (verification + documents) ----------
CREATE POLICY "storage_staff_review" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('verification','documents')
    AND public.is_staff(auth.uid())
  );

-- ---------------------------------------------------------------
-- FILE: 20260802163115_48778aa6-36c6-4f40-83db-c4c515234264.sql
-- ---------------------------------------------------------------
-- 1. Profile fields needed by the member profile UI
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS spoken_languages text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_interests_len CHECK (cardinality(interests) <= 12),
  ADD CONSTRAINT profiles_spoken_languages_len CHECK (cardinality(spoken_languages) <= 8);

-- 2. Public (signed-out) showcase reads
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.photos TO anon;

CREATE POLICY "profiles_select_public_showcase" ON public.profiles
  FOR SELECT TO anon
  USING (is_active AND NOT is_hidden AND onboarding_complete);

CREATE POLICY "photos_select_public_showcase" ON public.photos
  FOR SELECT TO anon
  USING (
    kind <> 'verification'::public.photo_kind
    AND is_approved
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = photos.user_id
        AND p.is_active AND NOT p.is_hidden AND p.onboarding_complete
    )
  );

CREATE POLICY "storage_public_showcase_imagery" ON storage.objects
  FOR SELECT TO anon
  USING (
    bucket_id IN ('avatars','gallery')
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.is_active AND NOT p.is_hidden AND p.onboarding_complete
    )
  );

-- ---------------------------------------------------------------
-- FILE: 20260802163301_3617b107-4021-4c13-8202-ee28c8fcd800.sql
-- ---------------------------------------------------------------
ALTER TABLE public.photos ALTER COLUMN is_approved SET DEFAULT true;
UPDATE public.photos SET is_approved = true WHERE kind <> 'verification'::public.photo_kind AND is_approved = false;

-- ---------------------------------------------------------------
-- FILE: 20260802171655_db1ea10b-dec2-4705-a823-105466d6e489.sql
-- ---------------------------------------------------------------

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


-- ---------------------------------------------------------------
-- FILE: 20260802181124_cd4fcf01-3b71-4fd5-914e-37640f15230f.sql
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.billing_interval AS ENUM ('monthly','annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_event_type AS ENUM (
    'checkout','activated','upgraded','downgraded','canceled','resumed',
    'renewed','payment_succeeded','payment_failed','grace_started','expired','refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.plans (
  code                text PRIMARY KEY,
  tier                smallint NOT NULL DEFAULT 0,
  is_public           boolean NOT NULL DEFAULT true,
  currency            char(3) NOT NULL DEFAULT 'EUR',
  price_monthly_cents integer NOT NULL DEFAULT 0,
  price_annual_cents  integer NOT NULL DEFAULT 0,
  name                jsonb NOT NULL DEFAULT '{}'::jsonb,
  tagline             jsonb NOT NULL DEFAULT '{}'::jsonb,
  features            jsonb NOT NULL DEFAULT '{}'::jsonb,
  limits              jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order          smallint NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_public_read" ON public.plans;
CREATE POLICY "plans_public_read" ON public.plans
  FOR SELECT TO anon, authenticated USING (is_public);

DROP POLICY IF EXISTS "plans_staff_manage" ON public.plans;
CREATE POLICY "plans_staff_manage" ON public.plans
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

INSERT INTO public.plans (code, tier, currency, price_monthly_cents, price_annual_cents, name, tagline, features, limits, sort_order)
VALUES
 ('free', 0, 'EUR', 0, 0,
  '{"ar":"مجاني","en":"Free","de":"Kostenlos","ru":"Бесплатно"}',
  '{"ar":"ابدأ رحلتك بثقة","en":"Start your journey","de":"Starte deine Reise","ru":"Начните свой путь"}',
  '{"ar":["ملف شخصي كامل","بحث أساسي","5 إعجابات يوميًا","استقبال الرسائل"],"en":["Full profile","Basic search","5 likes per day","Receive messages"],"de":["Vollständiges Profil","Basissuche","5 Likes pro Tag","Nachrichten empfangen"],"ru":["Полный профиль","Базовый поиск","5 лайков в день","Получение сообщений"]}',
  '{"likes_per_day":5,"conversations":3,"advanced_filters":false,"see_who_liked":false,"ai_matching":false,"ai_translation":false,"boost_per_month":0,"incognito":false,"priority_support":false}',
  1),
 ('premium', 1, 'EUR', 1990, 19900,
  '{"ar":"بريميوم","en":"Premium","de":"Premium","ru":"Премиум"}',
  '{"ar":"تواصل بلا حدود","en":"Connect without limits","de":"Grenzenlos verbinden","ru":"Общение без границ"}',
  '{"ar":["رسائل غير محدودة","إعجابات غير محدودة","فلاتر بحث متقدمة","معرفة من أعجب بك","ترجمة فورية للرسائل","بدون إعلانات"],"en":["Unlimited messages","Unlimited likes","Advanced search filters","See who liked you","Instant message translation","Ad-free"],"de":["Unbegrenzte Nachrichten","Unbegrenzte Likes","Erweiterte Suchfilter","Sieh, wer dich mag","Sofortübersetzung","Werbefrei"],"ru":["Безлимитные сообщения","Безлимитные лайки","Расширенные фильтры","Кто вас лайкнул","Мгновенный перевод","Без рекламы"]}',
  '{"likes_per_day":-1,"conversations":-1,"advanced_filters":true,"see_who_liked":true,"ai_matching":true,"ai_translation":true,"boost_per_month":1,"incognito":false,"priority_support":false}',
  2),
 ('premium_plus', 2, 'EUR', 3990, 39900,
  '{"ar":"بريميوم بلس","en":"Premium Plus","de":"Premium Plus","ru":"Премиум Плюс"}',
  '{"ar":"أفضل فرصة للعثور على شريك حياتك","en":"The best chance to find your partner","de":"Die beste Chance auf den Partner","ru":"Лучший шанс найти партнёра"}',
  '{"ar":["كل مزايا بريميوم","مطابقة بالذكاء الاصطناعي","ظهور أولوي في البحث","تصفح متخفٍ","4 تعزيزات شهريًا","توثيق سريع","دعم ذو أولوية"],"en":["Everything in Premium","AI matchmaking","Priority search placement","Incognito browsing","4 boosts per month","Fast-track verification","Priority support"],"de":["Alles aus Premium","KI-Matching","Priorität in der Suche","Inkognito-Modus","4 Boosts pro Monat","Schnelle Verifizierung","Priority-Support"],"ru":["Всё из Премиум","ИИ-подбор","Приоритет в поиске","Инкогнито","4 буста в месяц","Быстрая верификация","Приоритетная поддержка"]}',
  '{"likes_per_day":-1,"conversations":-1,"advanced_filters":true,"see_who_liked":true,"ai_matching":true,"ai_translation":true,"boost_per_month":4,"incognito":true,"priority_support":true}',
  3)
ON CONFLICT (code) DO UPDATE SET
  tier = EXCLUDED.tier, currency = EXCLUDED.currency,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  price_annual_cents = EXCLUDED.price_annual_cents,
  name = EXCLUDED.name, tagline = EXCLUDED.tagline,
  features = EXCLUDED.features, limits = EXCLUDED.limits,
  sort_order = EXCLUDED.sort_order, updated_at = now();

DROP TRIGGER IF EXISTS plans_set_updated_at ON public.plans;
CREATE TRIGGER plans_set_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS billing_interval public.billing_interval NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS trial_end timestamptz,
  ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS grace_until timestamptz,
  ADD COLUMN IF NOT EXISTS previous_plan_code text,
  ADD COLUMN IF NOT EXISTS note text;

DO $$ BEGIN
  ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_plan_code_fkey FOREIGN KEY (plan_code) REFERENCES public.plans(code);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx ON public.subscriptions (user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_live_per_user
  ON public.subscriptions (user_id) WHERE status IN ('trialing','active','past_due');

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS period_start timestamptz,
  ADD COLUMN IF NOT EXISTS period_end timestamptz,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS payments_invoice_number_key ON public.payments (invoice_number) WHERE invoice_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_user_created_idx ON public.payments (user_id, created_at DESC);

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;

CREATE OR REPLACE FUNCTION public.assign_invoice_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'SAKAN-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.invoice_number_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS payments_assign_invoice_number ON public.payments;
CREATE TRIGGER payments_assign_invoice_number
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.assign_invoice_number();

CREATE TABLE IF NOT EXISTS public.billing_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  payment_id      uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  type            public.billing_event_type NOT NULL,
  plan_code       text,
  from_plan_code  text,
  amount_cents    integer,
  currency        char(3) NOT NULL DEFAULT 'EUR',
  actor_id        uuid,
  detail          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_events_user_created_idx ON public.billing_events (user_id, created_at DESC);

GRANT SELECT ON public.billing_events TO authenticated;
GRANT ALL ON public.billing_events TO service_role;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_events_own_read" ON public.billing_events;
CREATE POLICY "billing_events_own_read" ON public.billing_events
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.current_subscription(_user_id uuid)
RETURNS public.subscriptions
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.* FROM public.subscriptions s
  WHERE s.user_id = _user_id
    AND (
      s.status IN ('trialing','active')
      OR (s.status = 'past_due' AND coalesce(s.grace_until, s.current_period_end) > now())
    )
  ORDER BY s.created_at DESC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((public.current_subscription(_user_id)).plan_code, 'free')
$$;

CREATE OR REPLACE FUNCTION public.user_plan_tier(_user_id uuid)
RETURNS smallint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT p.tier FROM public.plans p WHERE p.code = public.user_plan(_user_id)), 0::smallint)
$$;

CREATE OR REPLACE FUNCTION public.has_premium(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.user_plan_tier(_user_id) >= 1
$$;

GRANT EXECUTE ON FUNCTION public.current_subscription(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_plan(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_plan_tier(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_premium(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.expire_due_subscriptions()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  WITH moved AS (
    UPDATE public.subscriptions s
       SET status = 'expired', updated_at = now()
     WHERE s.status IN ('trialing','active','past_due')
       AND coalesce(s.grace_until, s.current_period_end) < now()
       AND (s.cancel_at_period_end OR s.status = 'past_due')
     RETURNING s.id, s.user_id, s.plan_code
  )
  INSERT INTO public.billing_events (user_id, subscription_id, type, plan_code)
  SELECT m.user_id, m.id, 'expired', m.plan_code FROM moved m;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

GRANT EXECUTE ON FUNCTION public.expire_due_subscriptions() TO service_role;

DROP TRIGGER IF EXISTS subscriptions_set_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------
-- FILE: 20260802181145_ceca700f-d432-4827-a866-88b40eb6ebc2.sql
-- ---------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.user_plan(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_plan_tier(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_premium(uuid) FROM anon;


-- ---------------------------------------------------------------
-- FILE: 20260802181933_ede56749-3598-4c4b-b833-346c45273066.sql
-- ---------------------------------------------------------------

DELETE FROM public.billing_events;
DELETE FROM public.payments WHERE provider = 'manual';
DELETE FROM public.subscriptions WHERE provider = 'manual';


-- ---------------------------------------------------------------
-- FILE: 20260802190000_chat_telegram_quality.sql
-- ---------------------------------------------------------------
-- ============================================================
-- Chat: Telegram-quality features
-- reactions, edit/delete, pinning, voice/attachment metadata,
-- private chat-media bucket with participant-scoped RLS.
-- ============================================================

-- 1. Attachment metadata + voice kind ---------------------------------------
ALTER TYPE public.message_kind ADD VALUE IF NOT EXISTS 'voice';

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS attachment_width integer,
  ADD COLUMN IF NOT EXISTS attachment_height integer;

-- 2. Message reactions --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji           text NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 8),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS message_reactions_message_idx ON public.message_reactions (message_id);

GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_participant" ON public.message_reactions;
CREATE POLICY "reactions_select_participant" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
        AND public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "reactions_insert_own" ON public.message_reactions;
CREATE POLICY "reactions_insert_own" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_reactions.message_id
        AND public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "reactions_delete_own" ON public.message_reactions;
CREATE POLICY "reactions_delete_own" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;
END $$;

-- 3. Per-user pinned conversations -------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_pins (
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  pinned_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, conversation_id)
);

GRANT SELECT, INSERT, DELETE ON public.conversation_pins TO authenticated;
GRANT ALL ON public.conversation_pins TO service_role;
ALTER TABLE public.conversation_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pins_manage_own" ON public.conversation_pins;
CREATE POLICY "pins_manage_own" ON public.conversation_pins
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_conversation_participant(conversation_id, auth.uid())
  );

ALTER TABLE public.conversation_pins REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_pins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_pins;
  END IF;
END $$;

-- 4. Allow senders to soft-edit/delete their own messages (edited_at/deleted_at/body) --
-- messages_update_participant already exists for read/delivered receipts by recipients;
-- senders also need to update their own row for edit/delete. Add a dedicated policy.
DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;
CREATE POLICY "messages_update_sender" ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- 5. Private chat-media bucket -------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: "{conversation_id}/{user_id}/<filename>"
DROP POLICY IF EXISTS "chat_media_participant_insert" ON storage.objects;
CREATE POLICY "chat_media_participant_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );

DROP POLICY IF EXISTS "chat_media_participant_select" ON storage.objects;
CREATE POLICY "chat_media_participant_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );

DROP POLICY IF EXISTS "chat_media_owner_delete" ON storage.objects;
CREATE POLICY "chat_media_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- 6. Realtime for messages already enabled; ensure UPDATE events carry old row
ALTER TABLE public.messages REPLICA IDENTITY FULL;


-- ---------------------------------------------------------------
-- FILE: 20260802190537_e3f4917c-ffd1-4a44-bfdd-8ccf6e23bc00.sql
-- ---------------------------------------------------------------
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'expired';

-- ---------------------------------------------------------------
-- FILE: 20260802190632_1ec7d0c9-29c8-4978-b554-6cbcf9efa8cb.sql
-- ---------------------------------------------------------------
-- staff recognises super_admin
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','moderator','super_admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon;

CREATE TABLE public.platform_settings (
  id boolean PRIMARY KEY DEFAULT true,
  support_email text NOT NULL DEFAULT 'support@sakan.app',
  maintenance_mode boolean NOT NULL DEFAULT false,
  default_language public.language_code NOT NULL DEFAULT 'ar',
  registration_enabled boolean NOT NULL DEFAULT true,
  verification_required boolean NOT NULL DEFAULT false,
  max_gallery_photos smallint NOT NULL DEFAULT 12,
  max_image_mb smallint NOT NULL DEFAULT 5,
  allowed_image_types text[] NOT NULL DEFAULT ARRAY['image/jpeg','image/png','image/webp'],
  notify_defaults jsonb NOT NULL DEFAULT '{"messages":true,"likes":true,"matches":true,"system":true}'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_settings_singleton CHECK (id)
);

GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings readable by signed in users"
  ON public.platform_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings editable by super admins"
  ON public.platform_settings FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.platform_settings (id) VALUES (true);

CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  author_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_notes_user_id_idx ON public.admin_notes (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notes TO authenticated;
GRANT ALL ON public.admin_notes TO service_role;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read admin notes"
  ON public.admin_notes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write admin notes"
  ON public.admin_notes FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "authors update own notes"
  ON public.admin_notes FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "authors delete own notes"
  ON public.admin_notes FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE TRIGGER admin_notes_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------
-- FILE: 20260802201314_13f86e30-ca1e-4f77-b611-5ec10005e78b.sql
-- ---------------------------------------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_for uuid[] NOT NULL DEFAULT '{}'::uuid[];

CREATE INDEX IF NOT EXISTS messages_reply_to_idx ON public.messages (reply_to_id);
CREATE INDEX IF NOT EXISTS messages_pinned_idx ON public.messages (conversation_id, pinned_at DESC) WHERE pinned_at IS NOT NULL;

ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- ---------------------------------------------------------------
-- FILE: 20260802202423_1df3b333-c9e2-4358-b433-89be7bcfbba3.sql
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS message_reactions_message_idx ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS message_reactions_conversation_idx ON public.message_reactions(conversation_id);

CREATE POLICY "participants read reactions"
ON public.message_reactions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.id = message_reactions.conversation_id
    AND (c.user_low = auth.uid() OR c.user_high = auth.uid())
));

CREATE POLICY "participants add own reaction"
ON public.message_reactions FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = message_reactions.conversation_id
      AND (c.user_low = auth.uid() OR c.user_high = auth.uid())
  )
);

CREATE POLICY "users update own reaction"
ON public.message_reactions FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users delete own reaction"
ON public.message_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- ---------------------------------------------------------------
-- FILE: 20260802204006_e48cc370-9116-4e0b-a097-879b0780c27a.sql
-- ---------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.featured_ad_status AS ENUM ('pending_payment','pending_review','active','expired','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.featured_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  headline text,
  subtitle text,
  target_url text,
  status public.featured_ad_status NOT NULL DEFAULT 'pending_payment',
  amount_cents integer NOT NULL DEFAULT 99,
  currency text NOT NULL DEFAULT 'EUR',
  provider text,
  provider_ref text,
  paid_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS featured_ads_active_idx ON public.featured_ads (status, ends_at DESC);
CREATE INDEX IF NOT EXISTS featured_ads_user_idx ON public.featured_ads (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS featured_ads_provider_ref_idx ON public.featured_ads (provider_ref) WHERE provider_ref IS NOT NULL;

GRANT SELECT ON public.featured_ads TO anon;
GRANT SELECT, INSERT, UPDATE ON public.featured_ads TO authenticated;
GRANT ALL ON public.featured_ads TO service_role;

ALTER TABLE public.featured_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "featured_ads_public_read_active" ON public.featured_ads
  FOR SELECT TO anon, authenticated
  USING (status = 'active' AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "featured_ads_owner_read" ON public.featured_ads
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "featured_ads_owner_insert" ON public.featured_ads
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending_payment');

CREATE POLICY "featured_ads_owner_update_draft" ON public.featured_ads
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('pending_payment','pending_review'))
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "featured_ads_staff_read" ON public.featured_ads
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "featured_ads_staff_update" ON public.featured_ads
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER featured_ads_updated_at BEFORE UPDATE ON public.featured_ads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key text NOT NULL UNIQUE,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  network text,
  unit_id text,
  min_height integer NOT NULL DEFAULT 120,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ad_placements TO anon;
GRANT SELECT ON public.ad_placements TO authenticated;
GRANT ALL ON public.ad_placements TO service_role;

ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_placements_public_read" ON public.ad_placements
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "ad_placements_staff_write" ON public.ad_placements
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER ad_placements_updated_at BEFORE UPDATE ON public.ad_placements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ad_placements (slot_key, label, min_height) VALUES
  ('home_below_hero', 'Home — below hero', 120),
  ('home_mid', 'Home — mid content', 250),
  ('search_inline', 'Search results — inline', 250),
  ('discover_feed', 'Discover feed', 200),
  ('profile_sidebar', 'Member profile — sidebar', 250)
ON CONFLICT (slot_key) DO NOTHING;

CREATE POLICY "featured_bucket_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'featured');

CREATE POLICY "featured_bucket_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'featured' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "featured_bucket_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'featured' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------
-- FILE: 20260802213341_5bfbbbcd-60f6-4f02-8963-7300e751290a.sql
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_wallpapers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  wallpaper_id text NOT NULL DEFAULT 'default',
  wallpaper_type text NOT NULL DEFAULT 'builtin' CHECK (wallpaper_type IN ('builtin','custom','none')),
  custom_image text,
  opacity smallint NOT NULL DEFAULT 100 CHECK (opacity BETWEEN 0 AND 100),
  blur smallint NOT NULL DEFAULT 0 CHECK (blur BETWEEN 0 AND 40),
  brightness smallint NOT NULL DEFAULT 100 CHECK (brightness BETWEEN 30 AND 130),
  overlay smallint NOT NULL DEFAULT 20 CHECK (overlay BETWEEN 0 AND 90),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS chat_wallpapers_global_unique ON public.chat_wallpapers (user_id) WHERE conversation_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS chat_wallpapers_conversation_unique ON public.chat_wallpapers (user_id, conversation_id) WHERE conversation_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_wallpapers TO authenticated;
GRANT ALL ON public.chat_wallpapers TO service_role;

ALTER TABLE public.chat_wallpapers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own chat wallpapers" ON public.chat_wallpapers;
CREATE POLICY "Users manage their own chat wallpapers"
ON public.chat_wallpapers FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_chat_wallpapers_updated_at ON public.chat_wallpapers;
CREATE TRIGGER update_chat_wallpapers_updated_at
BEFORE UPDATE ON public.chat_wallpapers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Private wallpaper uploads: users may only touch files under their own user-id folder.
DROP POLICY IF EXISTS "Users read own wallpapers" ON storage.objects;
CREATE POLICY "Users read own wallpapers" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'wallpapers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users upload own wallpapers" ON storage.objects;
CREATE POLICY "Users upload own wallpapers" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'wallpapers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own wallpapers" ON storage.objects;
CREATE POLICY "Users update own wallpapers" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'wallpapers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own wallpapers" ON storage.objects;
CREATE POLICY "Users delete own wallpapers" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'wallpapers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------
-- FILE: 20260803090000_notif_prefs_profile_views.sql
-- ---------------------------------------------------------------

-- Notification preferences: per-user, per-type toggle for in-app notifications.
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  like_enabled          boolean NOT NULL DEFAULT true,
  match_enabled         boolean NOT NULL DEFAULT true,
  message_enabled       boolean NOT NULL DEFAULT true,
  profile_view_enabled  boolean NOT NULL DEFAULT true,
  verification_enabled  boolean NOT NULL DEFAULT true,
  system_enabled        boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_preferences_own_select" ON public.notification_preferences;
CREATE POLICY "notification_preferences_own_select" ON public.notification_preferences
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_own_insert" ON public.notification_preferences;
CREATE POLICY "notification_preferences_own_insert" ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notification_preferences_own_update" ON public.notification_preferences;
CREATE POLICY "notification_preferences_own_update" ON public.notification_preferences
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS notification_preferences_set_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_set_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Profile views: lightweight log used to compute profile statistics.
CREATE TABLE IF NOT EXISTS public.profile_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_views_viewed_idx ON public.profile_views (viewed_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_views_viewer_idx ON public.profile_views (viewer_id, viewed_id, created_at DESC);

GRANT SELECT, INSERT ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_views_own_read" ON public.profile_views;
CREATE POLICY "profile_views_own_read" ON public.profile_views
  FOR SELECT TO authenticated USING (viewed_id = auth.uid() OR viewer_id = auth.uid());

DROP POLICY IF EXISTS "profile_views_insert" ON public.profile_views;
CREATE POLICY "profile_views_insert" ON public.profile_views
  FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid() AND viewer_id <> viewed_id);


-- ---------------------------------------------------------------
-- FILE: 20260803091822_59d2914a-857a-45e4-8337-87e02722b39b.sql
-- ---------------------------------------------------------------

CREATE SEQUENCE IF NOT EXISTS public.featured_ads_queue_seq;
GRANT USAGE, SELECT ON SEQUENCE public.featured_ads_queue_seq TO service_role;

ALTER TABLE public.featured_ads
  ADD COLUMN IF NOT EXISTS queue_position BIGINT,
  ADD COLUMN IF NOT EXISTS display_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS extra_loops INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loops_total INTEGER NOT NULL DEFAULT 5;

CREATE INDEX IF NOT EXISTS featured_ads_queue_idx
  ON public.featured_ads (status, queue_position);

UPDATE public.featured_ads
SET queue_position = nextval('public.featured_ads_queue_seq')
WHERE queue_position IS NULL AND status IN ('active', 'pending_review');


-- ---------------------------------------------------------------
-- FILE: 20260803091918_2a8625b6-ec1d-49bc-b657-6f00d128a691.sql
-- ---------------------------------------------------------------

UPDATE public.plans SET
  name = '{"ar":"مجاني","en":"Free","de":"Kostenlos","fr":"Gratuit"}'::jsonb,
  tagline = '{"ar":"ابدأ رحلتك بدون أي تكلفة","en":"Start your journey at no cost","de":"Starte kostenlos","fr":"Commencez votre parcours gratuitement"}'::jsonb,
  features = '{"ar":["محادثات نصية","تبادل الصور","رسائل بلا حدود","تبادل صور بلا حدود","البحث عن الأعضاء","التوافق والمطابقات","قائمة المفضلة"],"en":["Chat","Photos","Unlimited messages","Unlimited photo exchange","Search","Matches","Favorites"],"de":["Chat","Fotos","Unbegrenzte Nachrichten","Unbegrenzter Fotoaustausch","Suche","Matches","Favoriten"],"fr":["Messagerie","Photos","Messages illimités","Échange de photos illimité","Recherche","Correspondances","Favoris"]}'::jsonb,
  limits = '{"likes_per_day":-1,"conversations":-1,"advanced_filters":false,"see_who_liked":false,"ai_matching":false,"ai_translation":false,"boost_per_month":0,"incognito":false,"priority_support":false,"featured_banner":false,"voice_calls":false,"video_calls":false,"priority_search":false,"priority_matching":false,"premium_badge":false,"exclusive_features":false}'::jsonb
WHERE code = 'free';

UPDATE public.plans SET
  name = '{"ar":"بريميوم","en":"Premium","de":"Premium","fr":"Premium"}'::jsonb,
  tagline = '{"ar":"كل مميزات المجاني وأكثر","en":"Everything in Free, and more","de":"Alles aus Kostenlos und mehr","fr":"Tout le plan Gratuit, et plus"}'::jsonb,
  features = '{"ar":["كل مميزات الباقة المجانية","الشريط المميز (Featured Banner)","مكالمات صوتية","شارة بريميوم","أولوية في نتائج البحث"],"en":["Everything in Free","Featured Banner","Voice calls","Premium badge","Priority search"],"de":["Alles aus Kostenlos","Featured Banner","Sprachanrufe","Premium-Abzeichen","Priorität in der Suche"],"fr":["Tout le plan Gratuit","Bannière à la une","Appels vocaux","Badge Premium","Recherche prioritaire"]}'::jsonb,
  limits = '{"likes_per_day":-1,"conversations":-1,"advanced_filters":true,"see_who_liked":true,"ai_matching":true,"ai_translation":true,"boost_per_month":1,"incognito":false,"priority_support":false,"featured_banner":true,"voice_calls":true,"video_calls":false,"priority_search":true,"priority_matching":false,"premium_badge":true,"exclusive_features":false}'::jsonb
WHERE code = 'premium';

UPDATE public.plans SET
  name = '{"ar":"بريميوم بلس","en":"Premium Plus","de":"Premium Plus","fr":"Premium Plus"}'::jsonb,
  tagline = '{"ar":"التجربة الكاملة بأولوية قصوى","en":"The complete, highest-priority experience","de":"Das komplette Erlebnis mit höchster Priorität","fr":"L''expérience complète, priorité maximale"}'::jsonb,
  features = '{"ar":["كل مميزات بريميوم","مكالمات فيديو","أولوية في المطابقة","دعم ذو أولوية","مميزات حصرية"],"en":["Everything in Premium","Video calls","Priority matching","Priority support","Exclusive features"],"de":["Alles aus Premium","Videoanrufe","Bevorzugtes Matching","Priorisierter Support","Exklusive Funktionen"],"fr":["Tout le plan Premium","Appels vidéo","Correspondance prioritaire","Support prioritaire","Fonctionnalités exclusives"]}'::jsonb,
  limits = '{"likes_per_day":-1,"conversations":-1,"advanced_filters":true,"see_who_liked":true,"ai_matching":true,"ai_translation":true,"boost_per_month":4,"incognito":true,"priority_support":true,"featured_banner":true,"voice_calls":true,"video_calls":true,"priority_search":true,"priority_matching":true,"premium_badge":true,"exclusive_features":true}'::jsonb
WHERE code = 'premium_plus';


-- ---------------------------------------------------------------
-- FILE: 20260803092603_7db20bf8-0383-47e3-a61f-b553d93857db.sql
-- ---------------------------------------------------------------
ALTER TYPE public.language_code ADD VALUE IF NOT EXISTS 'fr';

-- ---------------------------------------------------------------
-- FILE: 20260803093429_4fd5aa08-6e74-4ec9-bcaf-f27d9d85d936.sql
-- ---------------------------------------------------------------
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'premium';
CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_archived_idx ON public.notifications (user_id, archived_at);

-- ---------------------------------------------------------------
-- FILE: 20260803094036_3841cfac-dcbc-4e12-aa1d-90b7428c32d8.sql
-- ---------------------------------------------------------------
CREATE TYPE public.presence_status AS ENUM ('online','away','busy','dnd','invisible');
CREATE TYPE public.profile_theme AS ENUM ('navy','aurora','sand','emerald','rose','midnight');
CREATE TYPE public.avatar_border AS ENUM ('none','gold','glow','gradient','verified');

ALTER TABLE public.profiles
  ADD COLUMN cover_url text,
  ADD COLUMN accent_color text NOT NULL DEFAULT '#D4AF37',
  ADD COLUMN profile_theme public.profile_theme NOT NULL DEFAULT 'navy',
  ADD COLUMN glass_intensity smallint NOT NULL DEFAULT 60,
  ADD COLUMN avatar_border public.avatar_border NOT NULL DEFAULT 'none',
  ADD COLUMN presence_status public.presence_status NOT NULL DEFAULT 'online',
  ADD COLUMN hide_last_seen boolean NOT NULL DEFAULT false,
  ADD COLUMN hide_typing boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_glass_intensity_range CHECK (glass_intensity BETWEEN 0 AND 100),
  ADD CONSTRAINT profiles_accent_color_hex CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$');

CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.profiles
     SET last_seen_at = now()
   WHERE id = auth.uid()
     AND presence_status <> 'invisible';
$$;

-- ---------------------------------------------------------------
-- FILE: 20260803100709_0b998514-be9a-46cf-ab59-f78117847112.sql
-- ---------------------------------------------------------------
-- Move any lingering Russian selections to French
UPDATE public.profiles SET preferred_language = 'fr' WHERE preferred_language = 'ru';
UPDATE public.compatibility_scores SET language = 'fr' WHERE language = 'ru';
UPDATE public.platform_settings SET default_language = 'fr' WHERE default_language = 'ru';
UPDATE public.messages SET source_language = 'fr' WHERE source_language = 'ru';

-- Rebuild the enum without 'ru'
ALTER TYPE public.language_code RENAME TO language_code_old;
CREATE TYPE public.language_code AS ENUM ('ar','en','de','fr');

ALTER TABLE public.profiles ALTER COLUMN preferred_language DROP DEFAULT;
ALTER TABLE public.compatibility_scores ALTER COLUMN language DROP DEFAULT;
ALTER TABLE public.platform_settings ALTER COLUMN default_language DROP DEFAULT;

ALTER TABLE public.profiles ALTER COLUMN preferred_language TYPE public.language_code USING preferred_language::text::public.language_code;
ALTER TABLE public.compatibility_scores ALTER COLUMN language TYPE public.language_code USING language::text::public.language_code;
ALTER TABLE public.platform_settings ALTER COLUMN default_language TYPE public.language_code USING default_language::text::public.language_code;
ALTER TABLE public.messages ALTER COLUMN source_language TYPE public.language_code USING source_language::text::public.language_code;

ALTER TABLE public.profiles ALTER COLUMN preferred_language SET DEFAULT 'ar'::public.language_code;
ALTER TABLE public.compatibility_scores ALTER COLUMN language SET DEFAULT 'ar'::public.language_code;
ALTER TABLE public.platform_settings ALTER COLUMN default_language SET DEFAULT 'ar'::public.language_code;

DROP TYPE public.language_code_old;

-- ---------------------------------------------------------------
-- FILE: 20260803100952_07484065-2d43-4bf1-b9a0-710a1b90e8e8.sql
-- ---------------------------------------------------------------
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.verification_requests REPLICA IDENTITY FULL;
ALTER TABLE public.featured_ads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.featured_ads;

-- ---------------------------------------------------------------
-- FILE: 20260803104346_325be104-7b11-4602-ab05-9e0ee13617a2.sql
-- ---------------------------------------------------------------
UPDATE public.plans SET features = jsonb_build_object(
  'ar', jsonb_build_array('محادثات نصية','تبادل الصور','البحث عن الأعضاء','قائمة المفضلة'),
  'en', jsonb_build_array('Chat','Photo sharing','Member search','Favorites'),
  'de', jsonb_build_array('Chat','Fotos teilen','Mitgliedersuche','Favoriten'),
  'fr', jsonb_build_array('Messagerie','Partage de photos','Recherche de membres','Favoris')
) WHERE code = 'free';

UPDATE public.plans SET features = jsonb_build_object(
  'ar', jsonb_build_array('ملف مميّز في الشريط','مكالمات صوتية','محادثات نصية','شارة بريميوم','أولوية في نتائج البحث'),
  'en', jsonb_build_array('Featured profile','Voice calls','Chat','Premium badge','Priority search'),
  'de', jsonb_build_array('Hervorgehobenes Profil','Sprachanrufe','Chat','Premium-Abzeichen','Priorität in der Suche'),
  'fr', jsonb_build_array('Profil à la une','Appels vocaux','Messagerie','Badge Premium','Recherche prioritaire')
) WHERE code = 'premium';

UPDATE public.plans SET features = jsonb_build_object(
  'ar', jsonb_build_array('ملف مميّز في الشريط','مكالمات صوتية','مكالمات فيديو','محادثات نصية','أولوية في المطابقة','دعم ذو أولوية'),
  'en', jsonb_build_array('Featured profile','Voice calls','Video calls','Chat','Priority matching','Priority support'),
  'de', jsonb_build_array('Hervorgehobenes Profil','Sprachanrufe','Videoanrufe','Chat','Bevorzugtes Matching','Priorisierter Support'),
  'fr', jsonb_build_array('Profil à la une','Appels vocaux','Appels vidéo','Messagerie','Correspondance prioritaire','Support prioritaire')
) WHERE code = 'premium_plus';

-- ---------------------------------------------------------------
-- FILE: 20260803110826_2d171e2c-c6bf-4a63-a2a0-11901a992126.sql
-- ---------------------------------------------------------------
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('voice','video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing','accepted','rejected','missed','ended','busy','failed')),
  end_reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX call_sessions_callee_status_idx ON public.call_sessions (callee_id, status);
CREATE INDEX call_sessions_caller_status_idx ON public.call_sessions (caller_id, status);
CREATE INDEX call_sessions_conversation_idx ON public.call_sessions (conversation_id, created_at DESC);

GRANT SELECT ON public.call_sessions TO authenticated;
GRANT ALL ON public.call_sessions TO service_role;

ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their calls"
ON public.call_sessions FOR SELECT TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE TRIGGER update_call_sessions_updated_at
BEFORE UPDATE ON public.call_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.call_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;

-- ---------------------------------------------------------------
-- FILE: 20260803113149_33280c19-1fa4-4316-bb15-7acc10d891fc.sql
-- ---------------------------------------------------------------
-- 1) Ad placements: anon sees only enabled slots, never internal config jsonb
DROP POLICY IF EXISTS ad_placements_public_read ON public.ad_placements;
CREATE POLICY ad_placements_public_read ON public.ad_placements
  FOR SELECT TO anon, authenticated
  USING (enabled);

REVOKE SELECT ON public.ad_placements FROM anon;
GRANT SELECT (id, slot_key, label, enabled, network, unit_id, min_height, created_at, updated_at)
  ON public.ad_placements TO anon;

-- 2) Featured storage bucket: only creatives attached to a live featured ad
DROP POLICY IF EXISTS featured_bucket_read ON storage.objects;
CREATE POLICY featured_bucket_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'featured'
    AND EXISTS (
      SELECT 1 FROM public.featured_ads fa
      WHERE fa.image_path = storage.objects.name
        AND fa.status = 'active'
        AND (fa.ends_at IS NULL OR fa.ends_at > now())
    )
  );

-- 3) Photos: anonymous visitors only see approved avatars, never full galleries
DROP POLICY IF EXISTS photos_select_public_showcase ON public.photos;
CREATE POLICY photos_select_public_showcase ON public.photos
  FOR SELECT TO anon
  USING (
    kind = 'avatar'
    AND is_approved
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = photos.user_id AND p.is_active AND NOT p.is_hidden AND p.onboarding_complete
    )
  );

DROP POLICY IF EXISTS storage_public_showcase_imagery ON storage.objects;
CREATE POLICY storage_public_showcase_imagery ON storage.objects
  FOR SELECT TO anon
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = ((storage.foldername(name))[1])::uuid
        AND p.is_active AND NOT p.is_hidden AND p.onboarding_complete
    )
  );

-- 4) Profiles: anonymous visitors get showcase columns only (no DOB, bio, job, etc.)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_year smallint
  GENERATED ALWAYS AS (EXTRACT(YEAR FROM birth_date)::smallint) STORED;

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, display_name, birth_year, gender, looking_for, country_code, city,
  is_verified, avatar_url, presence_status, hide_last_seen, last_seen_at,
  created_at, completeness, is_active, is_hidden, onboarding_complete
) ON public.profiles TO anon;

-- 5) SECURITY DEFINER functions: never executable by anonymous callers,
--    trigger/maintenance functions not executable by clients at all.
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig, pg_get_function_result(p.oid) AS ret
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn.sig);
    IF fn.ret = 'trigger' OR fn.sig::text LIKE 'expire_due_subscriptions%' THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM authenticated', fn.sig);
    ELSE
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.sig);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------
-- FILE: 20260803115122_fc7acfdc-6ace-4422-9f9e-80e24a056bca.sql
-- ---------------------------------------------------------------
CREATE TABLE public.webhook_events (
  id text PRIMARY KEY,
  provider text NOT NULL DEFAULT 'stripe',
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'processed',
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.webhook_events TO service_role;

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view webhook events"
ON public.webhook_events
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

GRANT SELECT ON public.webhook_events TO authenticated;

CREATE TRIGGER webhook_events_set_updated_at
BEFORE UPDATE ON public.webhook_events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_webhook_events_created_at ON public.webhook_events (created_at DESC);

-- ---------------------------------------------------------------
-- FILE: 20260803121431_d6f64590-2e08-4917-b30c-70b81983f1f9.sql
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  customer_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, customer_id),
  UNIQUE (user_id, provider)
);

GRANT SELECT ON public.billing_customers TO authenticated;
GRANT ALL ON public.billing_customers TO service_role;

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their billing customer"
  ON public.billing_customers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_billing_customers_updated_at ON public.billing_customers;
CREATE TRIGGER update_billing_customers_updated_at
  BEFORE UPDATE ON public.billing_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider_customer_id text;

CREATE INDEX IF NOT EXISTS subscriptions_provider_ref_idx
  ON public.subscriptions (provider_ref);
CREATE INDEX IF NOT EXISTS subscriptions_provider_customer_idx
  ON public.subscriptions (provider_customer_id);

-- Full lifecycle sweep: lapsed -> past_due (grace), grace elapsed -> expired.
CREATE OR REPLACE FUNCTION public.sweep_billing_lifecycle(_grace_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  graced integer := 0;
  ended integer := 0;
BEGIN
  WITH lapsed AS (
    UPDATE public.subscriptions s
       SET status = 'past_due',
           grace_until = now() + make_interval(days => _grace_days)
     WHERE s.status IN ('trialing','active')
       AND s.cancel_at_period_end = false
       AND s.current_period_end IS NOT NULL
       AND s.current_period_end < now()
    RETURNING s.id, s.user_id, s.plan_code
  ), logged AS (
    INSERT INTO public.billing_events (user_id, subscription_id, type, plan_code)
    SELECT user_id, id, 'grace_started', plan_code FROM lapsed
    RETURNING 1
  )
  SELECT count(*) INTO graced FROM lapsed;

  WITH closed AS (
    UPDATE public.subscriptions s
       SET status = 'canceled',
           canceled_at = COALESCE(s.canceled_at, now())
     WHERE (
             (s.status = 'past_due' AND s.grace_until IS NOT NULL AND s.grace_until < now())
             OR (s.cancel_at_period_end = true
                 AND s.status IN ('trialing','active')
                 AND s.current_period_end IS NOT NULL
                 AND s.current_period_end < now())
           )
    RETURNING s.id, s.user_id, s.plan_code
  ), logged2 AS (
    INSERT INTO public.billing_events (user_id, subscription_id, type, plan_code)
    SELECT user_id, id, 'expired', plan_code FROM closed
    RETURNING 1
  )
  SELECT count(*) INTO ended FROM closed;

  RETURN jsonb_build_object('graced', graced, 'expired', ended);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sweep_billing_lifecycle(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sweep_billing_lifecycle(integer) TO service_role;

-- Hourly automatic scheduling.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('sakan-billing-sweep');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'sakan-billing-sweep',
  '7 * * * *',
  $$SELECT public.sweep_billing_lifecycle(7);$$
);

-- ---------------------------------------------------------------
-- FILE: 20260803122221_45485163-20b2-4197-8830-60bb6c01d889.sql
-- ---------------------------------------------------------------
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  locale TEXT,
  expiration_time TIMESTAMPTZ,
  failure_count INTEGER NOT NULL DEFAULT 0,
  disabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX push_subscriptions_user_idx ON public.push_subscriptions (user_id) WHERE disabled_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own push subscriptions"
ON public.push_subscriptions FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pwa_install_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  platform TEXT,
  user_agent TEXT,
  locale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pwa_install_events_created_idx ON public.pwa_install_events (created_at DESC);

GRANT INSERT ON public.pwa_install_events TO anon, authenticated;
GRANT SELECT ON public.pwa_install_events TO authenticated;
GRANT ALL ON public.pwa_install_events TO service_role;

ALTER TABLE public.pwa_install_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record an install event"
ON public.pwa_install_events FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read install events"
ON public.pwa_install_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- ---------------------------------------------------------------
-- FILE: 20260803123231_e5d27781-b76a-4d8a-be0c-71866119075e.sql
-- ---------------------------------------------------------------
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS notifications_push_pending_idx
  ON public.notifications (created_at)
  WHERE push_sent_at IS NULL AND read_at IS NULL;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Fan out pending browser notifications once a minute.
SELECT cron.unschedule('sakan-push-dispatch')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sakan-push-dispatch');

SELECT cron.schedule(
  'sakan-push-dispatch',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--984df44d-eadb-44e1-828c-5366b146869c.lovable.app/api/public/push-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-token', 'd4dfa6f2406490a2091104717dd5d3f23f5206184b6f4f20'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);

-- ---------------------------------------------------------------
-- FILE: 20260803142929_0daf69c8-a7a2-4d00-8350-524e368ca87f.sql
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dispatch_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://project--984df44d-eadb-44e1-828c-5366b146869c.lovable.app/api/public/push-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-token', 'd4dfa6f2406490a2091104717dd5d3f23f5206184b6f4f20'
    ),
    body := jsonb_build_object('notificationId', NEW.id),
    timeout_milliseconds := 20000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Immediate push dispatch enqueue failed for notification %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_push_on_notification() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_push_on_notification() TO service_role;

DROP TRIGGER IF EXISTS dispatch_push_on_notification_trigger ON public.notifications;
CREATE TRIGGER dispatch_push_on_notification_trigger
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_on_notification();

SELECT cron.unschedule('sakan-push-dispatch')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sakan-push-dispatch');

-- ---------------------------------------------------------------
-- FILE: 20260803145308_6e058369-3e28-4f44-bfec-47ff98407af7.sql
-- ---------------------------------------------------------------
delete from public.profiles where id = '60b6eeac-6142-4352-9d11-b105e19d746d';

-- ---------------------------------------------------------------
-- FILE: 20260803152416_7eea4866-a21b-4933-b765-818ad11b8b81.sql
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- FILE: 20260803153305_8db0348e-65c9-4627-aa64-5bb251726fda.sql
-- ---------------------------------------------------------------
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_body_len;
ALTER TABLE public.messages ADD CONSTRAINT messages_body_len CHECK (char_length(body) <= 4000);

-- ---------------------------------------------------------------
-- FILE: 20260804091938_9468e4a9-b200-49ec-80a9-d27599479c46.sql
-- ---------------------------------------------------------------
UPDATE public.plans SET features = '{"ar":["محادثات","صور"],"en":["Chat","Photos"],"de":["Chat","Fotos"],"fr":["Messagerie","Photos"]}'::jsonb WHERE code = 'free';

UPDATE public.plans SET features = '{"ar":["ظهور ملفك في الشريط العلوي","مكالمات صوتية","محادثات"],"en":["Your profile appears in the top ribbon","Voice calls","Chat"],"de":["Dein Profil erscheint im oberen Laufband","Sprachanrufe","Chat"],"fr":["Votre profil apparaît dans le bandeau supérieur","Appels vocaux","Messagerie"]}'::jsonb WHERE code = 'premium';

UPDATE public.plans SET features = '{"ar":["ظهور ملفك في الشريط العلوي","مكالمات صوتية","مكالمات فيديو"],"en":["Your profile appears in the top ribbon","Voice calls","Video calls"],"de":["Dein Profil erscheint im oberen Laufband","Sprachanrufe","Videoanrufe"],"fr":["Votre profil apparaît dans le bandeau supérieur","Appels vocaux","Appels vidéo"]}'::jsonb WHERE code = 'premium_plus';

-- ---------------------------------------------------------------
-- FILE: 20260805214241_6fe7a108-c865-4da1-85fe-d877850a6c61.sql
-- ---------------------------------------------------------------
-- 1. Restrict platform_settings reads to staff
DROP POLICY IF EXISTS "settings readable by signed in users" ON public.platform_settings;
CREATE POLICY "settings readable by staff"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
REVOKE ALL ON public.platform_settings FROM anon;
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT UPDATE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

-- 2. call_sessions: read-only for clients, all writes via trusted server code
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public.call_sessions FROM authenticated;
REVOKE ALL ON public.call_sessions FROM anon;
GRANT SELECT ON public.call_sessions TO authenticated;
GRANT ALL ON public.call_sessions TO service_role;

-- 3. Revoke EXECUTE on unused SECURITY DEFINER billing helpers
REVOKE EXECUTE ON FUNCTION public.current_subscription(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.has_premium(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.user_plan(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.user_plan_tier(uuid) FROM authenticated, anon, public;

-- ---------------------------------------------------------------
-- FILE: 20260805215043_dbcdacd3-7292-47b2-8ed4-bf8c3a5eb09f.sql
-- ---------------------------------------------------------------
update public.plans set features = '{"ar":["محادثات","مشاركة الصور"],"en":["Chat","Photo sharing"],"de":["Chat","Fotos teilen"],"fr":["Messagerie","Partage de photos"]}'::jsonb where code = 'free';

update public.plans set features = '{"ar":["محادثات","مكالمات صوتية","ظهور ملفك في الشريط العلوي"],"en":["Chat","Voice calls","Featured profile in the top ribbon"],"de":["Chat","Sprachanrufe","Profil im oberen Laufband hervorgehoben"],"fr":["Messagerie","Appels vocaux","Profil mis en avant dans le bandeau supérieur"]}'::jsonb where code = 'premium';

update public.plans set features = '{"ar":["مكالمات صوتية","مكالمات فيديو","ظهور ملفك في الشريط العلوي"],"en":["Voice calls","Video calls","Featured profile in the top ribbon"],"de":["Sprachanrufe","Videoanrufe","Profil im oberen Laufband hervorgehoben"],"fr":["Appels vocaux","Appels vidéo","Profil mis en avant dans le bandeau supérieur"]}'::jsonb where code = 'premium_plus';

-- ---------------------------------------------------------------
-- FILE: 20260806164440_16fd4686-f3a2-42d4-8c33-63176bfe10dc.sql
-- ---------------------------------------------------------------
DELETE FROM auth.users WHERE email = 'qa.release.check+1@example.com';

-- ---------------------------------------------------------------
-- FILE: 20260813211205_334f5ce6-f73d-4a97-94d0-3d985a3bb60d.sql
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- FILE: 20260813211232_7516e2c9-6b26-4ace-8aa3-08a28952e39f.sql
-- ---------------------------------------------------------------
REVOKE ALL ON FUNCTION public.guard_conversation_participants() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_message_content_updates() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------
-- FILE: 20260813211253_423cf775-0203-48d6-88d3-8e6cfe22bd5a.sql
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','moderator','super_admin'))
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_blocked_between(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND auth.uid() NOT IN (_a, _b) THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE (blocker_id = _a AND blocked_id = _b) OR (blocker_id = _b AND blocked_id = _a)
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = _conversation_id AND (user_low = _user_id OR user_high = _user_id)
    )
  END;
$$;

-- ---------------------------------------------------------------
-- FILE: 20260814171654_c7d8b10a-03cf-45f3-930f-7018747795da.sql
-- ---------------------------------------------------------------
UPDATE public.plans SET features = '{"ar":["محادثات","صور"],"en":["Chat","Photos"],"de":["Chat","Fotos"],"fr":["Messagerie","Photos"]}'::jsonb WHERE code = 'free';

UPDATE public.plans SET features = '{"ar":["ملفك للأعلى (ميزة 0.99€)","اتصال صوتي","محادثات","صور"],"en":["Profile boosted to the top (0.99€ feature)","Voice calls","Chat","Photos"],"de":["Profil ganz oben (0,99-€-Funktion)","Sprachanrufe","Chat","Fotos"],"fr":["Profil mis en avant (fonction 0,99 €)","Appels vocaux","Messagerie","Photos"]}'::jsonb WHERE code = 'premium';

UPDATE public.plans SET price_monthly_cents = 2990, price_annual_cents = 29900, features = '{"ar":["ملفك للأعلى (ميزة 0.99€)","اتصال صوتي","اتصال فيديو","محادثات","صور"],"en":["Profile boosted to the top (0.99€ feature)","Voice calls","Video calls","Chat","Photos"],"de":["Profil ganz oben (0,99-€-Funktion)","Sprachanrufe","Videoanrufe","Chat","Fotos"],"fr":["Profil mis en avant (fonction 0,99 €)","Appels vocaux","Appels vidéo","Messagerie","Photos"]}'::jsonb WHERE code = 'premium_plus';

-- ---------------------------------------------------------------
-- FILE: 20260816225142_8c8b74af-87ac-48d0-bf17-72378813a97c.sql
-- ---------------------------------------------------------------
-- 1. New approved pricing structure
UPDATE public.plans SET price_monthly_cents = 0, price_annual_cents = 0 WHERE code = 'free';
UPDATE public.plans SET price_monthly_cents = 999, price_annual_cents = 4999 WHERE code = 'premium';
UPDATE public.plans SET price_monthly_cents = 1999, price_annual_cents = 9999 WHERE code = 'premium_plus';

-- 2. Custom country ("Other") support on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_country text;

-- 3. First 1000 members promotional entitlement (concurrency safe)
CREATE SEQUENCE IF NOT EXISTS public.founding_member_seq;

CREATE TABLE IF NOT EXISTS public.founding_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  member_number integer NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.founding_members TO authenticated;
GRANT ALL ON public.founding_members TO service_role;
ALTER TABLE public.founding_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read their founding record" ON public.founding_members;
CREATE POLICY "Members read their founding record" ON public.founding_members
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.claim_founding_membership(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  SELECT member_number INTO n FROM public.founding_members WHERE user_id = _user_id;
  IF n IS NOT NULL THEN RETURN n; END IF;

  n := nextval('public.founding_member_seq');
  IF n > 1000 THEN RETURN NULL; END IF;

  INSERT INTO public.founding_members (user_id, member_number)
  VALUES (_user_id, n)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN n;
END $$;

REVOKE EXECUTE ON FUNCTION public.claim_founding_membership(uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_founding_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (SELECT 1 FROM public.founding_members WHERE user_id = _user_id)
  END;
$$;

-- Founding members get at least the tier-1 entitlement set.
CREATE OR REPLACE FUNCTION public.user_plan_tier(_user_id uuid)
RETURNS smallint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    coalesce((SELECT p.tier FROM public.plans p WHERE p.code = public.user_plan(_user_id)), 0::smallint),
    CASE WHEN EXISTS (SELECT 1 FROM public.founding_members f WHERE f.user_id = _user_id)
         THEN 1::smallint ELSE 0::smallint END
  )::smallint
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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

  PERFORM public.claim_founding_membership(NEW.id);

  RETURN NEW;
END;
$$;

-- 4. Commercial header banner placement (admin controlled, disabled by default)
INSERT INTO public.ad_placements (slot_key, label, enabled, min_height, config)
VALUES ('header_banner', 'Homepage header banner (728x90)', false, 90,
        jsonb_build_object('image_url', null, 'target_url', null, 'starts_at', null, 'ends_at', null, 'width', 728, 'height', 90))
ON CONFLICT (slot_key) DO NOTHING;

-- ---------------------------------------------------------------
-- FILE: 20260819122125_e2ae3e7d-c70e-4fb2-aa8c-7b70431a50b8.sql
-- ---------------------------------------------------------------
UPDATE public.plans SET features = jsonb_build_object(
  'ar', to_jsonb(ARRAY['ملفك للأعلى','اتصال صوتي','محادثات','صور']),
  'en', to_jsonb(ARRAY['Profile boosted to the top','Voice calls','Chat','Photos']),
  'de', to_jsonb(ARRAY['Profil ganz oben','Sprachanrufe','Chat','Fotos']),
  'fr', to_jsonb(ARRAY['Profil mis en avant','Appels vocaux','Messagerie','Photos'])
) WHERE code = 'premium';

UPDATE public.plans SET features = jsonb_build_object(
  'ar', to_jsonb(ARRAY['ملفك للأعلى','اتصال صوتي','اتصال فيديو','محادثات','صور']),
  'en', to_jsonb(ARRAY['Profile boosted to the top','Voice calls','Video calls','Chat','Photos']),
  'de', to_jsonb(ARRAY['Profil ganz oben','Sprachanrufe','Videoanrufe','Chat','Fotos']),
  'fr', to_jsonb(ARRAY['Profil mis en avant','Appels vocaux','Appels vidéo','Messagerie','Photos'])
) WHERE code = 'premium_plus';

-- ---------------------------------------------------------------
-- FILE: 20260820193023_b22d8a34-c3b5-45b8-a0cb-2eb1e874a773.sql
-- ---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.commercial_ads (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null default 'header_banner',
  advertiser_name text not null,
  advertiser_email text,
  headline text,
  image_path text,
  image_url text,
  target_url text,
  duration_key text not null default 'daily',
  amount_cents integer not null default 499,
  currency text not null default 'EUR',
  status text not null default 'draft',
  provider text,
  provider_ref text,
  paid_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  impressions integer not null default 0,
  clicks integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_ads_status_check check (status in ('draft','pending_payment','paid','active','paused','expired','rejected')),
  constraint commercial_ads_duration_check check (duration_key in ('daily','weekly','monthly'))
);

GRANT SELECT ON public.commercial_ads TO anon;
GRANT SELECT ON public.commercial_ads TO authenticated;
GRANT ALL ON public.commercial_ads TO service_role;

ALTER TABLE public.commercial_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commercial_ads_public_running" ON public.commercial_ads;
CREATE POLICY "commercial_ads_public_running" ON public.commercial_ads
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    AND paid_at IS NOT NULL
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

DROP POLICY IF EXISTS "commercial_ads_staff_read" ON public.commercial_ads;
CREATE POLICY "commercial_ads_staff_read" ON public.commercial_ads
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS commercial_ads_running_idx
  ON public.commercial_ads (slot_key, status, ends_at);

DROP TRIGGER IF EXISTS commercial_ads_updated_at ON public.commercial_ads;
CREATE TRIGGER commercial_ads_updated_at
  BEFORE UPDATE ON public.commercial_ads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS inactivity_archive_days integer;


-- ---------------------------------------------------------------
-- FILE: 20260821144827_2a8cd475-52c3-465d-9faa-db51b7e9ed36.sql
-- ---------------------------------------------------------------
-- 1. featured_ads: anon may only read display columns
REVOKE SELECT ON public.featured_ads FROM anon;
GRANT SELECT (
  id, image_path, headline, subtitle, target_url, status,
  starts_at, ends_at, created_at
) ON public.featured_ads TO anon;

-- 2. commercial_ads: hide advertiser_email from anon and authenticated
REVOKE SELECT ON public.commercial_ads FROM anon, authenticated;
GRANT SELECT (
  id, slot_key, advertiser_name, headline, image_path, image_url, target_url,
  duration_key, amount_cents, currency, status, paid_at, starts_at, ends_at,
  created_at, updated_at
) ON public.commercial_ads TO anon, authenticated;

-- 3. founding-membership helpers are not public API
REVOKE EXECUTE ON FUNCTION public.claim_founding_membership(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_founding_member(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_founding_member(uuid) TO authenticated;

-- ---------------------------------------------------------------
-- FILE: 20260822151952_0e9f9385-0043-4a6c-b177-106b5a6bdf1c.sql
-- ---------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS profiles_archived_at_idx ON public.profiles (archived_at);
UPDATE public.platform_settings SET inactivity_archive_days = COALESCE(inactivity_archive_days, 365) WHERE id = true;
