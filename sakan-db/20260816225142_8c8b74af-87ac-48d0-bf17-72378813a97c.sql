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