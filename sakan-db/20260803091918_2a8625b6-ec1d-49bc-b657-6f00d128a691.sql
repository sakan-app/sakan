
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
