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
  ru: {
    home: "Главная",
    search: "Поиск",
    quickPromotion: "Быстрое продвижение",
    favorites: "Избранное",
    profile: "Профиль",
    primaryNavigation: "Основная навигация",
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
  },
  ru: {
    updateAvailable: "Доступно новое обновление SAKAN",
    updateReload: "Обновить сейчас",
    installTitle: "Установить SAKAN",
    installBody: "Добавьте SAKAN на главный экран для быстрого доступа.",
    installAction: "Установить",
    installDismiss: "Позже",
    iosTitle: "Установка на iOS",
    iosBody: "Нажмите \"Поделиться\", затем \"На экран «Домой»\".",
    offlineTitle: "Нет подключения",
    offlineBody: "Похоже, вы офлайн. Проверьте соединение и попробуйте снова.",
    offlineRetry: "Повторить",
  },
};
