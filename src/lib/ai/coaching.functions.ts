import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Locale } from "@/i18n";
import { toCompatibilityProfile, type ProfileRow } from "@/lib/ai/matchmaking-helpers.server";
import { scoreProfileQuality, gatewayErrorToMessage } from "@/lib/ai/coaching-helpers.server";

const PROFILE_COLS =
  "id, display_name, birth_date, gender, looking_for, country_code, city, bio, interests, occupation, education, marital_status, religiosity, preferred_language, avatar_url";

export const suggestProfileQuality = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.void())
  .handler(async ({ context }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: meRow, error: meErr } = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_COLS)
        .eq("id", context.userId)
        .maybeSingle();
      if (meErr || !meRow) throw new Error("failed");
      const language = (meRow.preferred_language ?? "ar") as Locale;

      const { count } = await supabaseAdmin
        .from("photos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId);
      const hasPhotos = Boolean((count ?? 0) > 0 || meRow.avatar_url);

      const result = await scoreProfileQuality(
        { ...toCompatibilityProfile(meRow as ProfileRow), hasPhotos },
        language,
      );
      return result;
    } catch (error) {
      throw new Error(gatewayErrorToMessage(error));
    }
  });

export const suggestIceBreakers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ candidateId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { buildIceBreakerMessages } = await import("@/lib/ai/prompts");
      const { generateSuggestions } = await import("@/lib/ai/coaching-helpers.server");
      const { data: rows, error } = await supabaseAdmin
        .from("profiles")
        .select(PROFILE_COLS)
        .in("id", [context.userId, data.candidateId]);
      if (error || !rows) throw new Error("failed");
      const meRow = rows.find((r) => r.id === context.userId);
      const otherRow = rows.find((r) => r.id === data.candidateId);
      if (!meRow || !otherRow) throw new Error("failed");
      const language = (meRow.preferred_language ?? "ar") as Locale;
      return {
        suggestions: await generateSuggestions(
          buildIceBreakerMessages(
            toCompatibilityProfile(meRow as ProfileRow),
            toCompatibilityProfile(otherRow as ProfileRow),
            language,
          ),
          4,
        ),
      };
    } catch (error) {
      throw new Error(gatewayErrorToMessage(error));
    }
  });

export const suggestSmartReplies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ conversationId: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    try {
      const { buildSmartReplyMessages } = await import("@/lib/ai/prompts");
      const { generateSuggestions } = await import("@/lib/ai/coaching-helpers.server");
      // RLS-scoped read: only participants can see the transcript.
      const { data: msgs, error } = await context.supabase
        .from("messages")
        .select("sender_id, body, created_at")
        .eq("conversation_id", data.conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw new Error("failed");
      const transcript = (msgs ?? [])
        .filter((m) => (m.body ?? "").trim().length > 0)
        .reverse()
        .map((m) => ({ fromMe: m.sender_id === context.userId, body: (m.body ?? "").slice(0, 400) }));
      if (transcript.length === 0) return { suggestions: [] as string[] };
      const { data: meRow } = await context.supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", context.userId)
        .maybeSingle();
      const language = (meRow?.preferred_language ?? "ar") as Locale;
      return { suggestions: await generateSuggestions(buildSmartReplyMessages(transcript, language), 3) };
    } catch (error) {
      throw new Error(gatewayErrorToMessage(error));
    }
  });

export const improveMyBio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.void())
  .handler(async ({ context }) => {
    try {
      const { improveBio } = await import("@/lib/ai/coaching-helpers.server");
      const { data: meRow, error } = await context.supabase
        .from("profiles")
        .select(PROFILE_COLS)
        .eq("id", context.userId)
        .maybeSingle();
      if (error || !meRow) throw new Error("failed");
      const language = (meRow.preferred_language ?? "ar") as Locale;
      return await improveBio(toCompatibilityProfile(meRow as ProfileRow), language);
    } catch (error) {
      throw new Error(gatewayErrorToMessage(error));
    }
  });
