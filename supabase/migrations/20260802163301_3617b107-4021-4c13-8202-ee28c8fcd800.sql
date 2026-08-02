ALTER TABLE public.photos ALTER COLUMN is_approved SET DEFAULT true;
UPDATE public.photos SET is_approved = true WHERE kind <> 'verification'::public.photo_kind AND is_approved = false;