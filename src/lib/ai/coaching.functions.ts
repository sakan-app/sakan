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
