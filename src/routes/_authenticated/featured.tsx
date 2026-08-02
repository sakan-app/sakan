import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Megaphone, MousePointerClick, Eye } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useFeatureStrings } from "@/i18n/feature";
import { createFeaturedCheckout } from "@/lib/ads/ads.functions";
import {
  createFeaturedAdDraft,
  myFeaturedAdsQuery,
  uploadFeaturedCreative,
} from "@/lib/ads/queries";
import { adsStrings } from "@/lib/ads/strings";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/featured")({
  head: () => ({
    meta: [
      { title: "الإعلان المميز | سَكَن" },
      { name: "description", content: "روّج لملفك في الشريط المميز مقابل 0.99 يورو." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FeaturedPage,
});

function FeaturedPage() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const s = useFeatureStrings(adsStrings);
  const qc = useQueryClient();
  const userId = user?.id ?? "";
  const checkout = useServerFn(createFeaturedCheckout);

  const [file, setFile] = useState<File | null>(null);
  const [headline, setHeadline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");

  const mine = useQuery({ ...myFeaturedAdsQuery(userId), enabled: Boolean(userId) });

  const submit = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("no_file");
      const imagePath = await uploadFeaturedCreative(userId, file);
      const adId = await createFeaturedAdDraft({
        userId,
        imagePath,
        headline,
        subtitle,
        targetUrl: link.trim() ? link.trim() : null,
      });
      return checkout({
        data: { adId, returnUrl: `${window.location.origin}/featured` },
      });
    },
    onSuccess: (result) => {
      if (result.status === "redirect" && result.url) {
        window.location.href = result.url;
        return;
      }
      toast.success(s.success, { description: result.testMode ? s.testMode : undefined });
      setFile(null);
      setHeadline("");
      setSubtitle("");
      setLink("");
      void qc.invalidateQueries({ queryKey: ["featured-ads"] });
    },
    onError: () => toast.error(s.error),
  });

  const fmtDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale === "ar" ? "ar-EG" : locale) : "—";

  return (
    <div className="w-full">
      <main className="w-full pt-4">
        <h1 className="flex items-center gap-2 text-2xl font-black text-cream">
          <Megaphone className="h-6 w-6 text-gold" aria-hidden="true" />
          {s.promoteTitle}
        </h1>
        <p className="mt-1 text-sm text-cream/60">{s.promoteSubtitle}</p>

        <section className="glass-card mt-6 rounded-2xl p-6">
          <p className="text-3xl font-black text-gold">{s.price}</p>
          <p className="mt-1 text-xs text-cream/55">{s.priceHint}</p>

          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit.mutate();
            }}
          >
            <label className="sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gold/35 p-4 text-sm text-cream/70 hover:border-gold/60">
              <ImagePlus className="h-5 w-5 text-gold" aria-hidden="true" />
              <span>
                <span className="block font-semibold text-cream">{file?.name ?? s.image}</span>
                <span className="block text-[11px] text-cream/50">{s.imageHint}</span>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <Field label={s.headline} value={headline} onChange={setHeadline} max={60} />
            <Field label={s.subtitle} value={subtitle} onChange={setSubtitle} max={90} />
            <Field
              label={s.link}
              value={link}
              onChange={setLink}
              max={300}
              className="sm:col-span-2"
            />

            <button
              type="submit"
              disabled={!file || submit.isPending}
              className="btn-gold sm:col-span-2 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold disabled:opacity-50"
            >
              {submit.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {s.processing}
                </>
              ) : (
                s.submit
              )}
            </button>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-cream">{s.myAds}</h2>
          {mine.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gold" aria-hidden="true" />
            </div>
          ) : (mine.data?.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-cream/55">{s.noAds}</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {mine.data!.map((ad) => (
                <li key={ad.id} className="glass-card flex items-center gap-4 rounded-2xl p-4">
                  {ad.imageUrl ? (
                    <img
                      src={ad.imageUrl}
                      alt=""
                      className="h-14 w-14 rounded-xl object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-cream">
                      {ad.headline ?? s.sponsored}
                    </p>
                    <p className="text-[11px] text-cream/55">
                      {s.statuses[ad.status] ?? ad.status}
                      {ad.endsAt ? ` · ${s.runningUntil} ${fmtDate(ad.endsAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-4 text-[11px] text-cream/60">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      {ad.impressions}
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="h-3.5 w-3.5" aria-hidden="true" />
                      {ad.clicks}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  max,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-cream/60">
        {label}
      </span>
      <input
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-cream/15 bg-navy/50 px-3 py-2.5 text-cream outline-none focus:border-gold/60"
      />
    </label>
  );
}