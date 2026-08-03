/**
 * Push fan-out endpoint.
 *
 * Notifications are created by database triggers. An AFTER INSERT trigger
 * calls this route immediately with the new notification id; the route sends
 * it to every active device and stamps `push_sent_at` after completion.
 *
 * Auth: constant-time comparison against PUSH_DISPATCH_TOKEN. The route lives
 * under /api/public/* (no site auth), so the token check is the only gate.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BATCH_SIZE = 100;
/**
 * A notification is only given up on after this long. Before that, a run that
 * delivered nothing (device offline queue rejected it, provider 5xx) leaves
 * the row unstamped so the next minute retries it.
 */
const GIVE_UP_AFTER_MS = 15 * 60 * 1000;
const dispatchInput = z.object({ notificationId: z.string().uuid() });

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return diff === 0;
}

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
};

/** Deep link for each notification type. */
function targetUrl(row: NotificationRow): string {
  const data = row.data ?? {};
  if (typeof data["url"] === "string") return data["url"];
  switch (row.type) {
    case "message":
      return typeof data["conversation_id"] === "string"
        ? `/messages/${data["conversation_id"]}`
        : "/messages";
    case "match":
      return "/matches";
    case "like":
    case "profile_view":
      return "/notifications";
    case "premium":
      return "/billing";
    default:
      return "/notifications";
  }
}

export const Route = createFileRoute("/api/public/push-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["PUSH_DISPATCH_TOKEN"];
        const provided = request.headers.get("x-push-token") ?? "";
        if (!expected || !safeEqual(provided, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const parsed = dispatchInput.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid dispatch payload", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendPushToUser, vapidConfigured } = await import("@/lib/push/webpush.server");
        if (!vapidConfigured()) {
          return Response.json({ skipped: true, reason: "vapid_not_configured" });
        }

        const { data, error } = await supabaseAdmin
          .from("notifications")
          .select("id, user_id, type, title, body, data, created_at")
          .is("push_sent_at", null)
          .is("read_at", null)
          .eq("id", parsed.data.notificationId)
          .order("created_at", { ascending: true })
          .limit(BATCH_SIZE);

        if (error) return new Response(error.message, { status: 500 });
        const rows = (data ?? []) as NotificationRow[];
        if (rows.length === 0) return Response.json({ processed: 0, sent: 0 });

        // Do-Not-Disturb members are stamped as handled but never pushed.
        const userIds = [...new Set(rows.map((row) => row.user_id))];
        const { data: presenceRows } = await supabaseAdmin
          .from("profiles")
          .select("id, presence_status, preferred_language")
          .in("id", userIds);
        const presence = new Map(
          (presenceRows ?? []).map((row) => [
            row.id as string,
            {
              dnd: row["presence_status"] === "dnd",
              locale: (row["preferred_language"] as string | null) ?? "ar",
            },
          ]),
        );

        let sent = 0;
        let retrying = 0;
        const attempts: Array<{
          notificationId: string;
          subscriptionId: string;
          status: number | null;
          outcome: string;
        }> = [];
        // Badge counts are per member: one query, reused for every row.
        const unreadByUser = new Map<string, number>();
        await Promise.all(
          userIds.map(async (userId) => {
            const { count } = await supabaseAdmin
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId)
              .is("archived_at", null)
              .is("read_at", null);
            unreadByUser.set(userId, count ?? 0);
          }),
        );

        for (const row of rows) {
          const member = presence.get(row.user_id);
          if (member?.dnd) {
            // Nothing will ever be delivered for this row — close it out.
            await supabaseAdmin
              .from("notifications")
              .update({ push_sent_at: new Date().toISOString() })
              .eq("id", row.id);
            continue;
          }

          const result = await sendPushToUser(row.user_id, {
              title: row.title,
              body: row.body ?? "",
              url: targetUrl(row),
              tag: `sakan-${row.type}-${row.id}`,
              kind: row.type,
              lang: member?.locale ?? "ar",
              dir: (member?.locale ?? "ar") === "ar" ? "rtl" : "ltr",
              badge_count: unreadByUser.get(row.user_id) ?? 0,
          });
          sent += result.sent;
          attempts.push(
            ...result.attempts.map((attempt) => ({ notificationId: row.id, ...attempt })),
          );

          // Only stamp when the row is genuinely finished: something was
          // delivered, the member has no devices at all, or we have retried
          // past the give-up window. Stamping a failed send would drop the
          // notification permanently.
          const expired = Date.now() - new Date(row.created_at).getTime() > GIVE_UP_AFTER_MS;
          if (result.sent === 0 && result.devices > 0 && !expired) {
            retrying += 1;
            continue;
          }

          await supabaseAdmin
            .from("notifications")
            .update({ push_sent_at: new Date().toISOString() })
            .eq("id", row.id);
        }

        return Response.json({ processed: rows.length, sent, retrying, attempts });
      },
    },
  },
});