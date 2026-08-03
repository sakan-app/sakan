import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit.server";
import type { CallGrant } from "./types";

/** Places a call. Entitlement (Premium / Premium Plus) is enforced server-side. */
export const startCallFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      conversationId: z.string().uuid(),
      kind: z.enum(["voice", "video"]),
    }),
  )
  .handler(async ({ data, context }): Promise<CallGrant> => {
    const { startCall } = await import("./calls.server");
    try {
      await enforceRateLimit(`call_start:${context.userId}`, 20, 10 * 60_000);
    } catch (error) {
      if (error instanceof RateLimitError) throw error;
    }
    return startCall({
      callerId: context.userId,
      conversationId: data.conversationId,
      kind: data.kind,
    });
  });

export const answerCallFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ callId: z.string().uuid() }))
  .handler(async ({ data, context }): Promise<CallGrant> => {
    const { answerCall } = await import("./calls.server");
    return answerCall(data.callId, context.userId);
  });

export const closeCallFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      callId: z.string().uuid(),
      status: z.enum(["rejected", "missed", "ended", "failed", "busy"]),
      reason: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { closeCall } = await import("./calls.server");
    return closeCall({
      callId: data.callId,
      userId: context.userId,
      status: data.status,
      reason: data.reason,
    });
  });

/** Server-authoritative answer to "may I see the call buttons at all". */
export const callEntitlementsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ voice: boolean; video: boolean; planCode: string }> => {
    const { serverLimits } = await import("./calls.server");
    const limits = await serverLimits(context.userId);
    return {
      voice: Boolean(limits.voice_calls),
      video: Boolean(limits.video_calls),
      planCode: limits.planCode,
    };
  });