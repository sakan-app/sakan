import type { ChatStrings } from "@/lib/chat/strings";

type Props = {
  strings: ChatStrings;
  canDeleteForEveryone: boolean;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onClose: () => void;
};

export function DeleteMessageDialog({
  strings,
  canDeleteForEveryone,
  onDeleteForMe,
  onDeleteForEveryone,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-deep/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fade-up relative w-full max-w-sm rounded-t-3xl border border-gold/20 bg-navy-deep p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[var(--shadow-card)] sm:rounded-3xl">
        <h2 className="text-sm font-bold text-cream">{strings.deleteTitle}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-cream/60">{strings.deleteText}</p>
        <div className="mt-5 space-y-2">
          {canDeleteForEveryone && (
            <button
              type="button"
              onClick={onDeleteForEveryone}
              className="tap-scale w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300"
            >
              {strings.deleteForEveryone}
            </button>
          )}
          <button
            type="button"
            onClick={onDeleteForMe}
            className="tap-scale w-full rounded-xl border border-gold/25 px-4 py-2.5 text-sm font-semibold text-cream"
          >
            {strings.deleteForMe}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl px-4 py-2.5 text-sm text-cream/60 hover:bg-cream/5"
          >
            {strings.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}