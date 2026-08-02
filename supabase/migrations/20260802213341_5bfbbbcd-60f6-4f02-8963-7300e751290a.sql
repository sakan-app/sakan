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