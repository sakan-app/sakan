import type { Locale } from "@/i18n";

export type SeoEntry = { title: string; description: string };
export type SeoPage = keyof typeof PAGE_SEO;

type LocaleMap = Record<Locale, SeoEntry>;

const BRAND: Record<Locale, string> = {
  ar: "سَكَن",
  en: "SAKAN",
  de: "SAKAN",
  fr: "SAKAN",
};

/** Localised titles and descriptions for every visitor-facing page. */
export const PAGE_SEO = {
  home: {
    ar: {
      title: "سَكَن | منصة تجمع القلوب لتبني بيتاً واحداً",
      description:
        "ابحث عن شريك حياتك عبر منصة سَكَن: تعارف جاد وموثّق للزواج المستقر في أوروبا والعالم العربي.",
    },
    en: {
      title: "SAKAN | Where hearts meet to build one home",
      description:
        "Find your life partner on SAKAN: serious, verified matchmaking for lasting marriage across Europe and the Arab world.",
    },
    de: {
      title: "SAKAN | Wo Herzen sich finden, um ein Zuhause zu bauen",
      description:
        "Finden Sie Ihren Lebenspartner auf SAKAN: ernsthafte, verifizierte Partnervermittlung für eine stabile Ehe in Europa und der arabischen Welt.",
    },
    fr: {
      title: "SAKAN | Là où les cœurs se rencontrent pour bâtir un foyer",
      description:
        "Trouvez votre partenaire de vie sur SAKAN : des rencontres sérieuses et vérifiées pour un mariage durable en Europe et dans le monde arabe.",
    },
  },
  about: {
    ar: {
      title: "من نحن | سَكَن — منصة الزواج الآمنة",
      description:
        "سَكَن منصة دولية للتعارف الجاد والزواج، مع توثيق للحسابات وترجمة فورية داخل الشات وحماية بالذكاء الاصطناعي.",
    },
    en: {
      title: "About us | SAKAN — the safe marriage platform",
      description:
        "SAKAN is an international platform for serious dating and marriage, with verified accounts, in-chat instant translation and AI-powered protection.",
    },
    de: {
      title: "Über uns | SAKAN — die sichere Heiratsplattform",
      description:
        "SAKAN ist eine internationale Plattform für ernsthafte Partnersuche und Ehe – mit verifizierten Profilen, Sofortübersetzung im Chat und KI-Schutz.",
    },
    fr: {
      title: "À propos | SAKAN — la plateforme de mariage sécurisée",
      description:
        "SAKAN est une plateforme internationale de rencontres sérieuses et de mariage : profils vérifiés, traduction instantanée dans le chat et protection par IA.",
    },
  },
  search: {
    ar: {
      title: "نتائج البحث | سَكَن",
      description: "تصفّح الأعضاء الموثقين وفق العمر والدولة والاهتمامات على منصة سَكَن.",
    },
    en: {
      title: "Search results | SAKAN",
      description: "Browse verified members by age, country and interests on SAKAN.",
    },
    de: {
      title: "Suchergebnisse | SAKAN",
      description: "Verifizierte Mitglieder nach Alter, Land und Interessen auf SAKAN entdecken.",
    },
    fr: {
      title: "Résultats de recherche | SAKAN",
      description: "Parcourez les membres vérifiés par âge, pays et centres d'intérêt sur SAKAN.",
    },
  },
  pricing: {
    ar: {
      title: "الباقات والأسعار | سَكَن",
      description:
        "قارن باقات سَكَن: المجانية (دردشة ومشاركة الصور)، بريميوم (بانر مميز ومكالمة صوتية ودردشة)، وبريميوم بلس (مع مكالمة فيديو).",
    },
    en: {
      title: "Plans & pricing | SAKAN",
      description:
        "Compare SAKAN plans: Free (chat + photo sharing), Premium (featured banner, voice call, chat) and Premium Plus (adds video calls).",
    },
    de: {
      title: "Tarife & Preise | SAKAN",
      description:
        "Vergleichen Sie die SAKAN-Tarife: Kostenlos (Chat + Fotos), Premium (Featured-Banner, Sprachanruf, Chat) und Premium Plus (inkl. Videoanruf).",
    },
    fr: {
      title: "Offres et tarifs | SAKAN",
      description:
        "Comparez les offres SAKAN : Gratuit (chat + photos), Premium (bannière en vedette, appel vocal, chat) et Premium Plus (avec appel vidéo).",
    },
  },
  guide: {
    ar: {
      title: "دليل قانون الزواج والتحذيرات الأمنية | سَكَن",
      description:
        "دليل سَكَن الرسمي: شروط الزواج المدني في ألمانيا وأوروبا، أوراق لم الشمل، وتحذيرات صارمة من الاحتيال المالي.",
    },
    en: {
      title: "Marriage law guide & safety warnings | SAKAN",
      description:
        "The official SAKAN guide: civil marriage requirements in Germany and Europe, family reunification papers and strict warnings about financial fraud.",
    },
    de: {
      title: "Eherechts-Leitfaden & Sicherheitshinweise | SAKAN",
      description:
        "Der offizielle SAKAN-Leitfaden: Voraussetzungen der Zivilehe in Deutschland und Europa, Unterlagen zum Familiennachzug und klare Warnungen vor Finanzbetrug.",
    },
    fr: {
      title: "Guide du droit du mariage et alertes sécurité | SAKAN",
      description:
        "Le guide officiel SAKAN : conditions du mariage civil en Allemagne et en Europe, documents de regroupement familial et avertissements contre la fraude financière.",
    },
  },
  privacy: {
    ar: {
      title: "سياسة الخصوصية | سَكَن",
      description: "كيف نجمع بياناتك ونحميها ونستخدمها على منصة سَكَن، وحقوقك وفق اللائحة الأوروبية GDPR.",
    },
    en: {
      title: "Privacy policy | SAKAN",
      description: "How SAKAN collects, protects and uses your data, and your rights under the GDPR.",
    },
    de: {
      title: "Datenschutzerklärung | SAKAN",
      description: "Wie SAKAN Ihre Daten erhebt, schützt und verwendet – und Ihre Rechte nach der DSGVO.",
    },
    fr: {
      title: "Politique de confidentialité | SAKAN",
      description: "Comment SAKAN collecte, protège et utilise vos données, et vos droits au titre du RGPD.",
    },
  },
  terms: {
    ar: {
      title: "شروط الاستخدام | سَكَن",
      description: "الشروط والأحكام التي تنظّم استخدام منصة سَكَن والاشتراكات والمحتوى.",
    },
    en: {
      title: "Terms of use | SAKAN",
      description: "The terms and conditions governing your use of SAKAN, subscriptions and content.",
    },
    de: {
      title: "Nutzungsbedingungen | SAKAN",
      description: "Die Bedingungen für die Nutzung von SAKAN, Abonnements und Inhalte.",
    },
    fr: {
      title: "Conditions d'utilisation | SAKAN",
      description: "Les conditions régissant l'utilisation de SAKAN, les abonnements et les contenus.",
    },
  },
  impressum: {
    ar: {
      title: "بيانات الناشر | سَكَن",
      description: "بيانات مشغّل منصة سَكَن وعنوانه ووسائل التواصل وفق §5 DDG.",
    },
    en: {
      title: "Legal notice | SAKAN",
      description: "Operator details, address and contact information for the SAKAN platform (§5 DDG).",
    },
    de: {
      title: "Impressum | SAKAN",
      description: "Anbieterkennzeichnung nach §5 DDG für die Plattform SAKAN: Betreiber, Anschrift und Kontakt.",
    },
    fr: {
      title: "Mentions légales | SAKAN",
      description: "Éditeur, adresse et coordonnées de la plateforme SAKAN (§5 DDG).",
    },
  },
  auth: {
    ar: {
      title: "تسجيل الدخول | سَكَن",
      description: "سجّل الدخول أو أنشئ حسابك على منصة سَكَن للتعارف الجاد والزواج المستقر.",
    },
    en: {
      title: "Sign in | SAKAN",
      description: "Sign in or create your SAKAN account for serious matchmaking and lasting marriage.",
    },
    de: {
      title: "Anmelden | SAKAN",
      description: "Melden Sie sich an oder erstellen Sie Ihr SAKAN-Konto für ernsthafte Partnersuche.",
    },
    fr: {
      title: "Connexion | SAKAN",
      description: "Connectez-vous ou créez votre compte SAKAN pour des rencontres sérieuses.",
    },
  },
  authCallback: {
    ar: { title: "إتمام تسجيل الدخول | سَكَن", description: "جارٍ إتمام عملية تسجيل الدخول إلى منصة سَكَن." },
    en: { title: "Completing sign-in | SAKAN", description: "Finishing your sign-in to SAKAN." },
    de: { title: "Anmeldung wird abgeschlossen | SAKAN", description: "Ihre Anmeldung bei SAKAN wird abgeschlossen." },
    fr: { title: "Connexion en cours | SAKAN", description: "Finalisation de votre connexion à SAKAN." },
  },
  resetPassword: {
    ar: { title: "تعيين كلمة مرور جديدة | سَكَن", description: "اختر كلمة مرور جديدة لحسابك على منصة سَكَن." },
    en: { title: "Set a new password | SAKAN", description: "Choose a new password for your SAKAN account." },
    de: { title: "Neues Passwort festlegen | SAKAN", description: "Wählen Sie ein neues Passwort für Ihr SAKAN-Konto." },
    fr: { title: "Définir un nouveau mot de passe | SAKAN", description: "Choisissez un nouveau mot de passe pour votre compte SAKAN." },
  },
  offline: {
    ar: { title: "لا يوجد اتصال بالإنترنت | سَكَن", description: "يبدو أنك غير متصل حالياً. تحقق من الاتصال وحاول مرة أخرى." },
    en: { title: "You are offline | SAKAN", description: "You appear to be offline. Check your connection and try again." },
    de: { title: "Keine Internetverbindung | SAKAN", description: "Sie sind offline. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut." },
    fr: { title: "Hors connexion | SAKAN", description: "Vous semblez hors ligne. Vérifiez votre connexion et réessayez." },
  },
  unauthorized: {
    ar: { title: "لا تملك صلاحية الوصول | سَكَن", description: "هذه الصفحة تتطلب صلاحيات إضافية على حسابك." },
    en: { title: "Access denied | SAKAN", description: "This page requires additional permissions on your account." },
    de: { title: "Kein Zugriff | SAKAN", description: "Diese Seite erfordert zusätzliche Berechtigungen." },
    fr: { title: "Accès refusé | SAKAN", description: "Cette page nécessite des autorisations supplémentaires." },
  },
  appHome: {
    ar: { title: "الرئيسية | سَكَن", description: "لوحتك اليومية: اقتراحات التوافق، الرسائل الجديدة والإشعارات." },
    en: { title: "Home | SAKAN", description: "Your daily hub: match suggestions, new messages and notifications." },
    de: { title: "Start | SAKAN", description: "Ihr täglicher Überblick: Match-Vorschläge, neue Nachrichten und Benachrichtigungen." },
    fr: { title: "Accueil | SAKAN", description: "Votre espace quotidien : suggestions, nouveaux messages et notifications." },
  },
  discover: {
    ar: { title: "اكتشف | سَكَن", description: "اكتشف أعضاءً جدداً يناسبون تفضيلاتك على منصة سَكَن." },
    en: { title: "Discover | SAKAN", description: "Discover new members that match your preferences on SAKAN." },
    de: { title: "Entdecken | SAKAN", description: "Entdecken Sie neue Mitglieder passend zu Ihren Präferenzen." },
    fr: { title: "Découvrir | SAKAN", description: "Découvrez de nouveaux membres correspondant à vos préférences." },
  },
  matches: {
    ar: { title: "التوافقات | سَكَن", description: "كل التوافقات المتبادلة وطلبات الإعجاب في مكان واحد." },
    en: { title: "Matches | SAKAN", description: "All your mutual matches and likes in one place." },
    de: { title: "Matches | SAKAN", description: "Alle gegenseitigen Matches und Likes an einem Ort." },
    fr: { title: "Affinités | SAKAN", description: "Tous vos matchs réciproques et vos likes au même endroit." },
  },
  favorites: {
    ar: { title: "المفضلة | سَكَن", description: "الملفات التي حفظتها للرجوع إليها لاحقاً." },
    en: { title: "Favourites | SAKAN", description: "The profiles you saved to revisit later." },
    de: { title: "Favoriten | SAKAN", description: "Die Profile, die Sie gespeichert haben." },
    fr: { title: "Favoris | SAKAN", description: "Les profils que vous avez enregistrés." },
  },
  messages: {
    ar: { title: "الرسائل | سَكَن", description: "محادثاتك الخاصة مع ترجمة فورية داخل الشات." },
    en: { title: "Messages | SAKAN", description: "Your private conversations with instant in-chat translation." },
    de: { title: "Nachrichten | SAKAN", description: "Ihre privaten Chats mit Sofortübersetzung." },
    fr: { title: "Messages | SAKAN", description: "Vos conversations privées avec traduction instantanée." },
  },
  conversation: {
    ar: { title: "محادثة | سَكَن", description: "محادثة خاصة وآمنة على منصة سَكَن." },
    en: { title: "Conversation | SAKAN", description: "A private, secure conversation on SAKAN." },
    de: { title: "Unterhaltung | SAKAN", description: "Ein privater, sicherer Chat auf SAKAN." },
    fr: { title: "Conversation | SAKAN", description: "Une conversation privée et sécurisée sur SAKAN." },
  },
  notifications: {
    ar: { title: "الإشعارات | سَكَن", description: "مركز الإشعارات: الرسائل والإعجابات والتوافقات." },
    en: { title: "Notifications | SAKAN", description: "Your notification centre: messages, likes and matches." },
    de: { title: "Benachrichtigungen | SAKAN", description: "Ihr Benachrichtigungscenter: Nachrichten, Likes und Matches." },
    fr: { title: "Notifications | SAKAN", description: "Votre centre de notifications : messages, likes et matchs." },
  },
  profile: {
    ar: { title: "ملفي الشخصي | سَكَن", description: "إدارة ملفك الشخصي وصورك وقوة الملف." },
    en: { title: "My profile | SAKAN", description: "Manage your profile, photos and profile strength." },
    de: { title: "Mein Profil | SAKAN", description: "Verwalten Sie Profil, Fotos und Profilstärke." },
    fr: { title: "Mon profil | SAKAN", description: "Gérez votre profil, vos photos et sa complétude." },
  },
  profileEdit: {
    ar: { title: "تعديل الملف الشخصي | سَكَن", description: "حدّث بياناتك وصورك ونبذتك على منصة سَكَن." },
    en: { title: "Edit profile | SAKAN", description: "Update your details, photos and bio on SAKAN." },
    de: { title: "Profil bearbeiten | SAKAN", description: "Aktualisieren Sie Angaben, Fotos und Bio." },
    fr: { title: "Modifier le profil | SAKAN", description: "Mettez à jour vos informations, photos et bio." },
  },
  profileAppearance: {
    ar: { title: "مظهر الملف الشخصي | سَكَن", description: "اختر صورة الغلاف واللون المميّز وثيم ملفك." },
    en: { title: "Profile appearance | SAKAN", description: "Choose your cover photo, accent colour and profile theme." },
    de: { title: "Profil-Design | SAKAN", description: "Wählen Sie Titelbild, Akzentfarbe und Profil-Theme." },
    fr: { title: "Apparence du profil | SAKAN", description: "Choisissez votre couverture, couleur d'accent et thème." },
  },
  settings: {
    ar: { title: "الإعدادات | سَكَن", description: "إعدادات الحساب والخصوصية واللغة والإشعارات." },
    en: { title: "Settings | SAKAN", description: "Account, privacy, language and notification settings." },
    de: { title: "Einstellungen | SAKAN", description: "Konto, Privatsphäre, Sprache und Benachrichtigungen." },
    fr: { title: "Paramètres | SAKAN", description: "Compte, confidentialité, langue et notifications." },
  },
  billing: {
    ar: { title: "الاشتراك والفواتير | سَكَن", description: "إدارة اشتراكك وطرق الدفع وفواتيرك." },
    en: { title: "Subscription & invoices | SAKAN", description: "Manage your subscription, payment methods and invoices." },
    de: { title: "Abo & Rechnungen | SAKAN", description: "Verwalten Sie Abo, Zahlungsarten und Rechnungen." },
    fr: { title: "Abonnement et factures | SAKAN", description: "Gérez votre abonnement, moyens de paiement et factures." },
  },
  featured: {
    ar: { title: "الإعلان المميز | سَكَن", description: "اعرض ملفك في الشريط المميز أعلى المنصة مقابل 0.99 €." },
    en: { title: "Featured banner | SAKAN", description: "Showcase your profile in the featured strip for €0.99." },
    de: { title: "Featured-Banner | SAKAN", description: "Zeigen Sie Ihr Profil im Featured-Banner für 0,99 €." },
    fr: { title: "Bannière en vedette | SAKAN", description: "Mettez votre profil en vedette pour 0,99 €." },
  },
  onboarding: {
    ar: { title: "إكمال الملف الشخصي | سَكَن", description: "أكمل بياناتك لتبدأ رحلتك على منصة سَكَن." },
    en: { title: "Complete your profile | SAKAN", description: "Complete your details to start your SAKAN journey." },
    de: { title: "Profil vervollständigen | SAKAN", description: "Vervollständigen Sie Ihre Angaben für den Start." },
    fr: { title: "Compléter votre profil | SAKAN", description: "Complétez vos informations pour commencer." },
  },
} satisfies Record<string, LocaleMap>;

