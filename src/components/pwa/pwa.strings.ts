import type { FeatureDictionary } from "@/i18n/feature";

export interface NavStrings {
  home: string;
  search: string;
  quickPromotion: string;
  favorites: string;
  profile: string;
  primaryNavigation: string;
}

export const navStrings: FeatureDictionary<NavStrings> = {
  ar: {
    home: "الرئيسية",
    search: "بحث",
    quickPromotion: "ترويج سريع",
    favorites: "المفضلة",
    profile: "ملفي",
    primaryNavigation: "التنقل الرئيسي",
  },
  en: {
    home: "Home",
    search: "Search",
    quickPromotion: "Quick promotion",
    favorites: "Favorites",
    profile: "Profile",
    primaryNavigation: "Primary navigation",
  },
  de: {
    home: "Start",
    search: "Suche",
    quickPromotion: "Schnelle Bewerbung",
    favorites: "Favoriten",
    profile: "Profil",
    primaryNavigation: "Hauptnavigation",
  },
  fr: {
    home: "Accueil",
    search: "Rechercher",
    quickPromotion: "Promotion rapide",
    favorites: "Favoris",
    profile: "Profil",
    primaryNavigation: "Navigation principale",
  },
};

export interface PwaStrings {
  updateAvailable: string;
  updateReload: string;
  installTitle: string;
  installBody: string;
  installAction: string;
  installDismiss: string;
  iosTitle: string;
  iosBody: string;
  offlineTitle: string;
  offlineBody: string;
  offlineRetry: string;
  installedTitle: string;
  pushTitle: string;
  pushBlocked: string;
  pushUnsupported: string;
  pushEnabled: string;
  pushTest: string;
  version: string;
}

export const pwaStrings: FeatureDictionary<PwaStrings> = {
  ar: {
    updateAvailable: "يتوفر تحديث جديد لسَكَن",
    updateReload: "تحديث الآن",
    installTitle: "ثبّت تطبيق سَكَن",
    installBody: "أضف سَكَن إلى شاشتك الرئيسية لتجربة أسرع وأقرب.",
    installAction: "تثبيت",
    installDismiss: "لاحقاً",
    iosTitle: "تثبيت على iOS",
    iosBody: "اضغط على زر المشاركة ثم \"إضافة إلى الشاشة الرئيسية\".",
    offlineTitle: "لا يوجد اتصال بالإنترنت",
    offlineBody: "يبدو أنك غير متصل حالياً. تحقق من الاتصال وحاول مرة أخرى.",
    offlineRetry: "إعادة المحاولة",
    installedTitle: "التطبيق مثبّت بالفعل",
    pushTitle: "الإشعارات الفورية",
    pushBlocked: "الإشعارات محظورة في إعدادات المتصفح",
    pushUnsupported: "غير مدعوم على هذا الجهاز",
    pushEnabled: "مفعّلة على هذا الجهاز",
    pushTest: "إرسال إشعار تجريبي",
    version: "الإصدار",
  },
  en: {
    updateAvailable: "A new SAKAN update is available",
    updateReload: "Reload now",
    installTitle: "Install SAKAN",
    installBody: "Add SAKAN to your home screen for a faster experience.",
    installAction: "Install",
    installDismiss: "Later",
    iosTitle: "Install on iOS",
    iosBody: "Tap the Share button then \"Add to Home Screen\".",
    offlineTitle: "You're offline",
    offlineBody: "It looks like you have no connection. Check it and try again.",
    offlineRetry: "Retry",
    installedTitle: "App already installed",
    pushTitle: "Push notifications",
    pushBlocked: "Notifications are blocked in your browser settings",
    pushUnsupported: "Not supported on this device",
    pushEnabled: "Enabled on this device",
    pushTest: "Send a test notification",
    version: "Version",
  },
  de: {
    updateAvailable: "Ein neues SAKAN-Update ist verfügbar",
    updateReload: "Jetzt neu laden",
    installTitle: "SAKAN installieren",
    installBody: "Füge SAKAN zu deinem Startbildschirm hinzu.",
    installAction: "Installieren",
    installDismiss: "Später",
    iosTitle: "Auf iOS installieren",
    iosBody: "Tippe auf \"Teilen\" und dann \"Zum Home-Bildschirm\".",
    offlineTitle: "Du bist offline",
    offlineBody: "Es scheint keine Verbindung zu bestehen. Bitte erneut versuchen.",
    offlineRetry: "Erneut versuchen",
    installedTitle: "App bereits installiert",
    pushTitle: "Push-Benachrichtigungen",
    pushBlocked: "Benachrichtigungen sind im Browser blockiert",
    pushUnsupported: "Auf diesem Gerät nicht unterstützt",
    pushEnabled: "Auf diesem Gerät aktiviert",
    pushTest: "Testbenachrichtigung senden",
    version: "Version",
  },
  fr: {
    updateAvailable: "Une nouvelle mise à jour de SAKAN est disponible",
    updateReload: "Recharger maintenant",
    installTitle: "Installer SAKAN",
    installBody: "Ajoutez SAKAN à votre écran d'accueil pour un accès plus rapide.",
    installAction: "Installer",
    installDismiss: "Plus tard",
    iosTitle: "Installation sur iOS",
    iosBody: "Appuyez sur \"Partager\", puis \"Sur l'écran d'accueil\".",
    offlineTitle: "Aucune connexion",
    offlineBody: "Il semble que vous soyez hors ligne. Vérifiez votre connexion et réessayez.",
    offlineRetry: "Réessayer",
    installedTitle: "Application déjà installée",
    pushTitle: "Notifications push",
    pushBlocked: "Les notifications sont bloquées dans le navigateur",
    pushUnsupported: "Non pris en charge sur cet appareil",
    pushEnabled: "Activées sur cet appareil",
    pushTest: "Envoyer une notification test",
    version: "Version",
  },
};
