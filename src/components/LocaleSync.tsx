import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useAuth } from "@/hooks/useAuth";
import { isLocale, type Locale } from "@/i18n";
import { useI18n } from "@/lib/i18n";
import { myProfileQuery, updateMyProfile } from "@/lib/profile-queries";

/**
 * Keeps the interface language in sync with `profiles.preferred_language`:
 * restores it after login, and persists any later change made by the user.
 */
export function LocaleSync() {
  const { user } = useAuth();
  const { locale, setLocale } = useI18n();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";
  const profileQ = useQuery({ ...myProfileQuery(userId), enabled: Boolean(userId) });
  const restored = useRef<string | null>(null);

  const persist = useMutation({
    mutationFn: (next: Locale) => updateMyProfile(userId, { preferred_language: next }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  const stored = profileQ.data?.preferred_language;

  useEffect(() => {
    if (!userId || !stored) return;
    if (restored.current === userId) return;
    restored.current = userId;
    if (isLocale(stored) && stored !== locale) setLocale(stored);
  }, [userId, stored, locale, setLocale]);

  useEffect(() => {
    if (!userId || !stored) return;
    if (restored.current !== userId) return;
    if (stored === locale || persist.isPending) return;
    persist.mutate(locale);
    // `persist` is a stable mutation object from TanStack Query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, stored, userId]);

  return null;
}
