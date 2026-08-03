import { useI18n } from "@/lib/i18n";
import { chatStrings } from "@/lib/chat/strings";
import { profileStudioStrings } from "@/lib/profile/strings";
import type { PresenceStatus } from "@/lib/profile/appearance";

/** Every state the indicator can render, including the derived "offline". */
export type EffectivePresence = PresenceStatus | "offline";

const DOT: Record<EffectivePresence, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  busy: "bg-orange-400",
  dnd: "bg-red-400",
  invisible: "bg-cream/40",
  offline: "bg-cream/30",
};

const SIZE = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
} as const;

/**
 * Resolves the presence a *viewer* is allowed to see. Invisible members and
 * privacy-hidden presence always collapse to "offline".
 */
export function resolvePresence(
  status: PresenceStatus | "offline_hidden" | null | undefined,
  online: boolean,
  away = false,
): EffectivePresence {
  if (!status || status === "offline_hidden" || status === "invisible") return "offline";
  if (!online) return "offline";
  if (status === "online" && away) return "away";
  return status;
}

export function usePresenceLabel(state: EffectivePresence): string {
  const { locale } = useI18n();
  if (state === "offline") return chatStrings[locale].offline;
  if (state === "online") return chatStrings[locale].online;
  return profileStudioStrings[locale].statuses[state];
}

type Props = {
  state: EffectivePresence;
  size?: keyof typeof SIZE;
  /** Renders the translated status next to the dot. */
  withLabel?: boolean;
  /** Positions the dot over an avatar corner. */
  overlay?: boolean;
  /** Hide entirely when offline (used on dense cards). */
  hideOffline?: boolean;
  className?: string;
};

/**
 * Unified presence dot used on member cards, the chat header, the conversation
 * list and notifications. Always exposes an accessible, translated label.
 */
export function PresenceIndicator({
  state,
  size = "md",
  withLabel = false,
  overlay = false,
  hideOffline = false,
  className = "",
}: Props) {
  const label = usePresenceLabel(state);
  if (hideOffline && state === "offline") return null;

  const dot = (
    <span
      className={`inline-block shrink-0 rounded-full ${SIZE[size]} ${DOT[state]} ${
        overlay ? "absolute bottom-0 end-0 ring-2 ring-navy-deep" : ""
      }`}
    />
  );

  if (!withLabel) {
    return (
      <span className={overlay ? className : `inline-flex ${className}`} title={label}>
        {dot}
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={label}>
      {dot}
      <span>{label}</span>
    </span>
  );
}
