/**
 * In-app PWA + Push diagnostics console.
 *
 * Everything here is read-only except the push permission flow: it requests
 * Notification permission, creates the PushSubscription, shows the stored
 * subscription and the last dispatch result, and reports the live Service
 * Worker lifecycle (installing / waiting / active / controlling) plus the
 * current Cache Storage contents.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { BellRing, DatabaseZap, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, Screen } from "@/components/app/AppShell";
import { RouteErrorBoundary } from "@/components/RouteError";
import { useAuth } from "@/hooks/useAuth";
import {
  disablePush,
  enablePush,
  pushSupported,
  readPushState,
  type PushState,
} from "@/lib/push/push-browser";
import { getPushDiagnostics, sendTestPush } from "@/lib/push/push.functions";
import { APP_VERSION, SW_URL, serviceWorkerAllowed } from "@/lib/pwa/register";

export const Route = createFileRoute("/_authenticated/diagnostics")({
  head: () => ({
    meta: [
      { title: "PWA & Push Diagnostics | Sakan" },
      {
        name: "description",
        content:
          "Live status console for the Sakan installable app: service worker lifecycle, cache contents, push permission and dispatch results.",
      },
      { property: "og:title", content: "PWA & Push Diagnostics | Sakan" },
      {
        property: "og:description",
        content: "Service worker, cache and push notification status for this device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiagnosticsPage,
  errorComponent: RouteErrorBoundary,
});

/* ------------------------------------------------------------------ types */

type SwSnapshot = {
  supported: boolean;
  allowed: boolean;
  scope: string | null;
  scriptURL: string | null;
  installing: boolean;
  waiting: boolean;
  activeState: string | null;
  controlled: boolean;
  registrations: number;
  error?: string;
};

type CacheSnapshot = { name: string; entries: number; samples: string[] };

/* -------------------------------------------------------------- utilities */

function shorten(value: string, head = 34, tail = 12): string {
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function when(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

async function readServiceWorker(): Promise<SwSnapshot> {
  const supported = typeof navigator !== "undefined" && "serviceWorker" in navigator;
  const base: SwSnapshot = {
    supported,
    allowed: serviceWorkerAllowed(),
    scope: null,
    scriptURL: null,
    installing: false,
    waiting: false,
    activeState: null,
    controlled: false,
    registrations: 0,
  };
  if (!supported) return base;
  try {
    const all = await navigator.serviceWorker.getRegistrations();
    const registration =
      all.find((entry) => entry.active?.scriptURL.endsWith(SW_URL)) ?? all[0] ?? null;
    return {
      ...base,
      registrations: all.length,
      scope: registration?.scope ?? null,
      scriptURL:
        registration?.active?.scriptURL ??
        registration?.waiting?.scriptURL ??
        registration?.installing?.scriptURL ??
        null,
      installing: Boolean(registration?.installing),
      waiting: Boolean(registration?.waiting),
      activeState: registration?.active?.state ?? null,
      controlled: Boolean(navigator.serviceWorker.controller),
    };
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : "unknown" };
  }
}

async function readCaches(): Promise<CacheSnapshot[]> {
  if (typeof caches === "undefined") return [];
  try {
    const names = await caches.keys();
    return await Promise.all(
      names.map(async (name) => {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        return {
          name,
          entries: requests.length,
          samples: requests.slice(0, 5).map((request) => new URL(request.url).pathname),
        };
      }),
    );
  } catch {
    return [];
  }
}

async function readBrowserSubscription() {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return null;
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.["p256dh"] ?? "",
    auth: json.keys?.["auth"] ?? "",
    expirationTime: subscription.expirationTime,
  };
}

/* ------------------------------------------------------------- primitives */

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof BellRing;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Icon className="h-4 w-4 text-gold" />
        <h2 className="text-[12px] font-bold uppercase tracking-widest text-cream/60">{title}</h2>
      </div>
      {hint && <p className="mb-2 px-1 text-[11px] text-cream/40">{hint}</p>}
      <GlassCard className="p-4">{children}</GlassCard>
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/8 py-2 last:border-0">
      <span className="shrink-0 text-[12px] text-cream/50">{label}</span>
      <span
        className={`min-w-0 break-all text-end text-[12px] font-semibold text-cream ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
        ok ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-cream/55"
      }`}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------- page */

