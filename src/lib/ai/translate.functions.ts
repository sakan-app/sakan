import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion, parseJsonContent, GatewayError } from "@/lib/ai/gateway.server";
import { buildTranslateMessages, translateSchema } from "@/lib/ai/prompts";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit.server";

const translateInput = z.object({
  text: z.string().min(1).max(4000),
  targetLanguage: z.enum(["ar", "en", "de", "fr"]),
});

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(translateInput)
  .handler(async ({ data, context }): Promise<{ text: string }> => {
    try {
      await enforceRateLimit(`ai:${context.userId}`, 40, 60_000);
      const { content } = await chatCompletion({
        messages: buildTranslateMessages(data.text, data.targetLanguage),
        jsonSchema: translateSchema,
      });
      const parsed = parseJsonContent<{ text: string }>(content);
      if (!parsed || typeof parsed.text !== "string") {
        throw new GatewayError("failed", "Could not parse translation response.");
      }
      return { text: parsed.text };
    } catch (error) {
      if (error instanceof GatewayError) throw new Error(error.kind);
      if (error instanceof RateLimitError) throw error;
      throw new Error("failed");
    }
  });
