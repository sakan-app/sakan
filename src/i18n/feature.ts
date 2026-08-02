import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/i18n";

/**
 * Feature-scoped dictionaries.
 *
 * Phase 3 features keep their own strings next to the feature instead of
 * growing the four global locale files. Define a `Record<Locale, T>` and read
 * it with `useFeatureStrings`.
 */
export type FeatureDictionary<T> = Record<Locale, T>;

export function useFeatureStrings<T>(dictionary: FeatureDictionary<T>): T {
  const { locale } = useI18n();
  return dictionary[locale];
}