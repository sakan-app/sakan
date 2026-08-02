import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ChatStrings } from "@/lib/chat/strings";

export type ViewerImage = { id: string; url: string; name: string };

type Props = {
  images: ViewerImage[];
  startId: string;
  strings: ChatStrings;
  onClose: () => void;
};

export function ImageViewer({ images, startId, strings, onClose }: Props) {
  const initial = Math.max(0, images.findIndex((i) => i.id === startId));
  const [index, setIndex] = useState(initial);
  const [zoom, setZoom] = useState(1);
  const touchStart = useRef<number | null>(null);
  const current = images[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(images.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  useEffect(() => setZoom(1), [index]);

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={strings.openImage}
      className="fade-up fixed inset-0 z-[60] flex flex-col bg-navy-deep/97 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-3 pt-[calc(env(safe-area-inset-top)+0.6rem)] pb-2">
        <p className="min-w-0 flex-1 truncate text-sm text-cream/80">{current.name}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={strings.zoomOut}
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}
            className="grid h-9 w-9 place-items-center rounded-full text-cream/80 hover:bg-cream/10"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label={strings.zoomIn}
            onClick={() => setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)))}
            className="grid h-9 w-9 place-items-center rounded-full text-cream/80 hover:bg-cream/10"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <a
            href={current.url}
            download={current.name}
            target="_blank"
            rel="noreferrer"
            aria-label={strings.download}
            className="grid h-9 w-9 place-items-center rounded-full text-cream/80 hover:bg-cream/10"
          >
            <Download className="h-5 w-5" />
          </a>
          <button
            type="button"
            aria-label={strings.closeViewer}
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-cream/80 hover:bg-cream/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="flex flex-1 items-center justify-center overflow-auto px-3 pb-6"
        onTouchStart={(e) => {
          touchStart.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          const end = e.changedTouches[0]?.clientX ?? null;
          touchStart.current = null;
          if (start == null || end == null || zoom > 1) return;
          const delta = end - start;
          if (Math.abs(delta) < 50) return;
          setIndex((i) => (delta < 0 ? Math.min(images.length - 1, i + 1) : Math.max(0, i - 1)));
        }}
      >
        <img
          src={current.url}
          alt={current.name}
          onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 2))}
          style={{ transform: `scale(${zoom})` }}
          className="max-h-full max-w-full rounded-xl object-contain transition-transform duration-200"
        />
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <button
            type="button"
            aria-label={strings.previousImage}
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="grid h-10 w-10 place-items-center rounded-full bg-cream/10 text-cream disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" />
          </button>
          <span className="text-xs tabular-nums text-cream/70">
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            aria-label={strings.nextImage}
            disabled={index === images.length - 1}
            onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
            className="grid h-10 w-10 place-items-center rounded-full bg-cream/10 text-cream disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5 rtl:-scale-x-100" />
          </button>
        </div>
      )}
    </div>
  );
}