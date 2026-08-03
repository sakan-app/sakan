import { useNavigate } from "@tanstack/react-router";
import { Phone, Video } from "lucide-react";
import { toast } from "sonner";

import { useFeatureStrings } from "@/i18n/feature";
import { useCalls } from "@/lib/calls/CallProvider";
import { callStrings } from "@/lib/calls/strings";
import type { CallKind, CallPeer } from "@/lib/calls/types";

/**
 * Chat-header call trigger. The plan check here is only for UX — the real
 * gate lives in `startCallFn` on the server.
 */
export function CallButton({
  kind,
  conversationId,
  peer,
}: {
  kind: CallKind;
  conversationId: string;
  peer: CallPeer;
}) {
  const s = useFeatureStrings(callStrings);
  const { canPlace, place, state } = useCalls();
  const navigate = useNavigate();
  const allowed = canPlace(kind);
  const label = kind === "video" ? s.videoCall : s.voiceCall;
  const busy = state.phase !== "idle" && state.phase !== "ended";
  const Icon = kind === "video" ? Video : Phone;

  return (
    <button
      type="button"
      aria-label={label}
      title={allowed ? label : kind === "video" ? s.premiumVideo : s.premiumVoice}
      disabled={busy}
      onClick={() => {
        if (!allowed) {
          toast(kind === "video" ? s.premiumVideo : s.premiumVoice, {
            action: { label: s.upgrade, onClick: () => void navigate({ to: "/billing" }) },
          });
          return;
        }
        void place({ conversationId, kind, peer });
      }}
      className={`grid h-9 w-9 place-items-center rounded-full transition tap-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 disabled:opacity-40 ${
        allowed ? "text-gold hover:bg-gold/10" : "text-gold/45 hover:bg-gold/5"
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}