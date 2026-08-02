import { ar, type Dictionary } from "./locales/ar";
import { en } from "./locales/en";
import { de } from "./locales/de";
import { ru } from "./locales/ru";

export const locales = { ar, en, de, ru } as const;
export type Locale = keyof typeof locales;
export type { Dictionary };

export const localeOrder: Locale[] = ["ar", "de", "en", "ru"];
export const defaultLocale: Locale = "ar";

export const localeNames: Record<Locale, string> = {
  ar: locales.ar.meta.name,
  en: locales.en.meta.name,
  de: locales.de.meta.name,
  ru: locales.ru.meta.name,
};

export const localeFlags: Record<Locale, string> = {
  ar: "🇸🇦",
  en: "🇬🇧",
  de: "🇩🇪",
  ru: "🇷🇺",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ar" || value === "en" || value === "de" || value === "ru";
}