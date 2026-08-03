/**
 * Minimal shared server-side rate limiter.
 *
 * Backed by the existing `activity_logs` table (no new migration): each call
 * writes a marker row keyed by an arbitrary string and counts markers within
 * the trailing window. Fails open (never blocks a request) if the logging
 * query itself errors, so a DB hiccup can't take down an unrelated feature.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export class RateLimitError extends Error {
  constructor(message = "Too many requests. Please try again in a moment.") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Throws `RateLimitError` if more than `limit` calls with the same `key`
 * have been recorded within `windowMs`. Otherwise records this call.
 */
export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const since = new Date(Date.now() - windowMs).toISOString();
  const event = `rl:${key}`;
  const { count, error } = await supabaseAdmin
    .from("activity_logs")
    .select("id", { count: "exact", head: true })
    .eq("event", event)
    .gte("created_at", since);
  if (error) return;
  if ((count ?? 0) >= limit) throw new RateLimitError();
  await supabaseAdmin.from("activity_logs").insert({ event, level: "info", context: {} });
}
