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