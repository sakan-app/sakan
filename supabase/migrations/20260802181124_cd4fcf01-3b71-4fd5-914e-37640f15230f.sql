
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
