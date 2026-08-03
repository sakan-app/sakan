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
          const handlers = await import("@/lib/billing/webhook.server");
          switch (type) {
            case "checkout.session.completed":
              await handlers.handleCheckoutCompleted(object);
              break;
            case "invoice.paid":
            case "invoice_payment.paid":
              await handlers.handleInvoicePaid(object);
              break;
            case "invoice.payment_failed":
              await handlers.handleInvoiceFailed(object);
              break;
            case "customer.subscription.updated":
              await handlers.handleSubscriptionUpdated(object);
              break;
            case "customer.subscription.deleted":
              await handlers.handleSubscriptionDeleted(object);
              break;
            case "charge.refunded":
              await handlers.handleChargeRefunded(object);
              break;
            default:
              break;
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