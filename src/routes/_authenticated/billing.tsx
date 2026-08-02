import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PlanCards } from "@/components/billing/PlanCards";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatureStrings } from "@/i18n/feature";
import {
  billingHistoryQuery,
  invoicesQuery,
  useCancelSubscription,
  useResumeSubscription,
} from "@/lib/billing/queries";
import { billingStrings } from "@/lib/billing/strings";
import { formatPrice } from "@/lib/billing/types";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "الاشتراك والفواتير | سَكَن" },
      { name: "description", content: "إدارة باقتك وفواتيرك على منصة سَكَن." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const s = useFeatureStrings(billingStrings);
  const userId = user?.id ?? "";
  const { subscription, plan, isLoading } = useSubscription();
  const invoicesQ = useQuery(invoicesQuery(userId));
  const eventsQ = useQuery(billingHistoryQuery(userId));
  const cancel = useCancelSubscription(userId);
  const resume = useResumeSubscription(userId);

  const fmtDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale === "ar" ? "ar-EG" : locale) : "—";

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-6 py-10 lg:px-8">
        <h1 className="text-2xl font-black text-cream">{s.billingTitle}</h1>
        <p className="mt-1 text-sm text-cream/60">{s.billingSubtitle}</p>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-gold-deep" />
          </div>
        ) : (
          <section className="mt-8 rounded-2xl border border-gold/30 bg-white p-7 ">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase text-cream/60">{s.plan}</p>
                <p className="mt-1 text-lg font-black text-cream">
                  {plan ? plan.name[locale] : s.free}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-cream/60">{s.status}</p>
                <p className="mt-1 text-lg font-black text-cream">
                  {subscription ? (s.statuses[subscription.status] ?? subscription.status) : s.free}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-cream/60">
                  {subscription?.cancelAtPeriodEnd ? s.endsOn : s.renewsOn}
                </p>
                <p className="mt-1 text-lg font-black text-cream">
                  {fmtDate(subscription?.currentPeriodEnd ?? null)}
                </p>
              </div>
            </div>

            {subscription?.status === "past_due" ? (
              <p role="status" className="mt-6 rounded-lg bg-gold/15 p-4 text-sm font-bold text-cream">
                {s.graceNotice}
              </p>
            ) : null}
            {subscription?.cancelAtPeriodEnd ? (
              <p role="status" className="mt-6 rounded-lg bg-gold/15 p-4 text-sm font-bold text-cream">
                {s.canceledNotice}
              </p>
            ) : null}

            {subscription ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {subscription.cancelAtPeriodEnd ? (
                  <button
                    type="button"
                    className="btn-gold px-5 py-2 text-sm disabled:opacity-60"
                    disabled={resume.isPending}
                    onClick={() => resume.mutate(undefined, { onError: () => toast.error(s.error) })}
                  >
                    {resume.isPending ? s.processing : s.resume}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-outline-gold px-5 py-2 text-sm disabled:opacity-60"
                    disabled={cancel.isPending}
                    onClick={() => {
                      if (!window.confirm(s.cancelConfirm)) return;
                      cancel.mutate(undefined, { onError: () => toast.error(s.error) });
                    }}
                  >
                    {cancel.isPending ? s.processing : s.cancel}
                  </button>
                )}
              </div>
            ) : null}
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-xl font-black text-cream">{s.changePlan}</h2>
          <div className="mt-6">
            <PlanCards />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-black text-cream">{s.invoices}</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-gold/30 bg-white ">
            {invoicesQ.isPending ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gold-deep" />
              </div>
            ) : (invoicesQ.data ?? []).length === 0 ? (
              <p className="p-8 text-center text-sm text-cream/60">{s.noInvoices}</p>
            ) : (
              <table className="w-full text-start text-sm">
                <thead className="bg-navy/5 text-xs font-bold uppercase text-cream">
                  <tr>
                    <th className="px-4 py-3 text-start">{s.invoiceNumber}</th>
                    <th className="px-4 py-3 text-start">{s.date}</th>
                    <th className="px-4 py-3 text-start">{s.amount}</th>
                    <th className="px-4 py-3 text-start">{s.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoicesQ.data ?? []).map((inv) => (
                    <tr key={inv.id} className="border-t border-gold/15">
                      <td className="px-4 py-3 font-mono text-xs text-cream">
                        {inv.invoiceNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-cream/60">{fmtDate(inv.createdAt)}</td>
                      <td className="px-4 py-3 font-bold text-cream">
                        {formatPrice(inv.amountCents, inv.currency, locale)}
                      </td>
                      <td className="px-4 py-3">{s.statuses[inv.status] ?? inv.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-black text-cream">{s.history}</h2>
          <ul className="mt-4 space-y-2">
            {(eventsQ.data ?? []).length === 0 ? (
              <li className="rounded-xl border border-gold/30 bg-white p-6 text-center text-sm text-cream/60">
                {s.noHistory}
              </li>
            ) : (
              (eventsQ.data ?? []).map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/20 bg-white px-5 py-3 text-sm"
                >
                  <span className="font-bold text-cream">
                    {s.events[event.type] ?? event.type}
                    {event.planCode ? ` · ${event.planCode}` : ""}
                  </span>
                  <span className="text-xs text-cream/60">{fmtDate(event.createdAt)}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
