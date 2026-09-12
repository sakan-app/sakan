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