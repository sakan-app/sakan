import type { FeatureDictionary } from "@/i18n/feature";

export type SearchFeatureStrings = {
  recent: {
    title: string;
    clear: string;
  };
  saved: {
    title: string;
    save: string;
    saving: string;
    saved: string;
    delete: string;
    namePrompt: string;
    empty: string;
    signInHint: string;
  };
  refine: {
    placeholder: string;
    noMatches: string;
  };
  ai: {
    title: string;
    subtitle: string;
    show: string;
    hide: string;
    loading: string;
    empty: string;
    retry: string;
    rateLimited: string;
    creditsExhausted: string;
    failed: string;
    scoreLabel: string;
    refresh: string;
  };
  compat: {
    cta: string;
    loading: string;
    scoreLabel: string;
    rateLimited: string;
    creditsExhausted: string;
    failed: string;
  };
  moderation: {
    rejectedText: string;
    flaggedText: string;
    rejectedImage: string;
    flaggedImage: string;
  };
};

export const searchStrings: FeatureDictionary<SearchFeatureStrings> = {
  ar: {
    recent: { title: "عمليات بحث أخيرة", clear: "مسح" },
    saved: {
      title: "عمليات بحث محفوظة",
      save: "احفظ هذا البحث",
      saving: "جارٍ الحفظ...",
      saved: "تم الحفظ",
      delete: "حذف",
      namePrompt: "اسم لهذا البحث",
      empty: "لا توجد عمليات بحث محفوظة بعد.",
      signInHint: "سجّل الدخول لحفظ عمليات البحث.",
    },
    refine: {
      placeholder: "تصفية حسب الاسم أو المدينة...",
      noMatches: "لا توجد نتائج مطابقة للتصفية.",
    },
    ai: {
      title: "توصيات الذكاء الاصطناعي",
      subtitle: "أعضاء مقترحون بناءً على ملفك الشخصي",
      show: "عرض التوصيات",
      hide: "إخفاء",
      loading: "جارٍ تحليل التوافق...",
      empty: "لا توجد توصيات متاحة الآن.",
      retry: "إعادة المحاولة",
      rateLimited: "عدد الطلبات كبير حاليًا، حاول لاحقًا.",
      creditsExhausted: "انتهى رصيد الذكاء الاصطناعي المتاح حاليًا.",
      failed: "تعذّر تحميل التوصيات.",
      scoreLabel: "التوافق",
      refresh: "تحديث التوصيات",
    },
    compat: {
      cta: "احسب التوافق",
      loading: "...",
      scoreLabel: "التوافق",
      rateLimited: "حاول لاحقًا",
      creditsExhausted: "الرصيد غير متاح",
      failed: "تعذّر الحساب",
    },
    moderation: {
      rejectedText: "تم رفض هذا النص لأنه يخالف إرشادات المنصة، يرجى تعديله.",
      flaggedText: "تم حفظ التعديل، لكنه قيد المراجعة من فريقنا.",
      rejectedImage: "تم رفض هذه الصورة لأنها تخالف إرشادات المنصة وحُذفت.",
      flaggedImage: "الصورة قيد المراجعة من فريقنا حاليًا.",
    },
  },
  en: {
    recent: { title: "Recent searches", clear: "Clear" },
    saved: {
      title: "Saved searches",
      save: "Save this search",
      saving: "Saving...",
      saved: "Saved",
      delete: "Delete",
      namePrompt: "Name this search",
      empty: "No saved searches yet.",
      signInHint: "Sign in to save searches.",
    },
    refine: {
      placeholder: "Refine by name or city...",
      noMatches: "No results match your refinement.",
    },
    ai: {
      title: "AI recommendations",
      subtitle: "Members suggested based on your profile",
      show: "Show recommendations",
      hide: "Hide",
      loading: "Analyzing compatibility...",
      empty: "No recommendations available right now.",
      retry: "Retry",
      rateLimited: "Too many requests right now, try again later.",
      creditsExhausted: "AI credits are currently exhausted.",
      failed: "Could not load recommendations.",
      scoreLabel: "Match",
      refresh: "Refresh recommendations",
    },
    compat: {
      cta: "Score compatibility",
      loading: "...",
      scoreLabel: "Match",
      rateLimited: "Try again later",
      creditsExhausted: "Credits unavailable",
      failed: "Could not score",
    },
    moderation: {
      rejectedText: "This text was rejected for violating platform guidelines, please edit it.",
      flaggedText: "Saved, but it's under review by our team.",
      rejectedImage: "This image was rejected for violating platform guidelines and was removed.",
      flaggedImage: "This photo is currently under review by our team.",
    },
  },
  de: {
    recent: { title: "Letzte Suchen", clear: "Löschen" },
    saved: {
      title: "Gespeicherte Suchen",
      save: "Diese Suche speichern",
      saving: "Speichern...",
      saved: "Gespeichert",
      delete: "Löschen",
      namePrompt: "Name für diese Suche",
      empty: "Noch keine gespeicherten Suchen.",
      signInHint: "Melde dich an, um Suchen zu speichern.",
    },
    refine: {
      placeholder: "Nach Name oder Stadt filtern...",
      noMatches: "Keine Treffer für diese Filterung.",
    },
    ai: {
      title: "KI-Empfehlungen",
      subtitle: "Vorgeschlagene Mitglieder basierend auf deinem Profil",
      show: "Empfehlungen anzeigen",
      hide: "Ausblenden",
      loading: "Kompatibilität wird analysiert...",
      empty: "Derzeit keine Empfehlungen verfügbar.",
      retry: "Erneut versuchen",
      rateLimited: "Zu viele Anfragen, bitte später erneut versuchen.",
      creditsExhausted: "KI-Guthaben ist derzeit aufgebraucht.",
      failed: "Empfehlungen konnten nicht geladen werden.",
      scoreLabel: "Übereinstimmung",
      refresh: "Empfehlungen aktualisieren",
    },
    compat: {
      cta: "Kompatibilität berechnen",
      loading: "...",
      scoreLabel: "Übereinstimmung",
      rateLimited: "Später erneut versuchen",
      creditsExhausted: "Guthaben nicht verfügbar",
      failed: "Berechnung fehlgeschlagen",
    },
    moderation: {
      rejectedText: "Dieser Text wurde abgelehnt, da er gegen die Richtlinien verstößt. Bitte bearbeite ihn.",
      flaggedText: "Gespeichert, wird aber von unserem Team geprüft.",
      rejectedImage: "Dieses Bild wurde abgelehnt und entfernt, da es gegen die Richtlinien verstößt.",
      flaggedImage: "Dieses Foto wird derzeit von unserem Team geprüft.",
    },
  },
  ru: {
    recent: { title: "Недавние поиски", clear: "Очистить" },
    saved: {
      title: "Сохранённые поиски",
      save: "Сохранить этот поиск",
      saving: "Сохранение...",
      saved: "Сохранено",
      delete: "Удалить",
      namePrompt: "Название для этого поиска",
      empty: "Пока нет сохранённых поисков.",
      signInHint: "Войдите, чтобы сохранять поиски.",
    },
    refine: {
      placeholder: "Уточнить по имени или городу...",
      noMatches: "Нет результатов по этому фильтру.",
    },
    ai: {
      title: "Рекомендации ИИ",
      subtitle: "Участники, предложенные на основе вашего профиля",
      show: "Показать рекомендации",
      hide: "Скрыть",
      loading: "Анализ совместимости...",
      empty: "Сейчас нет доступных рекомендаций.",
      retry: "Повторить",
      rateLimited: "Слишком много запросов, попробуйте позже.",
      creditsExhausted: "Кредиты ИИ сейчас исчерпаны.",
      failed: "Не удалось загрузить рекомендации.",
      scoreLabel: "Совпадение",
      refresh: "Обновить рекомендации",
    },
    compat: {
      cta: "Оценить совместимость",
      loading: "...",
      scoreLabel: "Совпадение",
      rateLimited: "Попробуйте позже",
      creditsExhausted: "Кредиты недоступны",
      failed: "Не удалось рассчитать",
    },
    moderation: {
      rejectedText: "Этот текст отклонён за нарушение правил платформы, отредактируйте его.",
      flaggedText: "Сохранено, но находится на проверке нашей командой.",
      rejectedImage: "Это изображение отклонено за нарушение правил платформы и удалено.",
      flaggedImage: "Это фото сейчас проверяется нашей командой.",
    },
  },
};
