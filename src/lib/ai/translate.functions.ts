import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatCompletion, parseJsonContent, GatewayError } from "@/lib/ai/gateway.server";
import { buildTranslateMessages, translateSchema } from "@/lib/ai/prompts";

const translateInput = z.object({
  text: z.string().min(1).max(4000),
  targetLanguage: z.enum(["ar", "en", "de", "fr"]),
});

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(translateInput)
  .handler(async ({ data }) => {
    try {
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
      throw new Error("failed");
    }
  });
