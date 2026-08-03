import type { FeatureDictionary } from "@/i18n/feature";

export type WallpaperStrings = {
  title: string;
  subtitle: string;
  close: string;
  builtIn: string;
  custom: string;
  effects: string;
  opacity: string;
  blur: string;
  brightness: string;
  overlay: string;
  preview: string;
  previewIncoming: string;
  previewOutgoing: string;
  applyGlobal: string;
  applyConversation: string;
  scopeLabel: string;
  scopeGlobal: string;
  scopeConversation: string;
  save: string;
  saving: string;
  saved: string;
  saveFailed: string;
  reset: string;
  resetDone: string;
  premiumBadge: string;
  premiumLocked: string;
  upload: string;
  uploading: string;
  uploadHint: string;
  uploadTypeError: string;
  uploadSizeError: string;
  uploadFailed: string;
  moderationRejected: string;
  removeCustom: string;
  noWallpaper: string;
  readabilityNote: string;
  changeWallpaper: string;
};

const en: WallpaperStrings = {
  title: "Chat wallpaper",
  subtitle: "Personalise how your conversations look.",
  close: "Close",
  builtIn: "Gallery",
  custom: "My image",
  effects: "Effects",
  opacity: "Opacity",
  blur: "Blur",
  brightness: "Brightness",
  overlay: "Dark overlay",
  preview: "Preview",
  previewIncoming: "How does this look?",
  previewOutgoing: "Beautiful, ما شاء الله",
  applyGlobal: "Apply to all chats",
  applyConversation: "Apply to this chat only",
  scopeLabel: "Apply to",
  scopeGlobal: "All chats",
  scopeConversation: "This chat",
  save: "Save wallpaper",
  saving: "Saving…",
  saved: "Wallpaper updated",
  saveFailed: "Could not save the wallpaper",
  reset: "Reset to default",
  resetDone: "Wallpaper reset",
  premiumBadge: "Premium",
  premiumLocked: "This wallpaper is part of Premium.",
  upload: "Upload image",
  uploading: "Uploading…",
  uploadHint: "JPG, PNG or WEBP · up to 10 MB · optimised automatically",
  uploadTypeError: "Only JPG, PNG or WEBP images are allowed",
  uploadSizeError: "The image must be smaller than 10 MB",
  uploadFailed: "Upload failed, please try again",
  moderationRejected: "This image does not meet our content rules",
  removeCustom: "Remove image",
  noWallpaper: "No wallpaper",
  readabilityNote: "Readability is protected automatically — messages always stay legible.",
  changeWallpaper: "Change wallpaper",
};

const ar: WallpaperStrings = {
  title: "خلفية المحادثة",
  subtitle: "خصّص شكل محادثاتك كما يعجبك.",
  close: "إغلاق",
  builtIn: "المعرض",
  custom: "صورتي",
  effects: "التأثيرات",
  opacity: "الشفافية",
  blur: "الضباب",
  brightness: "السطوع",
  overlay: "التعتيم",
  preview: "معاينة",
  previewIncoming: "ما رأيك بهذا الشكل؟",
  previewOutgoing: "جميل ما شاء الله",
  applyGlobal: "تطبيق على كل المحادثات",
  applyConversation: "تطبيق على هذه المحادثة فقط",
  scopeLabel: "التطبيق على",
  scopeGlobal: "كل المحادثات",
  scopeConversation: "هذه المحادثة",
  save: "حفظ الخلفية",
  saving: "جارٍ الحفظ…",
  saved: "تم تحديث الخلفية",
  saveFailed: "تعذّر حفظ الخلفية",
  reset: "استعادة الافتراضي",
  resetDone: "تمت استعادة الخلفية",
  premiumBadge: "بريميوم",
  premiumLocked: "هذه الخلفية ضمن باقة بريميوم.",
  upload: "رفع صورة",
  uploading: "جارٍ الرفع…",
  uploadHint: "JPG أو PNG أو WEBP · حتى 10 ميغابايت · تحسين تلقائي",
  uploadTypeError: "يُسمح فقط بصور JPG أو PNG أو WEBP",
  uploadSizeError: "يجب أن يكون حجم الصورة أقل من 10 ميغابايت",
  uploadFailed: "فشل الرفع، حاول مرة أخرى",
  moderationRejected: "هذه الصورة لا تتوافق مع سياسة المحتوى",
  removeCustom: "إزالة الصورة",
  noWallpaper: "بدون خلفية",
  readabilityNote: "وضوح النص محميّ تلقائيًا — تبقى الرسائل مقروءة دائمًا.",
  changeWallpaper: "تغيير الخلفية",
};

