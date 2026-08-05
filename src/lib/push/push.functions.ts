/**
 * Server functions for push subscription management.
 * All of them require an authenticated caller.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const subscriptionInput = z.object({
  endpoint: z.string().url().max(1000),
  p256dh: z.string().min(1).max(500),
  auth: z.string().min(1).max(500),
  expirationTime: z.number().nullable().optional(),
  userAgent: z.string().max(500).optional(),
  locale: z.string().max(10).optional(),
});

/** Upserts the caller's device subscription (endpoint is unique). */
export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(subscriptionInput)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        expiration_time: data.expirationTime
          ? new Date(data.expirationTime).toISOString()
          : null,
        user_agent: data.userAgent ?? null,
        locale: data.locale ?? null,
        failure_count: 0,
        disabled_at: null,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Removes one endpoint (called on unsubscribe or rotation). */
export const deletePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ endpoint: z.string().url().max(1000) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", data.endpoint)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Server-side push status + the public VAPID key for the browser. */
export const getPushConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { vapidConfigured } = await import("./webpush.server");
    const { count } = await context.supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .is("disabled_at", null);
    return {
      configured: vapidConfigured(),
      publicKey: process.env["VAPID_PUBLIC_KEY"] ?? null,
      devices: count ?? 0,
    };
  });

/** Sends a push to the caller's own devices (used by Settings → Test). */
export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { sendPushToUser } = await import("./webpush.server");
    return sendPushToUser(context.userId, {
      title: "سَكَن",
      body: "الإشعارات الفورية مفعّلة على هذا الجهاز.",
      url: "/notifications",
      tag: "sakan-test",
      kind: "system",
    });
  });
