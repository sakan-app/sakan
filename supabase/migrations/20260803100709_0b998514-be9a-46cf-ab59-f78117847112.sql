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