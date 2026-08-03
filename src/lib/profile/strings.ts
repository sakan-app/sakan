import type { FeatureDictionary } from "@/i18n/feature";
import type { AvatarBorder, PresenceStatus, ProfileTheme, StrengthKey } from "./appearance";

export type ProfileStudioStrings = {
  title: string;
  subtitle: string;
  open: string;
  save: string;
  saving: string;
  saved: string;
  reset: string;
  preview: string;
  cover: string;
  coverHint: string;
  coverUpload: string;
  coverRemove: string;
  coverErrorType: string;
  coverErrorSize: string;
  accent: string;
  accentHint: string;
  theme: string;
  themes: Record<ProfileTheme, string>;
  glass: string;
  glassHint: string;
  border: string;
  borders: Record<AvatarBorder, string>;
  strength: string;
  strengthHint: string;
  strengthItems: Record<StrengthKey, string>;
  presence: string;
  presenceHint: string;
  statuses: Record<PresenceStatus, string>;
  hideLastSeen: string;
  hideLastSeenHint: string;
  hideTyping: string;
  hideTypingHint: string;
};

export const profileStudioStrings: FeatureDictionary<ProfileStudioStrings> = {
  ar: {
    title: "استوديو الملف الشخصي",
    subtitle: "خصّص مظهر ملفك وحالتك بالكامل",
    open: "تخصيص المظهر",
    save: "حفظ التغييرات",
    saving: "جارٍ الحفظ…",
    saved: "تم حفظ التخصيص",
    reset: "استعادة الافتراضي",
    preview: "معاينة حية",
    cover: "صورة الغلاف",
    coverHint: "أفضل مقاس 1600×600 بكسل",
    coverUpload: "رفع غلاف",
    coverRemove: "إزالة الغلاف",
    coverErrorType: "الصيغة غير مدعومة (JPG, PNG, WEBP)",
    coverErrorSize: "الحجم أكبر من 8 ميغابايت",
    accent: "اللون المميز",
    accentHint: "يظهر في الأزرار والحدود والتفاصيل",
    theme: "سِمة الملف",
    themes: { navy: "كحلي", aurora: "شفق", sand: "رملي", emerald: "زمردي", rose: "وردي", midnight: "منتصف الليل" },
    glass: "شدة الزجاج",
    glassHint: "درجة الشفافية والضبابية",
    border: "إطار الصورة",
    borders: { none: "بدون", gold: "ذهبي", glow: "توهج", gradient: "متدرج", verified: "موثّق" },
    strength: "قوة الملف",
    strengthHint: "أكمل العناصر لرفع ظهورك في البحث",
    strengthItems: {
      avatar: "صورة شخصية",
      cover: "صورة غلاف",
      bio: "نبذة مفصّلة",
      interests: "٣ اهتمامات أو أكثر",
      details: "العمل والتعليم",
      languages: "اللغات",
      verified: "توثيق الحساب",
    },
    presence: "الحضور والخصوصية",
    presenceHint: "تحكّم بما يراه الآخرون عنك",
    statuses: { online: "متصل", away: "بعيد", busy: "مشغول", dnd: "عدم الإزعاج", invisible: "متخفٍّ" },
    hideLastSeen: "إخفاء آخر ظهور",
    hideLastSeenHint: "لن يرى الأعضاء وقت آخر تواجد لك",
    hideTyping: "إخفاء مؤشر الكتابة",
    hideTypingHint: "لن يظهر «يكتب الآن» في محادثاتك",
  },
  en: {
    title: "Profile studio",
    subtitle: "Personalize how your profile looks and how you appear",
    open: "Customize appearance",
    save: "Save changes",
    saving: "Saving…",
    saved: "Appearance saved",
    reset: "Reset to default",
    preview: "Live preview",
    cover: "Cover photo",
    coverHint: "Best at 1600×600 pixels",
    coverUpload: "Upload cover",
    coverRemove: "Remove cover",
    coverErrorType: "Unsupported format (JPG, PNG, WEBP)",
    coverErrorSize: "File is larger than 8 MB",
    accent: "Accent color",
    accentHint: "Used across buttons, borders and details",
    theme: "Profile theme",
    themes: { navy: "Navy", aurora: "Aurora", sand: "Sand", emerald: "Emerald", rose: "Rose", midnight: "Midnight" },
    glass: "Glass intensity",
    glassHint: "Transparency and blur level",
    border: "Avatar border",
    borders: { none: "None", gold: "Gold", glow: "Glow", gradient: "Gradient", verified: "Verified" },
    strength: "Profile strength",
    strengthHint: "Complete these to rank higher in search",
    strengthItems: {
      avatar: "Profile photo",
      cover: "Cover photo",
      bio: "Detailed bio",
      interests: "3+ interests",
      details: "Work and education",
      languages: "Languages",
      verified: "Verified account",
    },
    presence: "Presence & privacy",
    presenceHint: "Control what other members can see",
    statuses: { online: "Online", away: "Away", busy: "Busy", dnd: "Do not disturb", invisible: "Invisible" },
    hideLastSeen: "Hide last seen",
    hideLastSeenHint: "Members won't see when you were last active",
    hideTyping: "Hide typing indicator",
    hideTypingHint: "\"Typing…\" won't appear in your chats",
  },
  de: {
    title: "Profil-Studio",
    subtitle: "Gestalte dein Profil und deine Sichtbarkeit",
    open: "Aussehen anpassen",
    save: "Änderungen speichern",
    saving: "Wird gespeichert…",
    saved: "Aussehen gespeichert",
    reset: "Zurücksetzen",
    preview: "Live-Vorschau",
    cover: "Titelbild",
    coverHint: "Optimal 1600×600 Pixel",
    coverUpload: "Titelbild hochladen",
    coverRemove: "Titelbild entfernen",
    coverErrorType: "Format nicht unterstützt (JPG, PNG, WEBP)",
    coverErrorSize: "Datei größer als 8 MB",
    accent: "Akzentfarbe",
    accentHint: "Für Buttons, Ränder und Details",
    theme: "Profil-Thema",
    themes: { navy: "Navy", aurora: "Aurora", sand: "Sand", emerald: "Smaragd", rose: "Rosé", midnight: "Mitternacht" },
    glass: "Glas-Intensität",
    glassHint: "Transparenz und Unschärfe",
    border: "Avatar-Rahmen",
    borders: { none: "Ohne", gold: "Gold", glow: "Leuchten", gradient: "Verlauf", verified: "Verifiziert" },
    strength: "Profilstärke",
    strengthHint: "Vervollständige diese Punkte für bessere Sichtbarkeit",
    strengthItems: {
      avatar: "Profilbild",
      cover: "Titelbild",
      bio: "Ausführliche Bio",
      interests: "3+ Interessen",
      details: "Beruf und Bildung",
      languages: "Sprachen",
      verified: "Verifiziertes Konto",
    },
    presence: "Präsenz & Privatsphäre",
    presenceHint: "Steuere, was andere sehen",
    statuses: { online: "Online", away: "Abwesend", busy: "Beschäftigt", dnd: "Nicht stören", invisible: "Unsichtbar" },
    hideLastSeen: "Zuletzt online verbergen",
    hideLastSeenHint: "Andere sehen deine letzte Aktivität nicht",
    hideTyping: "Tippanzeige verbergen",
    hideTypingHint: "„Schreibt…“ erscheint nicht in deinen Chats",
  },
  fr: {
    title: "Studio du profil",
    subtitle: "Personnalisez l'apparence de votre profil et votre visibilité",
    open: "Personnaliser l'apparence",
    save: "Enregistrer",
    saving: "Enregistrement…",
    saved: "Apparence enregistrée",
    reset: "Réinitialiser",
    preview: "Aperçu en direct",
    cover: "Photo de couverture",
    coverHint: "Idéal en 1600×600 pixels",
    coverUpload: "Importer une couverture",
    coverRemove: "Supprimer la couverture",
    coverErrorType: "Format non pris en charge (JPG, PNG, WEBP)",
    coverErrorSize: "Fichier supérieur à 8 Mo",
    accent: "Couleur d'accent",
    accentHint: "Utilisée pour les boutons, bordures et détails",
    theme: "Thème du profil",
    themes: { navy: "Marine", aurora: "Aurore", sand: "Sable", emerald: "Émeraude", rose: "Rose", midnight: "Minuit" },
    glass: "Intensité du verre",
    glassHint: "Niveau de transparence et de flou",
    border: "Bordure d'avatar",
    borders: { none: "Aucune", gold: "Or", glow: "Halo", gradient: "Dégradé", verified: "Vérifié" },
    strength: "Force du profil",
    strengthHint: "Complétez ces éléments pour mieux apparaître",
    strengthItems: {
      avatar: "Photo de profil",
      cover: "Photo de couverture",
      bio: "Bio détaillée",
      interests: "3 centres d'intérêt ou plus",
      details: "Travail et études",
      languages: "Langues",
      verified: "Compte vérifié",
    },
    presence: "Présence et confidentialité",
    presenceHint: "Contrôlez ce que voient les autres membres",
    statuses: { online: "En ligne", away: "Absent", busy: "Occupé", dnd: "Ne pas déranger", invisible: "Invisible" },
    hideLastSeen: "Masquer la dernière connexion",
    hideLastSeenHint: "Les membres ne verront pas votre dernière activité",
    hideTyping: "Masquer l'indicateur de saisie",
    hideTypingHint: "« En train d'écrire… » n'apparaîtra plus",
  },
};
