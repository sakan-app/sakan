/** Shared glassmorphism primitives for the SAKAN admin dashboard. */
import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-cream sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-cream/60">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("glass-card rounded-2xl p-4 sm:p-6", className)}>{children}</section>;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string | undefined;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "gold" | "danger";
}) {
  return (
    <div className="glass-tile rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-cream/55">{label}</p>
        {Icon ? (
          <Icon
            className={cn(
              "h-4 w-4",
              tone === "gold" ? "text-gold" : tone === "danger" ? "text-red-400" : "text-cream/50",
            )}
          />
        ) : null}
      </div>
      <p className={cn("mt-3 text-2xl font-bold tabular-nums", tone === "danger" ? "text-red-300" : "text-cream")}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-cream/45">{hint}</p> : null}
    </div>
  );
}

const PILL_TONES: Record<string, string> = {
  neutral: "bg-cream/10 text-cream/70 border-cream/15",
  success: "bg-emerald-500/12 text-emerald-300 border-emerald-400/25",
  warning: "bg-amber-500/12 text-amber-300 border-amber-400/25",
  danger: "bg-red-500/12 text-red-300 border-red-400/25",
  gold: "bg-gold/12 text-gold border-gold/30",
};

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof PILL_TONES }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        PILL_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-sm text-cream/60">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
      <p className="text-sm text-cream/70">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="chip-glass px-4 py-2 text-xs font-semibold">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <div className="py-14 text-center text-sm text-cream/50">{label}</div>;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cream/10 px-1 pt-3 text-xs text-cream/60">
      <span>
        {total} total · page {page} / {pages}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="chip-glass px-3 py-1.5 font-semibold disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="chip-glass px-3 py-1.5 font-semibold disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function TableShell({
  head,
  children,
  caption,
}: {
  head: ReactNode;
  children: ReactNode;
  /** Screen-reader description of the table contents. */
  caption?: string;
}) {
  return (
    <div
      className="overflow-x-auto"
      // Scrollable regions must be reachable by keyboard (WCAG 2.1.1).
      tabIndex={0}
      role="group"
      aria-label={caption}
    >
      <table className="w-full min-w-[720px] border-collapse text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="text-[11px] uppercase tracking-wide text-cream/45">{head}</thead>
        <tbody className="divide-y divide-cream/8">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn("whitespace-nowrap px-3 py-2 text-start font-semibold", className)}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3 align-middle text-cream/80", className)}>{children}</td>;
}

export function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "glass-field w-full rounded-xl px-3 py-2 text-sm text-cream placeholder:text-cream/35 focus:outline-none",
        props.className,
      )}
    />
  );
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "glass-field rounded-xl bg-navy-deep px-3 py-2 text-sm text-cream focus:outline-none [&>option]:bg-navy-deep",
        props.className,
      )}
    />
  );
}

export function ActionButton({
  children,
  tone = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "default" | "gold" | "danger" }) {
  return (
    <button
      {...props}
      className={cn(
        "rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40",
        tone === "gold"
          ? "bg-gold text-navy-deep hover:brightness-110"
          : tone === "danger"
            ? "border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            : "chip-glass",
        props.className,
      )}
    >
      {children}
    </button>
  );
}
