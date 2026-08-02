import type { FeatureDictionary } from "@/i18n/feature";

export type SocialStrings = {
  like: string;
  unlike: string;
  favorite: string;
  unfavorite: string;
  signInToContinue: string;
  favorites: {
    title: string;
    subtitle: string;
    empty: string;
    emptyText: string;
    remove: string;
  };
  matches: {
    title: string;
    subtitle: string;
    empty: string;
    emptyText: string;
    sort: string;
    sortRecent: string;
    sortName: string;
    sortOnline: string;
    verifiedOnly: string;
    allCountries: string;
    message: string;
  };
  notifications: {
    title: string;
    subtitle: string;
    empty: string;
    emptyText: string;
    unreadOnly: string;
    markAllRead: string;
    delete: string;
    bellLabel: string;
    viewAll: string;
    types: {
      like: string;
      match: string;
      message: string;
      profile_view: string;
      verification: string;
      system: string;
    };
  };
  errorTitle: string;
  errorText: string;
  retry: string;
  loading: string;
};

export const socialStrings: FeatureDictionary<SocialStrings> = {
  ar: {
    like: "إعجاب",
    unlike: "إلغاء الإعجاب",
    favorite: "إضافة للمفضلة",
    unfavorite: "إزالة من المفضلة",
    signInToContinue: "سجّل الدخول للمتابعة",
    favorites: {
      title: "المفضلة",
      subtitle: "الأعضاء الذين أضفتهم إلى المفضلة",
      empty: "لا يوجد أعضاء في المفضلة بعد",
      emptyText: "أضف أعضاء إلى المفضلة لتجدهم هنا بسهولة.",
      remove: "إزالة",
    },
    matches: {
      title: "التوافقات",
      subtitle: "الأعضاء الذين تبادلتم الإعجاب معهم",
      empty: "لا توجد توافقات بعد",
      emptyText: "أعجب بالأعضاء لتظهر توافقاتك هنا عند التبادل.",
      sort: "الترتيب",
      sortRecent: "الأحدث",
      sortName: "الاسم",
      sortOnline: "المتصلون الآن",
      verifiedOnly: "الموثقون فقط",
      allCountries: "كل الدول",
      message: "مراسلة",
    },
    notifications: {
      title: "الإشعارات",
      subtitle: "تابع كل جديد يخص حسابك",
      empty: "لا توجد إشعارات",
      emptyText: "ستظهر إشعاراتك هنا فور وصولها.",
      unreadOnly: "غير المقروءة فقط",
      markAllRead: "تعليم الكل كمقروء",
      delete: "حذف",
      bellLabel: "الإشعارات",
      viewAll: "عرض كل الإشعارات",
      types: {
        like: "إعجاب جديد",
        match: "توافق جديد",
        message: "رسالة جديدة",
        profile_view: "مشاهدة للملف الشخصي",
        verification: "توثيق الحساب",
        system: "إشعار من المنصة",
      },
    },
    errorTitle: "حدث خطأ ما",
    errorText: "تعذّر تحميل البيانات، حاول مجددًا.",
    retry: "إعادة المحاولة",
    loading: "جارٍ التحميل…",
  },
  en: {
    like: "Like",
    unlike: "Unlike",
    favorite: "Add to favorites",
    unfavorite: "Remove from favorites",
    signInToContinue: "Sign in to continue",
    favorites: {
      title: "Favorites",
      subtitle: "Members you've saved to your favorites",
      empty: "No favorites yet",
      emptyText: "Save members to find them easily here.",
      remove: "Remove",
    },
    matches: {
      title: "Matches",
      subtitle: "Members who liked you back",
      empty: "No matches yet",
      emptyText: "Like members to see your matches appear here.",
      sort: "Sort",
      sortRecent: "Recent",
      sortName: "Name",
      sortOnline: "Online now",
      verifiedOnly: "Verified only",
      allCountries: "All countries",
      message: "Message",
    },
    notifications: {
      title: "Notifications",
      subtitle: "Stay up to date with your account",
      empty: "No notifications",
      emptyText: "Your notifications will appear here.",
      unreadOnly: "Unread only",
      markAllRead: "Mark all as read",
      delete: "Delete",
      bellLabel: "Notifications",
      viewAll: "View all notifications",
      types: {
        like: "New like",
        match: "New match",
        message: "New message",
        profile_view: "Profile view",
        verification: "Verification",
        system: "System notice",
      },
    },
    errorTitle: "Something went wrong",
    errorText: "We couldn't load this data. Please try again.",
    retry: "Try again",
    loading: "Loading…",
  },
  de: {
    like: "Gefällt mir",
    unlike: "Gefällt mir entfernen",
    favorite: "Zu Favoriten hinzufügen",
    unfavorite: "Aus Favoriten entfernen",
    signInToContinue: "Bitte melde dich an, um fortzufahren",
    favorites: {
      title: "Favoriten",
      subtitle: "Mitglieder, die du gespeichert hast",
      empty: "Noch keine Favoriten",
      emptyText: "Speichere Mitglieder, um sie hier leicht wiederzufinden.",
      remove: "Entfernen",
    },
    matches: {
      title: "Übereinstimmungen",
      subtitle: "Mitglieder, die dich ebenfalls mögen",
      empty: "Noch keine Übereinstimmungen",
      emptyText: "Like Mitglieder, um hier deine Matches zu sehen.",
      sort: "Sortieren",
      sortRecent: "Neueste",
      sortName: "Name",
      sortOnline: "Jetzt online",
      verifiedOnly: "Nur verifizierte",
      allCountries: "Alle Länder",
      message: "Nachricht",
    },
    notifications: {
      title: "Benachrichtigungen",
      subtitle: "Bleib über dein Konto informiert",
      empty: "Keine Benachrichtigungen",
      emptyText: "Deine Benachrichtigungen erscheinen hier.",
      unreadOnly: "Nur ungelesen",
      markAllRead: "Alle als gelesen markieren",
      delete: "Löschen",
      bellLabel: "Benachrichtigungen",
      viewAll: "Alle Benachrichtigungen anzeigen",
      types: {
        like: "Neues Like",
        match: "Neues Match",
        message: "Neue Nachricht",
        profile_view: "Profilansicht",
        verification: "Verifizierung",
        system: "Systemmeldung",
      },
    },
    errorTitle: "Etwas ist schiefgelaufen",
    errorText: "Daten konnten nicht geladen werden. Bitte versuche es erneut.",
    retry: "Erneut versuchen",
    loading: "Wird geladen…",
  },
  ru: {
    like: "Нравится",
    unlike: "Убрать лайк",
    favorite: "В избранное",
    unfavorite: "Убрать из избранного",
    signInToContinue: "Войдите, чтобы продолжить",
    favorites: {
      title: "Избранное",
      subtitle: "Участники, добавленные вами в избранное",
      empty: "В избранном пока пусто",
      emptyText: "Добавляйте участников в избранное, чтобы находить их здесь.",
      remove: "Удалить",
    },
    matches: {
      title: "Совпадения",
      subtitle: "Участники, которые тоже лайкнули вас",
      empty: "Совпадений пока нет",
      emptyText: "Ставьте лайки, чтобы увидеть совпадения здесь.",
      sort: "Сортировка",
      sortRecent: "Недавние",
      sortName: "Имя",
      sortOnline: "Сейчас онлайн",
      verifiedOnly: "Только проверенные",
      allCountries: "Все страны",
      message: "Написать",
    },
    notifications: {
      title: "Уведомления",
      subtitle: "Будьте в курсе своего аккаунта",
      empty: "Нет уведомлений",
      emptyText: "Ваши уведомления появятся здесь.",
      unreadOnly: "Только непрочитанные",
      markAllRead: "Отметить все как прочитанные",
      delete: "Удалить",
      bellLabel: "Уведомления",
      viewAll: "Все уведомления",
      types: {
        like: "Новый лайк",
        match: "Новое совпадение",
        message: "Новое сообщение",
        profile_view: "Просмотр профиля",
        verification: "Верификация",
        system: "Системное уведомление",
      },
    },
    errorTitle: "Что-то пошло не так",
    errorText: "Не удалось загрузить данные. Попробуйте снова.",
    retry: "Повторить",
    loading: "Загрузка…",
  },
};
