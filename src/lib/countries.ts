import type { Dictionary } from "@/i18n";

export type CountryCode = keyof Dictionary["countries"];

export const COUNTRY_CODES: CountryCode[] = [
  "DE",
  "FR",
  "AT",
  "CZ",
  "PL",
  "ES",
  "IT",
  "CH",
  "BE",
  "NL",
];

export const COUNTRY_FLAGS: Record<CountryCode, string> = {
  DE: "🇩🇪",
  FR: "🇫🇷",
  AT: "🇦🇹",
  CZ: "🇨🇿",
  PL: "🇵🇱",
  ES: "🇪🇸",
  IT: "🇮🇹",
  CH: "🇨🇭",
  BE: "🇧🇪",
  NL: "🇳🇱",
};

export function isCountryCode(value: string | null | undefined): value is CountryCode {
  return Boolean(value) && (COUNTRY_CODES as string[]).includes(value as string);
}

export function countryLabel(dict: Dictionary, code: string | null | undefined) {
  return isCountryCode(code) ? dict.countries[code] : (code ?? "");
}

export function countryFlag(code: string | null | undefined) {
  return isCountryCode(code) ? COUNTRY_FLAGS[code] : "🏳️";
}