export function seoFor(page: SeoPage, locale: Locale): SeoEntry {
  return PAGE_SEO[page][locale];
}

/** Localised title for a member profile page. */
export function memberSeo(
  locale: Locale,
  name: string | null | undefined,
  age: number | null | undefined,
  bio: string | null | undefined,
): SeoEntry {
  const fallbackName: Record<Locale, string> = {
    ar: "عضو",
    en: "Member",
    de: "Mitglied",
    fr: "Membre",
  };
  const yearWord: Record<Locale, string> = {
    ar: "سنة",
    en: "years",
    de: "Jahre",
    fr: "ans",
  };
  const fallbackBio: Record<Locale, string> = {
    ar: "ملف عضو موثق على منصة سَكَن للتعارف الجاد والزواج.",
    en: "A verified member profile on SAKAN, the serious matchmaking platform.",
    de: "Ein verifiziertes Mitgliedsprofil auf SAKAN, der Plattform für ernsthafte Partnersuche.",
    fr: "Un profil de membre vérifié sur SAKAN, la plateforme de rencontres sérieuses.",
  };
  const display = name?.trim() || fallbackName[locale];
  const suffix = age ? ` · ${age} ${yearWord[locale]}` : "";
  return {
    title: `${display}${suffix} | ${BRAND[locale]}`,
    description: bio?.trim() || fallbackBio[locale],
  };
}