function DiagnosticsPage() {
  const { user } = useAuth();
  const [sw, setSw] = useState<SwSnapshot | null>(null);
  const [cacheList, setCacheList] = useState<CacheSnapshot[]>([]);
  const [pushState, setPushState] = useState<PushState>("prompt");
  const [subscription, setSubscription] =
    useState<Awaited<ReturnType<typeof readBrowserSubscription>>>(null);
  const [busy, setBusy] = useState(false);
  const [lastAction, setLastAction] = useState<string>("—");

  const server = useQuery({
    queryKey: ["push-diagnostics", user?.id],
    queryFn: () => getPushDiagnostics(),
    enabled: Boolean(user?.id),
    refetchOnWindowFocus: false,
  });

  const refreshBrowser = useCallback(async () => {
    const [swSnapshot, caches_, state, sub] = await Promise.all([
      readServiceWorker(),
      readCaches(),
      readPushState(),
      readBrowserSubscription().catch(() => null),
    ]);
    setSw(swSnapshot);
    setCacheList(caches_);
    setPushState(state);
    setSubscription(sub);
  }, []);

  useEffect(() => {
    void refreshBrowser();
  }, [refreshBrowser]);

  async function togglePush() {
    setBusy(true);
    try {
      const next = pushState === "subscribed" ? await disablePush() : await enablePush();
      setPushState(next);
      setLastAction(
        next === "subscribed"
          ? "Subscription created"
          : next === "denied"
            ? "Permission denied by the browser"
            : next === "unsupported"
              ? "Push unsupported or VAPID not configured"
              : "Subscription removed",
      );
      await refreshBrowser();
      await server.refetch();
    } catch (error) {
      setLastAction(error instanceof Error ? error.message : "Failed");
      toast.error("Push action failed");
    } finally {
      setBusy(false);
    }
  }

  async function testPush() {
    setBusy(true);
    try {
      const result = await sendTestPush();
      setLastAction(
        `Dispatch → sent ${result.sent}, failed ${result.failed}, devices ${result.devices}${
          result.skipped ? " (skipped: VAPID missing)" : ""
        }`,
      );
      await server.refetch();
    } catch (error) {
      setLastAction(error instanceof Error ? error.message : "Dispatch failed");
      toast.error("Test push failed");
    } finally {
      setBusy(false);
    }
  }

  const data = server.data;

  return (
    <Screen
      title="Diagnostics"
      subtitle="Service worker, caches and push notifications on this device"
      action={
        <button
          type="button"
          onClick={() => {
            void refreshBrowser();
            void server.refetch();
          }}
          className="flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-2 text-[12px] font-bold text-cream transition-colors hover:bg-white/14"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      {/* ------------------------------------------------ push console */}
      <Section
        icon={BellRing}
        title="Push notifications"
        hint="Requests permission, creates a PushSubscription and stores it on your account."
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Pill ok={pushSupported()} label={pushSupported() ? "Supported" : "Unsupported"} />
          <Pill ok={pushState === "subscribed"} label={`State: ${pushState}`} />
          <Pill
            ok={Boolean(data?.configured)}
            label={data?.configured ? "VAPID configured" : "VAPID missing"}
          />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void togglePush()}
            disabled={busy || !pushSupported() || pushState === "denied"}
            className="rounded-full bg-gold px-4 py-2 text-[12px] font-bold text-navy transition-opacity disabled:opacity-50"
          >
            {pushState === "subscribed" ? "Unsubscribe" : "Enable notifications"}
          </button>
          <button
            type="button"
            onClick={() => void testPush()}
            disabled={busy || pushState !== "subscribed"}
            className="flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-[12px] font-bold text-cream transition-colors hover:bg-white/14 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Send test push
          </button>
        </div>

        <Field label="Permission" value={pushSupported() ? Notification.permission : "n/a"} />
        <Field label="Last action" value={lastAction} />
        <Field
          label="Browser endpoint"
          value={subscription ? shorten(subscription.endpoint) : "no subscription"}
          mono
        />
        <Field label="p256dh key" value={subscription ? shorten(subscription.p256dh, 18, 8) : "—"} mono />
        <Field label="auth secret" value={subscription ? shorten(subscription.auth, 10, 6) : "—"} mono />
        <Field
          label="Public VAPID key"
          value={data?.publicKey ? shorten(data.publicKey, 20, 8) : "—"}
          mono
        />
      </Section>

      {/* -------------------------------------------- stored + dispatch */}
      <Section
        icon={DatabaseZap}
        title="Stored devices & last dispatch"
        hint="Subscriptions saved on the server and the most recent push that was dispatched to you."
      >
        {server.isLoading && <p className="text-[12px] text-cream/50">Loading…</p>}
        {server.isError && <p className="text-[12px] text-red-300">Could not load server state.</p>}
        {data && (
          <>
            <Field label="Registered devices" value={String(data.devices.length)} />
            <Field label="Unpushed unread notifications" value={String(data.pendingCount)} />
            <Field
              label="Last dispatch"
              value={
                data.lastDispatch
                  ? `${data.lastDispatch.title} · ${when(data.lastDispatch.pushSentAt)}`
                  : "no dispatch recorded yet"
              }
            />
            <Field
              label="Last dispatch type"
              value={data.lastDispatch ? data.lastDispatch.type : "—"}
            />

            <ul className="mt-3 space-y-2">
              {data.devices.map((device) => (
                <li key={device.id} className="rounded-2xl bg-white/5 p-3">
                  <p className="break-all font-mono text-[11px] text-cream/80">
                    {shorten(device.endpoint)}
                  </p>
                  <p className="mt-1 text-[11px] text-cream/45">
                    {device.userAgent ? shorten(device.userAgent, 46, 0) : "unknown agent"} ·{" "}
                    {device.locale ?? "—"} · failures {device.failureCount} ·{" "}
                    {device.disabledAt ? "disabled" : "active"}
                  </p>
                  <p className="mt-1 text-[11px] text-cream/35">
                    created {when(device.createdAt)} · last used {when(device.lastUsedAt)}
                  </p>
                </li>
              ))}
              {data.devices.length === 0 && (
                <li className="text-[12px] text-cream/50">No subscriptions stored yet.</li>
              )}
            </ul>
          </>
        )}
      </Section>

      {/* ------------------------------------------------ sw + caches */}
      <Section
        icon={ShieldCheck}
        title="Service worker"
        hint="The worker is intentionally disabled in dev and inside the editor preview."
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Pill ok={Boolean(sw?.supported)} label="API available" />
          <Pill ok={Boolean(sw?.allowed)} label={sw?.allowed ? "Allowed here" : "Blocked here"} />
          <Pill ok={sw?.activeState === "activated"} label={`Active: ${sw?.activeState ?? "none"}`} />
          <Pill ok={Boolean(sw?.controlled)} label={sw?.controlled ? "Controlling page" : "Not controlling"} />
        </div>
        <Field label="Registrations" value={String(sw?.registrations ?? 0)} />
        <Field label="Installing" value={sw?.installing ? "yes" : "no"} />
        <Field label="Waiting update" value={sw?.waiting ? "yes" : "no"} />
        <Field label="Script" value={sw?.scriptURL ?? "—"} mono />
        <Field label="Scope" value={sw?.scope ?? "—"} mono />
        <Field label="App version" value={APP_VERSION} />
        {sw?.error && <Field label="Error" value={sw.error} />}
      </Section>

      <Section icon={DatabaseZap} title="Cache storage" hint="Names, entry counts and sample paths.">
        {cacheList.length === 0 ? (
          <p className="text-[12px] text-cream/50">No caches on this origin.</p>
        ) : (
          <ul className="space-y-2">
            {cacheList.map((entry) => (
              <li key={entry.name} className="rounded-2xl bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="break-all font-mono text-[11px] text-cream/85">{entry.name}</span>
                  <span className="shrink-0 text-[11px] font-bold text-gold">
                    {entry.entries} entries
                  </span>
                </div>
                {entry.samples.length > 0 && (
                  <p className="mt-1 break-all font-mono text-[10px] text-cream/40">
                    {entry.samples.join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="h-8" />
    </Screen>
  );
}