import { ar, type Dictionary } from "./locales/ar";
import { en } from "./locales/en";
import { de } from "./locales/de";
import { fr } from "./locales/fr";

export const locales = { ar, en, de, fr } as const;
export type Locale = keyof typeof locales;
export type { Dictionary };

export const localeOrder: Locale[] = ["ar", "de", "en", "fr"];
export const defaultLocale: Locale = "ar";

export const localeNames: Record<Locale, string> = {
  ar: locales.ar.meta.name,
  en: locales.en.meta.name,
  de: locales.de.meta.name,
  fr: locales.fr.meta.name,
};

export const localeFlags: Record<Locale, string> = {
  ar: "🇸🇦",
  en: "🇬🇧",
  de: "🇩🇪",
  fr: "🇫🇷",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ar" || value === "en" || value === "de" || value === "fr";
}
