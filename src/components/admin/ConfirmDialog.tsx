import { useEffect, useState, type ReactNode } from "react";

import { ActionButton, AdminInput } from "@/components/admin/ui";

export type ConfirmRequest = {
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  requireReason?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
};

/** Blocking confirmation sheet for dangerous or irreversible admin actions. */
export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReason("");
    setBusy(false);
  }, [request]);

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md rounded-2xl p-6">
        <h2 className="text-lg font-bold text-cream">{request.title}</h2>
        {request.description ? <p className="mt-2 text-sm text-cream/65">{request.description}</p> : null}
        {request.requireReason ? (
          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-cream/50" htmlFor="confirm-reason">
              Reason (logged)
            </label>
            <AdminInput
              id="confirm-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why are you doing this?"
              className="mt-2"
            />
          </div>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <ActionButton onClick={onClose} disabled={busy}>
            Cancel
          </ActionButton>
          <ActionButton
            tone={request.destructive ? "danger" : "gold"}
            disabled={busy || (request.requireReason && reason.trim().length === 0)}
            onClick={async () => {
              setBusy(true);
              try {
                await request.onConfirm(reason.trim());
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working…" : (request.confirmLabel ?? "Confirm")}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

export function useConfirm(): [ConfirmRequest | null, (request: ConfirmRequest) => void, () => void, ReactNode] {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const close = () => setRequest(null);
  return [request, setRequest, close, <ConfirmDialog key="confirm" request={request} onClose={close} />];
}
