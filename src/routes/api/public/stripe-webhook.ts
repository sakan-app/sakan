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
        const object = ((event["data"] as Record<string, unknown> | undefined)?.["object"] ??
          {}) as Record<string, unknown>;
        const metadata = (object["metadata"] ?? {}) as Record<string, string>;

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
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "canceled", canceled_at: new Date().toISOString() })
              .eq("user_id", metadata["user_id"]!)
              .eq("status", "active");
          }
        } catch (error) {
          console.error("[stripe-webhook]", type, error);
          return new Response("handler_error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});