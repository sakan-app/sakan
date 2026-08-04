/**
 * Single source of truth for the legally required operator details.
 *
 * German law (§5 DDG / TMG Impressum) requires these to be reachable from
 * every page, so the footer, the Impressum page and the JSON-LD graph all read
 * from here instead of hardcoding strings.
 */
export const COMPANY = {
  legalName: "Akhmed Ismail Saied",
  brand: "SAKAN",
  brandAr: "سَكَن",
  street: "Ehndorfer Str. 130",
  postalCode: "24537",
  city: "Neumünster",
  country: "Deutschland",
  countryCode: "DE",
  website: "https://www.sakanapp.net",
  websiteLabel: "www.sakanapp.net",
  infoEmail: "info@sakanapp.net",
  serviceEmail: "service@sakanapp.net",
  year: 2026,
} as const;

export const COMPANY_ADDRESS_LINES = [
  COMPANY.legalName,
  COMPANY.street,
  `${COMPANY.postalCode} ${COMPANY.city}`,
  COMPANY.country,
];