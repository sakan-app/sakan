import type { FeatureDictionary } from "@/i18n/feature";

export type AdsStrings = {
  tickerLabel: string;
  sponsored: string;
  promoteTitle: string;
  promoteSubtitle: string;
  price: string;
  priceHint: string;
  image: string;
  imageHint: string;
  headline: string;
  subtitle: string;
  link: string;
  submit: string;
  processing: string;
  myAds: string;
  noAds: string;
  runningUntil: string;
  impressions: string;
  clicks: string;
  payNow: string;
  success: string;
  canceled: string;
  testMode: string;
  error: string;
  statuses: Record<string, string>;
  queueTitle: string;
  onAir: string;
  waiting: string;
  queuePosition: string;
  loopsLeft: string;
  timeLeft: string;
  previewTitle: string;
  zoomLabel: string;
  cropHint: string;
  viewProfile: string;
};

export const adsStrings: FeatureDictionary<AdsStrings> = {
  ar: {
    tickerLabel: "إعلانات مميزة",
    sponsored: "مموّل",
    promoteTitle: "روّج لملفك في الشريط المميز",
    promoteSubtitle: "صورتك تعبر أعلى الصفحة الرئيسية خلال 60 ثانية لكل دورة، وتتكرر 5 دورات.",
    price: "0.99 يورو",
    priceHint: "لكل صورة/إعلان — 5 دورات كاملة حسب ترتيب الدفع.",
    image: "صورة الإعلان",
    imageHint: "JPG أو PNG أو WebP بحد أقصى 5 ميغابايت.",
    headline: "العنوان",
    subtitle: "وصف مختصر",
    link: "رابط (اختياري)",
    submit: "ادفع 0.99 يورو وانشر",
    processing: "جارٍ المعالجة…",
    myAds: "إعلاناتي",
    noAds: "لا توجد إعلانات بعد.",
    runningUntil: "يعمل حتى",
    impressions: "ظهور",
    clicks: "نقرات",
    payNow: "أكمل الدفع",
    success: "تم الدفع، إعلانك يعمل الآن.",
    canceled: "تم إلغاء الدفع.",
    testMode: "وضع تجريبي — لم يتم خصم أي مبلغ.",
    error: "تعذّر إتمام العملية. حاول مرة أخرى.",
    statuses: {
      pending_payment: "بانتظار الدفع",
      pending_review: "قيد المراجعة",
      active: "نشط",
      expired: "منتهٍ",
      rejected: "مرفوض",
    },
    queueTitle: "قائمة الانتظار",
    onAir: "يُعرض الآن",
    waiting: "في الانتظار",
    queuePosition: "الترتيب",
    loopsLeft: "دورات متبقية",
    timeLeft: "الوقت المتبقي",
    previewTitle: "معاينة الصورة",
    zoomLabel: "التكبير",
    cropHint: "اسحب الصورة لضبط الإطار، واستخدم الشريط للتكبير.",
    viewProfile: "عرض الملف",
  },
  en: {
    tickerLabel: "Featured",
    sponsored: "Sponsored",
    promoteTitle: "Promote yourself in the featured ticker",
    promoteSubtitle: "Your image travels across the top of the home page in 60 seconds, five times.",
    price: "€0.99",
    priceHint: "Per image/ad — five full loops, in payment order.",
    image: "Ad image",
    imageHint: "JPG, PNG or WebP up to 5 MB.",
    headline: "Headline",
    subtitle: "Short description",
    link: "Link (optional)",
    submit: "Pay €0.99 and publish",
    processing: "Processing…",
    myAds: "My ads",
    noAds: "No ads yet.",
    runningUntil: "Running until",
    impressions: "Impressions",
    clicks: "Clicks",
    payNow: "Complete payment",
    success: "Payment received — your ad is live.",
    canceled: "Payment canceled.",
    testMode: "Test mode — no money was charged.",
    error: "Something went wrong. Please try again.",
    statuses: {
      pending_payment: "Awaiting payment",
      pending_review: "In review",
      active: "Active",
      expired: "Expired",
      rejected: "Rejected",
    },
    queueTitle: "Queue",
    onAir: "On air",
    waiting: "Waiting",
    queuePosition: "Position",
    loopsLeft: "Loops left",
    timeLeft: "Time left",
    previewTitle: "Image preview",
    zoomLabel: "Zoom",
    cropHint: "Drag the image to reframe it and use the slider to zoom.",
    viewProfile: "View profile",
  },
  de: {
    tickerLabel: "Hervorgehoben",
    sponsored: "Gesponsert",
    promoteTitle: "Wirb im hervorgehobenen Laufband",
    promoteSubtitle: "Dein Bild wandert in 60 Sekunden über die Startseite — fünf Durchläufe.",
    price: "0,99 €",
    priceHint: "Pro Bild/Anzeige — fünf komplette Durchläufe in Zahlungsreihenfolge.",
    image: "Anzeigenbild",
    imageHint: "JPG, PNG oder WebP bis 5 MB.",
    headline: "Überschrift",
    subtitle: "Kurzbeschreibung",
    link: "Link (optional)",
    submit: "0,99 € zahlen und veröffentlichen",
    processing: "Wird verarbeitet…",
    myAds: "Meine Anzeigen",
    noAds: "Noch keine Anzeigen.",
    runningUntil: "Läuft bis",
    impressions: "Impressionen",
    clicks: "Klicks",
    payNow: "Zahlung abschließen",
    success: "Zahlung erhalten — deine Anzeige läuft.",
    canceled: "Zahlung abgebrochen.",
    testMode: "Testmodus — es wurde nichts abgebucht.",
    error: "Etwas ist schiefgelaufen. Bitte erneut versuchen.",
    statuses: {
      pending_payment: "Zahlung ausstehend",
      pending_review: "In Prüfung",
      active: "Aktiv",
      expired: "Abgelaufen",
      rejected: "Abgelehnt",
    },
    queueTitle: "Warteschlange",
    onAir: "Läuft gerade",
    waiting: "Wartet",
    queuePosition: "Position",
    loopsLeft: "Verbleibende Durchläufe",
    timeLeft: "Restzeit",
    previewTitle: "Bildvorschau",
    zoomLabel: "Zoom",
    cropHint: "Ziehe das Bild zum Ausrichten und zoome mit dem Regler.",
    viewProfile: "Profil ansehen",
  },
  fr: {
    tickerLabel: "En vedette",
    sponsored: "Sponsorisé",
    promoteTitle: "Mettez-vous en avant dans le bandeau vedette",
    promoteSubtitle: "Votre image défile en haut de la page d'accueil en 60 secondes, cinq fois.",
    price: "0,99 €",
    priceHint: "Par image/annonce — cinq passages complets, par ordre de paiement.",
    image: "Image de l'annonce",
    imageHint: "JPG, PNG ou WebP jusqu'à 5 Mo.",
    headline: "Titre",
    subtitle: "Description courte",
    link: "Lien (facultatif)",
    submit: "Payer 0,99 € et publier",
    processing: "Traitement en cours…",
    myAds: "Mes annonces",
    noAds: "Aucune annonce pour l'instant.",
    runningUntil: "En cours jusqu'au",
    impressions: "Impressions",
    clicks: "Clics",
    payNow: "Terminer le paiement",
    success: "Paiement reçu — votre annonce est en ligne.",
    canceled: "Paiement annulé.",
    testMode: "Mode test — aucun montant n'a été débité.",
    error: "Une erreur s'est produite. Veuillez réessayer.",
    statuses: {
      pending_payment: "En attente de paiement",
      pending_review: "En cours de vérification",
      active: "Actif",
      expired: "Expiré",
      rejected: "Rejeté",
    },
    queueTitle: "File d'attente",
    onAir: "À l'antenne",
    waiting: "En attente",
    queuePosition: "Position",
    loopsLeft: "Passages restants",
    timeLeft: "Temps restant",
    previewTitle: "Aperçu de l'image",
    zoomLabel: "Zoom",
    cropHint: "Faites glisser l'image pour la recadrer et zoomez avec le curseur.",
    viewProfile: "Voir le profil",
  },
};
