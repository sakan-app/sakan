import type { FeatureDictionary } from "@/i18n/feature";

export type ConsentStrings = {
  cookieTitle: string;
  cookieText: string;
  cookieAcceptAll: string;
  cookieEssentialOnly: string;
  cookiePrivacyLink: string;
  /** Mandatory consent shown before the €0.99 featured purchase. */
  purchaseConsentLabel: string;
  purchaseConsentRequired: string;
};

export const consentStrings: FeatureDictionary<ConsentStrings> = {
  ar: {
    cookieTitle: "ملفات تعريف الارتباط",
    cookieText:
      "نستخدم ملفات ضرورية فقط لتشغيل المنصة. لا يتم تفعيل أي تتبّع أو تحليلات اختيارية قبل موافقتك.",
    cookieAcceptAll: "أوافق على الكل",
    cookieEssentialOnly: "الضرورية فقط",
    cookiePrivacyLink: "سياسة الخصوصية",
    purchaseConsentLabel:
      "أوافق على أن تبدأ الخدمة فوراً بعد الدفع، وأقرّ بأن حق الانسحاب يسقط بعد تنفيذ الخدمة بالكامل.",
    purchaseConsentRequired: "يجب الموافقة قبل إتمام الدفع.",
  },
  en: {
    cookieTitle: "Cookies",
    cookieText:
      "We only use cookies that are essential to run the platform. No optional tracking or analytics is activated before you agree.",
    cookieAcceptAll: "Accept all",
    cookieEssentialOnly: "Essential only",
    cookiePrivacyLink: "Privacy policy",
    purchaseConsentLabel:
      "I agree that the service starts immediately after payment and I acknowledge that my right of withdrawal expires once the service has been fully performed.",
    purchaseConsentRequired: "You must agree before completing the payment.",
  },
  de: {
    cookieTitle: "Cookies",
    cookieText:
      "Wir verwenden ausschließlich technisch notwendige Cookies. Optionales Tracking oder Analytics wird erst nach Ihrer Zustimmung aktiviert.",
    cookieAcceptAll: "Alle akzeptieren",
    cookieEssentialOnly: "Nur notwendige",
    cookiePrivacyLink: "Datenschutz",
    purchaseConsentLabel:
      "Ich stimme zu, dass die Leistung sofort nach der Zahlung beginnt, und nehme zur Kenntnis, dass mein Widerrufsrecht mit vollständiger Erbringung der Leistung erlischt.",
    purchaseConsentRequired: "Bitte stimmen Sie vor der Zahlung zu.",
  },
  fr: {
    cookieTitle: "Cookies",
    cookieText:
      "Nous n'utilisons que les cookies strictement nécessaires. Aucun suivi ni analyse optionnels ne sont activés sans votre accord.",
    cookieAcceptAll: "Tout accepter",
    cookieEssentialOnly: "Nécessaires uniquement",
    cookiePrivacyLink: "Confidentialité",
    purchaseConsentLabel:
      "J'accepte que le service commence immédiatement après le paiement et je reconnais que mon droit de rétractation s'éteint une fois le service pleinement exécuté.",
    purchaseConsentRequired: "Vous devez accepter avant de finaliser le paiement.",
  },
};

export const COOKIE_CONSENT_KEY = "sakan.cookie.consent";
export type CookieConsentValue = "all" | "essential";

/** Optional (non-essential) tracking is only allowed after an explicit "all". */
export function optionalCookiesAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "all";
}