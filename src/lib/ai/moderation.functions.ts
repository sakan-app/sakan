import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  runTextModeration,
  runImageModeration,
  persistModerationFlag,
  gatewayErrorToMessage,
  type ModerationResult,
} from "@/lib/ai/moderation-helpers.server";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit.server";

const AI_LIMIT = 40;
const AI_WINDOW_MS = 60_000;

const moderateTextInput = z.object({
  text: z.string().min(1).max(4000),
  subject: z.enum(["message", "bio", "name", "other"]),
});

export const moderateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(moderateTextInput)
  .handler(async ({ data, context }): Promise<ModerationResult> => {
    try {
      await enforceRateLimit(`ai:${context.userId}`, AI_LIMIT, AI_WINDOW_MS);
      const result = await runTextModeration(data.text, data.subject);
      await persistModerationFlag({
        userId: context.userId,
        subjectType: data.subject,
        result,
        excerpt: data.text.slice(0, 280),
      });
      return result;
    } catch (error) {
      if (error instanceof RateLimitError) throw error;
      throw new Error(gatewayErrorToMessage(error));
    }
  });

const moderateImageInput = z.object({
  storagePath: z.string().min(1).max(500),
  bucket: z.enum(["avatars", "gallery", "verification", "wallpapers"]),
});

export const moderateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(moderateImageInput)
  .handler(async ({ data, context }): Promise<ModerationResult> => {
    try {
      await enforceRateLimit(`ai:${context.userId}`, AI_LIMIT, AI_WINDOW_MS);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed, error } = await supabaseAdmin.storage
        .from(data.bucket)
        .createSignedUrl(data.storagePath, 300);
      if (error || !signed?.signedUrl) throw new Error("failed");

      const result = await runImageModeration(signed.signedUrl);
      await persistModerationFlag({
        userId: context.userId,
        subjectType: data.bucket === "avatars" ? "avatar" : "gallery",
        subjectId: null,
        result,
        excerpt: data.storagePath,
      });
      return result;
    } catch (error) {
      if (error instanceof RateLimitError) throw error;
      throw new Error(gatewayErrorToMessage(error));
    }
  });
