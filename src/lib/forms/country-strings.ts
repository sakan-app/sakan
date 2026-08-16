import type { FeatureDictionary } from "@/i18n/feature";

export type CountryFormStrings = {
  other: string;
  customPlaceholder: string;
};

export const countryFormStrings: FeatureDictionary<CountryFormStrings> = {
  ar: { other: "أخرى", customPlaceholder: "يرجى كتابة اسم الدولة" },
  en: { other: "Other", customPlaceholder: "Please type the country name" },
  de: { other: "Andere", customPlaceholder: "Bitte den Ländernamen eingeben" },
  fr: { other: "Autre", customPlaceholder: "Veuillez saisir le nom du pays" },
};