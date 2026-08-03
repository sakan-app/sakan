/**
 * Install analytics. Deliberately unauthenticated: `beforeinstallprompt` and
 * `appinstalled` fire for signed-out visitors too. The handler writes with the
 * service role because `pwa_install_events` is admin-read-only, and it is rate
 * limited so the endpoint cannot be used to flood the table.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const installEventInput = z.object({
  eventType: z.enum(["prompt_shown", "accepted", "dismissed", "installed", "uninstalled"]),
  platform: z.string().max(60).optional(),
  locale: z.string().max(10).optional(),
});

export const recordInstallEvent = createServerFn({ method: "POST" })
  .validator(installEventInput)
  .handler(async ({ data }) => {
    const { enforceRateLimit } = await import("@/lib/rate-limit.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      await enforceRateLimit(`pwa_install:${data.eventType}`, 600, 60_000);
      await supabaseAdmin.from("pwa_install_events").insert({
        event_type: data.eventType,
        platform: data.platform ?? null,
        locale: data.locale ?? null,
      });
    } catch {
      // analytics must never break the install flow
    }
    return { ok: true };
  });