/** Maps a pathname to the localised SEO entry that describes it. */
export function pageForPath(pathname: string): SeoPage | null {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/") return "home";
  const exact: Record<string, SeoPage> = {
    "/about": "about",
    "/search": "search",
    "/pricing": "pricing",
    "/guide": "guide",
    "/privacy": "privacy",
    "/terms": "terms",
    "/impressum": "impressum",
    "/offline": "offline",
    "/unauthorized": "unauthorized",
    "/auth": "auth",
    "/auth/callback": "authCallback",
    "/auth/reset-password": "resetPassword",
    "/home": "appHome",
    "/discover": "discover",
    "/matches": "matches",
    "/favorites": "favorites",
    "/messages": "messages",
    "/notifications": "notifications",
    "/profile": "profile",
    "/profile/edit": "profileEdit",
    "/profile/appearance": "profileAppearance",
    "/settings": "settings",
    "/billing": "billing",
    "/featured": "featured",
    "/onboarding": "onboarding",
  };
  if (exact[p]) return exact[p];
  if (p.startsWith("/messages/")) return "conversation";
  return null;
}

/** Text of the "skip to content" link, per locale. */
export const SKIP_LINK: Record<Locale, string> = {
  ar: "تخطَّ إلى المحتوى الرئيسي",
  en: "Skip to main content",
  de: "Zum Hauptinhalt springen",
  fr: "Aller au contenu principal",
};
