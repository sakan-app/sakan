import { createFileRoute } from "@tanstack/react-router";

/**
 * Stripe webhook receiver.
 *
 * Every payload is signature-verified before anything is written, so this
 * public endpoint cannot be used to grant subscriptions or publish ads.
 * Configure the endpoint URL in Stripe and store the signing secret as
 * STRIPE_WEBHOOK_SECRET.
 */
export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) return new Response("webhook_not_configured", { status: 503 });

        const payload = await request.text();
        const { verifyStripeEvent } = await import("@/lib/billing/stripe.server");

        let event: Record<string, unknown>;
        try {
          event = await verifyStripeEvent(
            payload,
            request.headers.get("stripe-signature"),
            secret,
          );
        } catch {
          return new Response("invalid_signature", { status: 401 });
        }

        const type = String(event["type"] ?? "");
        const eventId = String(event["id"] ?? "");
        const object = ((event["data"] as Record<string, unknown> | undefined)?.["object"] ??
          {}) as Record<string, unknown>;
        const metadata = (object["metadata"] ?? {}) as Record<string, string>;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency: Stripe retries deliveries, so the unique event id is
        // claimed first. A duplicate insert means the event is already handled.
        if (eventId) {
          const { error: claimError } = await supabaseAdmin
            .from("webhook_events")
            .insert({ id: eventId, provider: "stripe", event_type: type, status: "processing" });
          if (claimError) {
            // 23505 = unique violation → already received; ack without redoing work.
            if (claimError.code === "23505") return new Response("duplicate");
            console.error("[stripe-webhook] claim", claimError);
          }
        }

        try {
          if (type === "checkout.session.completed") {
            if (metadata["kind"] === "featured_ad" && metadata["ad_id"]) {
              const { publishFeaturedAd } = await import("@/lib/ads/ads.server");
              await publishFeaturedAd(
                metadata["ad_id"],
                "stripe",
                String(object["payment_intent"] ?? object["id"] ?? ""),
              );
            } else if (metadata["kind"] === "subscription" && metadata["user_id"]) {
              const { activateSubscription } = await import("@/lib/billing/billing.server");
              await activateSubscription({
                userId: metadata["user_id"]!,
                planCode: metadata["plan_code"] ?? "premium",
                interval: metadata["interval"] === "annual" ? "annual" : "monthly",
                provider: "stripe",
                providerRef: String(object["subscription"] ?? object["id"] ?? ""),
              });
            }
          } else if (
            type === "invoice.paid" &&
            object["billing_reason"] === "subscription_cycle" &&
            metadata["user_id"]
          ) {
            const { activateSubscription } = await import("@/lib/billing/billing.server");
            await activateSubscription({
              userId: metadata["user_id"]!,
              planCode: metadata["plan_code"] ?? "premium",
              interval: metadata["interval"] === "annual" ? "annual" : "monthly",
              provider: "stripe",
              providerRef: String(object["subscription"] ?? ""),
            });
          } else if (type === "customer.subscription.deleted" && metadata["user_id"]) {
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "canceled", canceled_at: new Date().toISOString() })
              .eq("user_id", metadata["user_id"]!)
              .eq("status", "active");
          } else if (type === "customer.subscription.updated" && metadata["user_id"]) {
            // Mirrors "cancel at period end" toggles made in Stripe or the portal.
            await supabaseAdmin
              .from("subscriptions")
              .update({ cancel_at_period_end: Boolean(object["cancel_at_period_end"]) })
              .eq("user_id", metadata["user_id"]!)
              .in("status", ["trialing", "active", "past_due"]);
          } else if (type === "invoice.payment_failed" && metadata["user_id"]) {
            // Keep access alive through a 3-day grace window before expiry.
            const graceUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "past_due", grace_until: graceUntil })
              .eq("user_id", metadata["user_id"]!)
              .in("status", ["trialing", "active"]);
          } else if (type === "charge.refunded" && metadata["user_id"]) {
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "canceled", canceled_at: new Date().toISOString() })
              .eq("user_id", metadata["user_id"]!)
              .in("status", ["trialing", "active", "past_due"]);
          }
        } catch (error) {
          console.error("[stripe-webhook]", type, error);
          if (eventId) {
            // Mark as failed so Stripe's retry can re-claim and reprocess it.
            await supabaseAdmin.from("webhook_events").delete().eq("id", eventId);
          }
          return new Response("handler_error", { status: 500 });
        }

        if (eventId) {
          await supabaseAdmin
            .from("webhook_events")
            .update({ status: "processed" })
            .eq("id", eventId);
        }
        return new Response("ok");
      },
    },
  },
});