const de: WallpaperStrings = {
  title: "Chat-Hintergrund",
  subtitle: "Gestalte das Aussehen deiner Unterhaltungen.",
  close: "Schließen",
  builtIn: "Galerie",
  custom: "Mein Bild",
  effects: "Effekte",
  opacity: "Deckkraft",
  blur: "Unschärfe",
  brightness: "Helligkeit",
  overlay: "Dunkle Ebene",
  preview: "Vorschau",
  previewIncoming: "Wie sieht das aus?",
  previewOutgoing: "Sehr schön, maschallah",
  applyGlobal: "Für alle Chats übernehmen",
  applyConversation: "Nur für diesen Chat",
  scopeLabel: "Anwenden auf",
  scopeGlobal: "Alle Chats",
  scopeConversation: "Diesen Chat",
  save: "Hintergrund speichern",
  saving: "Wird gespeichert…",
  saved: "Hintergrund aktualisiert",
  saveFailed: "Hintergrund konnte nicht gespeichert werden",
  reset: "Auf Standard zurücksetzen",
  resetDone: "Hintergrund zurückgesetzt",
  premiumBadge: "Premium",
  premiumLocked: "Dieser Hintergrund gehört zu Premium.",
  upload: "Bild hochladen",
  uploading: "Wird hochgeladen…",
  uploadHint: "JPG, PNG oder WEBP · bis 10 MB · automatisch optimiert",
  uploadTypeError: "Nur JPG-, PNG- oder WEBP-Bilder sind erlaubt",
  uploadSizeError: "Das Bild muss kleiner als 10 MB sein",
  uploadFailed: "Upload fehlgeschlagen, bitte erneut versuchen",
  moderationRejected: "Dieses Bild entspricht nicht unseren Inhaltsregeln",
  removeCustom: "Bild entfernen",
  noWallpaper: "Kein Hintergrund",
  readabilityNote: "Die Lesbarkeit wird automatisch geschützt — Nachrichten bleiben immer lesbar.",
  changeWallpaper: "Hintergrund ändern",
};

const fr: WallpaperStrings = {
  title: "Fond de discussion",
  subtitle: "Personnalisez l'apparence de vos conversations.",
  close: "Fermer",
  builtIn: "Galerie",
  custom: "Mon image",
  effects: "Effets",
  opacity: "Opacité",
  blur: "Flou",
  brightness: "Luminosité",
  overlay: "Assombrissement",
  preview: "Aperçu",
  previewIncoming: "Ce rendu vous plaît ?",
  previewOutgoing: "Magnifique, mâcha Allah",
  applyGlobal: "Appliquer à toutes les discussions",
  applyConversation: "Uniquement cette discussion",
  scopeLabel: "Appliquer à",
  scopeGlobal: "Toutes les discussions",
  scopeConversation: "Cette discussion",
  save: "Enregistrer le fond",
  saving: "Enregistrement…",
  saved: "Fond mis à jour",
  saveFailed: "Échec de l'enregistrement du fond",
  reset: "Réinitialiser par défaut",
  resetDone: "Fond réinitialisé",
  premiumBadge: "Premium",
  premiumLocked: "Ce fond est réservé aux membres Premium.",
  upload: "Téléverser une image",
  uploading: "Téléversement…",
  uploadHint: "JPG, PNG ou WEBP · jusqu'à 10 Mo · optimisation automatique",
  uploadTypeError: "Seuls les formats JPG, PNG ou WEBP sont autorisés",
  uploadSizeError: "L'image doit faire moins de 10 Mo",
  uploadFailed: "Échec du téléversement, veuillez réessayer",
  moderationRejected: "Cette image ne respecte pas nos règles de contenu",
  removeCustom: "Supprimer l'image",
  noWallpaper: "Aucun fond",
  readabilityNote: "La lisibilité est protégée automatiquement — les messages restent toujours lisibles.",
  changeWallpaper: "Changer le fond",
};

export const wallpaperStrings: FeatureDictionary<WallpaperStrings> = { ar, en, de, fr };
