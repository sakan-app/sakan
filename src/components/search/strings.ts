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
  fr: {
    recent: { title: "Recherches récentes", clear: "Effacer" },
    saved: {
      title: "Recherches enregistrées",
      save: "Enregistrer cette recherche",
      saving: "Enregistrement...",
      saved: "Enregistré",
      delete: "Supprimer",
      namePrompt: "Nom de cette recherche",
      empty: "Aucune recherche enregistrée pour l'instant.",
      signInHint: "Connectez-vous pour enregistrer vos recherches.",
    },
    refine: {
      placeholder: "Affiner par nom ou ville...",
      noMatches: "Aucun résultat pour ce filtre.",
    },
    ai: {
      title: "Recommandations IA",
      subtitle: "Membres suggérés selon votre profil",
      show: "Afficher les recommandations",
      hide: "Masquer",
      loading: "Analyse de la compatibilité...",
      empty: "Aucune recommandation disponible pour le moment.",
      retry: "Réessayer",
      rateLimited: "Trop de requêtes, réessayez plus tard.",
      creditsExhausted: "Les crédits IA sont actuellement épuisés.",
      failed: "Impossible de charger les recommandations.",
      scoreLabel: "Compatibilité",
      refresh: "Actualiser les recommandations",
    },
    compat: {
      cta: "Évaluer la compatibilité",
      loading: "...",
      scoreLabel: "Compatibilité",
      rateLimited: "Réessayez plus tard",
      creditsExhausted: "Crédits indisponibles",
      failed: "Échec du calcul",
    },
    moderation: {
      rejectedText: "Ce texte a été refusé car il enfreint les règles de la plateforme, veuillez le modifier.",
      flaggedText: "Enregistré, mais en cours de vérification par notre équipe.",
      rejectedImage: "Cette image a été refusée et supprimée car elle enfreint les règles de la plateforme.",
      flaggedImage: "Cette photo est en cours de vérification par notre équipe.",
    },
  },
};
