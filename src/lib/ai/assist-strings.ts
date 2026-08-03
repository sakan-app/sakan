import type { FeatureDictionary } from "@/i18n/feature";

export type AiAssistStrings = {
  ideas: string;
  loading: string;
  error: string;
  empty: string;
  hide: string;
  bioTitle: string;
  bioAction: string;
  bioApply: string;
  bioDismiss: string;
};

export const aiAssistStrings: FeatureDictionary<AiAssistStrings> = {
  ar: {
    ideas: "اقتراحات ذكية",
    loading: "جارٍ التفكير…",
    error: "تعذّر توليد الاقتراحات الآن",
    empty: "لا توجد اقتراحات",
    hide: "إخفاء",
    bioTitle: "تحسين النبذة بالذكاء الاصطناعي",
    bioAction: "حسّن نبذتي",
    bioApply: "استخدام هذه النبذة",
    bioDismiss: "تجاهل",
  },
  en: {
    ideas: "Smart suggestions",
    loading: "Thinking…",
    error: "Could not generate suggestions right now",
    empty: "No suggestions",
    hide: "Hide",
    bioTitle: "AI bio improvement",
    bioAction: "Improve my bio",
    bioApply: "Use this bio",
    bioDismiss: "Dismiss",
  },
  de: {
    ideas: "Intelligente Vorschläge",
    loading: "Denkt nach…",
    error: "Vorschläge konnten nicht erstellt werden",
    empty: "Keine Vorschläge",
    hide: "Ausblenden",
    bioTitle: "KI-Verbesserung der Beschreibung",
    bioAction: "Beschreibung verbessern",
    bioApply: "Diese Beschreibung übernehmen",
    bioDismiss: "Verwerfen",
  },
  fr: {
    ideas: "Suggestions intelligentes",
    loading: "Réflexion…",
    error: "Impossible de générer des suggestions",
    empty: "Aucune suggestion",
    hide: "Masquer",
    bioTitle: "Amélioration de la bio par IA",
    bioAction: "Améliorer ma bio",
    bioApply: "Utiliser cette bio",
    bioDismiss: "Ignorer",
  },
};
