import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

import {
  ActionButton,
  AdminPageHeader,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  Pill,
  StatCard,
  TableShell,
  Td,
  Th,
} from "@/components/admin/ui";
import { listFeaturedAdsAdmin, reviewFeaturedAd } from "@/lib/ads/ads.functions";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/admin/ads")({ component: AdminAds, errorComponent: RouteErrorBoundary });

type AdRow = {
  id: string;
  headline: string | null;
  subtitle: string | null;
  target_url: string | null;
  status: string;
  amount_cents: number;
  currency: string;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
};

function toneFor(status: string) {
  if (status === "active") return "success" as const;
  if (status === "pending_payment" || status === "pending_review") return "warning" as const;
  if (status === "rejected") return "danger" as const;
  return "neutral" as const;
}

function AdminAds() {
  const listFn = useServerFn(listFeaturedAdsAdmin);
  const reviewFn = useServerFn(reviewFeaturedAd);
  const queryClient = useQueryClient();

  const ads = useQuery({
    queryKey: ["admin", "featured-ads"],
    queryFn: () => listFn() as Promise<AdRow[]>,
    staleTime: 30_000,
  });

  const review = useMutation({
    mutationFn: (input: { adId: string; decision: "approve" | "reject" | "expire" }) =>
      reviewFn({ data: input }),
    onSuccess: () => {
      toast.success("Updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "featured-ads"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = ads.data ?? [];
  const active = rows.filter((r) => r.status === "active");
  const revenue = rows
    .filter((r) => r.status === "active" || r.status === "expired")
    .reduce((sum, r) => sum + r.amount_cents, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Featured ads"
        subtitle="Paid rotating banner — €0.99 per creative, 30 days in rotation."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total ads" value={String(rows.length)} icon={Megaphone} />
        <StatCard label="Running now" value={String(active.length)} icon={Megaphone} />
        <StatCard label="Ad revenue" value={`${(revenue / 100).toFixed(2)} EUR`} icon={Megaphone} />
      </div>

      <Panel>
        <h2 className="mb-4 text-sm font-bold text-cream">All creatives</h2>
        {ads.isLoading ? (
          <LoadingState label="Loading ads…" />
        ) : ads.isError ? (
          <ErrorState message={(ads.error as Error).message} onRetry={() => void ads.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState label="No featured purchases yet." />
        ) : (
          <TableShell
            head={
              <tr>
                <Th>Headline</Th>
                <Th>Status</Th>
                <Th>Runs until</Th>
                <Th>Impr.</Th>
                <Th>Clicks</Th>
                <Th>Actions</Th>
              </tr>
            }
          >
              {rows.map((ad) => (
                <tr key={ad.id}>
                  <Td>
                    <p className="font-semibold text-cream">{ad.headline ?? "—"}</p>
                    <p className="text-[11px] text-cream/50">{ad.subtitle ?? ""}</p>
                  </Td>
                  <Td>
                    <Pill tone={toneFor(ad.status)}>{ad.status.replace("_", " ")}</Pill>
                  </Td>
                  <Td>{ad.ends_at ? new Date(ad.ends_at).toLocaleDateString() : "—"}</Td>
                  <Td>{ad.impressions}</Td>
                  <Td>{ad.clicks}</Td>
                  <Td>
                    <div className="flex gap-2">
                      {ad.status !== "active" ? (
                        <ActionButton
                          onClick={() => review.mutate({ adId: ad.id, decision: "approve" })}
                        >
                          Approve
                        </ActionButton>
                      ) : (
                        <ActionButton
                          onClick={() => review.mutate({ adId: ad.id, decision: "expire" })}
                        >
                          Stop
                        </ActionButton>
                      )}
                      <ActionButton
                        tone="danger"
                        onClick={() => review.mutate({ adId: ad.id, decision: "reject" })}
                      >
                        Reject
                      </ActionButton>
                    </div>
                  </Td>
                </tr>
              ))}
          </TableShell>
        )}
      </Panel>
    </div>
  );
}