import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkoutInput = z.object({
  planCode: z.enum(["premium", "premium_plus"]),
  interval: z.enum(["monthly", "annual"]),
  returnUrl: z.string().url().max(500),
});

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(checkoutInput)
  .handler(async ({ data, context }) => {
    const { startCheckout } = await import("./billing.server");
    try {
      return await startCheckout({
        userId: context.userId,
        planCode: data.planCode,
        interval: data.interval,
        returnUrl: data.returnUrl,
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "checkout_failed");
    }
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { cancelAtPeriodEnd } = await import("./billing.server");
    return cancelAtPeriodEnd(context.userId);
  });

export const resumeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resumeSubscription: resume } = await import("./billing.server");
    return resume(context.userId);
  });

/** Refreshes lapsed subscriptions (grace period → expired) for the caller. */
export const refreshBillingState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { sweepExpiries } = await import("./billing.server");
    await sweepExpiries();
    return { ok: true };
  });