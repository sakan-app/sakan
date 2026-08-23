/**
 * Staff-only management surface for commercial (non-member) header banners.
 *
 * Every mutation goes through `commercial.functions.ts`, which re-verifies
 * staff server-side. Activation is refused by the server unless a payment was
 * confirmed, so this panel can surface the action but never bypass the check.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";

import {
  ActionButton,
  AdminInput,
  AdminSelect,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  Pill,
  TableShell,
  Td,
  Th,
} from "@/components/admin/ui";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { validateImageFile } from "@/lib/validation";
import {
  COMMERCIAL_AD_RATES,
  HEADER_BANNER_SLOT,
  commercialAdRate,
  type CommercialAdDuration,
} from "@/lib/ads/commercial";
import {
  confirmCommercialAdOfflinePayment,
  listCommercialAdsAdmin,
  saveCommercialAdAdmin,
  setCommercialAdStatusAdmin,
  startCommercialAdCheckout,
} from "@/lib/ads/commercial.functions";

type AdRow = {
  id: string;
  slot_key: string;
  advertiser_name: string;
  advertiser_email: string | null;
  headline: string | null;
  image_path: string | null;
  image_url: string | null;
  target_url: string | null;
  duration_key: string;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  impressions: number;
  clicks: number;
  display_url: string | null;
};

type FormState = {
  id: string | null;
  slotKey: string;
  advertiserName: string;
  advertiserEmail: string;
  headline: string;
  imagePath: string | null;
  imageUrl: string;
  targetUrl: string;
  durationKey: CommercialAdDuration;
  startsAt: string;
};

const EMPTY: FormState = {
  id: null,
  slotKey: HEADER_BANNER_SLOT,
  advertiserName: "",
  advertiserEmail: "",
  headline: "",
  imagePath: null,
  imageUrl: "",
  targetUrl: "",
  durationKey: "weekly",
  startsAt: "",
};

function toneFor(status: string) {
  if (status === "active") return "success" as const;
  if (status === "pending_payment") return "warning" as const;
  if (status === "rejected") return "danger" as const;
  return "neutral" as const;
}

/** `datetime-local` value -> ISO string (or null when empty). */
function toIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO string -> `datetime-local` value in the viewer's timezone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CommercialAdsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listCommercialAdsAdmin);
  const saveFn = useServerFn(saveCommercialAdAdmin);
  const statusFn = useServerFn(setCommercialAdStatusAdmin);
  const checkoutFn = useServerFn(startCommercialAdCheckout);
  const offlineFn = useServerFn(confirmCommercialAdOfflinePayment);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [uploading, setUploading] = useState(false);

  const ads = useQuery({
    queryKey: ["admin", "commercial-ads"],
    queryFn: () => listFn() as Promise<AdRow[]>,
    staleTime: 30_000,
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin", "commercial-ads"] });

  const save = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          ...(form.id ? { id: form.id } : {}),
          slotKey: form.slotKey,
          advertiserName: form.advertiserName.trim(),
          advertiserEmail: form.advertiserEmail.trim() || null,
          headline: form.headline.trim() || null,
          imagePath: form.imagePath,
          imageUrl: form.imageUrl.trim() || null,
          targetUrl: form.targetUrl.trim() || null,
          durationKey: form.durationKey,
          startsAt: toIso(form.startsAt),
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "Advertisement updated" : "Draft created");
      setForm(EMPTY);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setStatus = useMutation({
    mutationFn: (input: { adId: string; status: "active" | "paused" | "expired" | "rejected" }) =>
      statusFn({ data: input }),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
    onError: (error: Error) =>
      toast.error(
        error.message === "payment_not_confirmed"
          ? "Payment not confirmed — this banner cannot go live yet."
          : error.message,
      ),
  });

  const checkout = useMutation({
    mutationFn: (adId: string) =>
      checkoutFn({ data: { adId, returnUrl: window.location.href.split("?")[0] as string } }),
    onSuccess: (result) => {
      if (result.status === "redirect" && result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Card payments are not configured yet — use offline confirmation.");
      }
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const offline = useMutation({
    mutationFn: (input: { adId: string; reference: string }) => offlineFn({ data: input }),
    onSuccess: () => {
      toast.success("Payment recorded — banner published");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function onPickImage(file: File) {
    const invalid = validateImageFile(file);
    if (invalid) {
      toast.error(String(invalid));
      return;
    }
    if (!user?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/commercial-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("featured")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      setForm((f) => ({ ...f, imagePath: path }));
      toast.success("Creative uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function edit(ad: AdRow) {
    setForm({
      id: ad.id,
      slotKey: ad.slot_key,
      advertiserName: ad.advertiser_name,
      advertiserEmail: ad.advertiser_email ?? "",
      headline: ad.headline ?? "",
      imagePath: ad.image_path,
      imageUrl: ad.image_url ?? "",
      targetUrl: ad.target_url ?? "",
      durationKey: (ad.duration_key as CommercialAdDuration) ?? "weekly",
      startsAt: toLocalInput(ad.starts_at),
    });
  }

  const rate = commercialAdRate(form.durationKey);
  const rows = ads.data ?? [];

  return (
    <Panel>
      <div className="mb-4 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-gold" aria-hidden />
        <h2 className="text-sm font-bold text-cream">Commercial banners</h2>
      </div>

      <form
        className="mb-6 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (form.advertiserName.trim().length < 2) {
            toast.error("Advertiser name is required");
            return;
          }
          save.mutate();
        }}
      >
        <label className="text-xs text-cream/70">
          Advertiser name
          <AdminInput
            value={form.advertiserName}
            onChange={(e) => setForm({ ...form, advertiserName: e.target.value })}
            required
          />
        </label>
        <label className="text-xs text-cream/70">
          Advertiser email (internal only)
          <AdminInput
            type="email"
            value={form.advertiserEmail}
            onChange={(e) => setForm({ ...form, advertiserEmail: e.target.value })}
          />
        </label>
        <label className="text-xs text-cream/70">
          Headline
          <AdminInput
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            maxLength={160}
          />
        </label>
        <label className="text-xs text-cream/70">
          Destination URL
          <AdminInput
            type="url"
            value={form.targetUrl}
            onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
            placeholder="https://…"
          />
        </label>
        <label className="text-xs text-cream/70">
          Duration
          <AdminSelect
            value={form.durationKey}
            onChange={(e) =>
              setForm({ ...form, durationKey: e.target.value as CommercialAdDuration })
            }
          >
            {COMMERCIAL_AD_RATES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.key} — {(r.priceCents / 100).toFixed(2)} {r.currency} / {r.days}d
              </option>
            ))}
          </AdminSelect>
        </label>
        <label className="text-xs text-cream/70">
          Scheduled start (optional)
          <AdminInput
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
        </label>
        <label className="text-xs text-cream/70">
          Creative image (728×90 reference)
          <AdminInput
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onPickImage(file);
            }}
          />
          <span className="mt-1 block text-[11px] text-cream/50">
            {uploading ? "Uploading…" : form.imagePath ? `Stored: ${form.imagePath}` : "No upload"}
          </span>
        </label>
        <label className="text-xs text-cream/70">
          …or external image URL
          <AdminInput
            type="url"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://…"
          />
        </label>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <ActionButton type="submit" tone="primary" disabled={save.isPending}>
            {form.id ? "Save changes" : "Create draft"}
          </ActionButton>
          {form.id ? (
            <ActionButton type="button" onClick={() => setForm(EMPTY)}>
              Cancel
            </ActionButton>
          ) : null}
          {rate ? (
            <span className="text-[11px] text-cream/50">
              Price: {(rate.priceCents / 100).toFixed(2)} {rate.currency} · {rate.days} days
            </span>
          ) : null}
        </div>
      </form>

      {ads.isLoading ? (
        <LoadingState label="Loading commercial ads…" />
      ) : ads.isError ? (
        <ErrorState message={(ads.error as Error).message} onRetry={() => void ads.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState label="No commercial banners yet." />
      ) : (
        <TableShell
          caption="Commercial ads table"
          head={
            <tr>
              <Th>Advertiser</Th>
              <Th>Status</Th>
              <Th>Payment</Th>
              <Th>Window</Th>
              <Th>Impr. / Clicks</Th>
              <Th>Actions</Th>
            </tr>
          }
        >
          {rows.map((ad) => (
            <tr key={ad.id}>
              <Td>
                <p className="font-semibold text-cream">{ad.advertiser_name}</p>
                <p className="text-[11px] text-cream/50">{ad.headline ?? ""}</p>
                <p className="text-[11px] text-cream/40">
                  {ad.slot_key} · {ad.duration_key} ·{" "}
                  {(ad.amount_cents / 100).toFixed(2)} {ad.currency}
                </p>
              </Td>
              <Td>
                <Pill tone={toneFor(ad.status)}>{ad.status.replace("_", " ")}</Pill>
              </Td>
              <Td>
                {ad.paid_at ? (
                  <Pill tone="success">paid</Pill>
                ) : (
                  <Pill tone="warning">unpaid</Pill>
                )}
              </Td>
              <Td>
                <span className="text-[11px]">
                  {ad.starts_at ? new Date(ad.starts_at).toLocaleDateString() : "—"} →{" "}
                  {ad.ends_at ? new Date(ad.ends_at).toLocaleDateString() : "—"}
                </span>
              </Td>
              <Td>
                {ad.impressions} / {ad.clicks}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <ActionButton onClick={() => edit(ad)}>Edit</ActionButton>
                  {!ad.paid_at ? (
                    <>
                      <ActionButton onClick={() => checkout.mutate(ad.id)}>Checkout</ActionButton>
                      <ActionButton
                        onClick={() => {
                          const reference = window.prompt("Offline payment reference");
                          if (reference && reference.trim().length >= 3) {
                            offline.mutate({ adId: ad.id, reference: reference.trim() });
                          }
                        }}
                      >
                        Mark paid
                      </ActionButton>
                    </>
                  ) : ad.status === "active" ? (
                    <>
                      <ActionButton
                        onClick={() => setStatus.mutate({ adId: ad.id, status: "paused" })}
                      >
                        Pause
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        onClick={() => setStatus.mutate({ adId: ad.id, status: "expired" })}
                      >
                        Stop
                      </ActionButton>
                    </>
                  ) : (
                    <ActionButton
                      onClick={() => setStatus.mutate({ adId: ad.id, status: "active" })}
                    >
                      Activate
                    </ActionButton>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </TableShell>
      )}
    </Panel>
  );
}
