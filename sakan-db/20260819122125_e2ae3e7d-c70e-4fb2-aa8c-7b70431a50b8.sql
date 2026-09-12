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