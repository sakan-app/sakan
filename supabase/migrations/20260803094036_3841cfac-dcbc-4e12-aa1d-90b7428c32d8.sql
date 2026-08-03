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