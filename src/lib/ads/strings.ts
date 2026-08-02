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
};

export const adsStrings: FeatureDictionary<AdsStrings> = {
  ar: {
    tickerLabel: "إعلانات مميزة",
    sponsored: "مموّل",
    promoteTitle: "روّج لملفك في الشريط المميز",
    promoteSubtitle: "صورتك تعبر أعلى الصفحة الرئيسية خلال 3 دقائق كاملة لكل دورة.",
    price: "0.99 يورو",
    priceHint: "لكل صورة/إعلان — يعمل 30 يومًا ضمن الدورة.",
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
  },
  en: {
    tickerLabel: "Featured",
    sponsored: "Sponsored",
    promoteTitle: "Promote yourself in the featured ticker",
    promoteSubtitle: "Your image travels across the top of the home page over a full 3 minutes.",
    price: "€0.99",
    priceHint: "Per image/ad — runs in rotation for 30 days.",
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
  },
  de: {
    tickerLabel: "Hervorgehoben",
    sponsored: "Gesponsert",
    promoteTitle: "Wirb im hervorgehobenen Laufband",
    promoteSubtitle: "Dein Bild wandert in 3 Minuten über den Kopf der Startseite.",
    price: "0,99 €",
    priceHint: "Pro Bild/Anzeige — 30 Tage in Rotation.",
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
  },
  ru: {
    tickerLabel: "Рекомендуемое",
    sponsored: "Реклама",
    promoteTitle: "Продвиньте себя в ленте рекомендаций",
    promoteSubtitle: "Ваше изображение проходит по верху главной страницы за 3 минуты.",
    price: "0,99 €",
    priceHint: "За изображение/объявление — 30 дней в ротации.",
    image: "Изображение",
    imageHint: "JPG, PNG или WebP до 5 МБ.",
    headline: "Заголовок",
    subtitle: "Краткое описание",
    link: "Ссылка (необязательно)",
    submit: "Оплатить 0,99 € и опубликовать",
    processing: "Обработка…",
    myAds: "Мои объявления",
    noAds: "Объявлений пока нет.",
    runningUntil: "Работает до",
    impressions: "Показы",
    clicks: "Клики",
    payNow: "Завершить оплату",
    success: "Оплата получена — объявление активно.",
    canceled: "Оплата отменена.",
    testMode: "Тестовый режим — деньги не списаны.",
    error: "Что-то пошло не так. Попробуйте снова.",
    statuses: {
      pending_payment: "Ожидает оплаты",
      pending_review: "На проверке",
      active: "Активно",
      expired: "Завершено",
      rejected: "Отклонено",
    },
  },
};