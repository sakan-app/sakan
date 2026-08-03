import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { billingKeys } from "@/lib/billing/queries";

/**
 * Keeps account-level state live: subscription changes (checkout, renewal,
 * cancellation, expiry), the member's own verification request status and the
 * featured banner queue. One channel per signed-in user; no-ops while signed
 * out and tears the channel down on unmount, so no duplicate listeners.
 */
export function useAccountRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    const invalidateBilling = () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscription(userId) });
      void queryClient.invalidateQueries({ queryKey: billingKeys.invoices(userId) });
      void queryClient.invalidateQueries({ queryKey: billingKeys.events(userId) });
    };

    const channel = supabase
      .channel(`account-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        invalidateBilling,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${userId}` },
        invalidateBilling,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "verification_requests",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["profile", userId] });
          void queryClient.invalidateQueries({ queryKey: ["verification", userId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "featured_ads" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["featured-ads"] });
      })
      .subscribe();

    return () => void supabase.removeChannel(channel);
  }, [user?.id, queryClient]);
}