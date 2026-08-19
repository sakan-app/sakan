import { useCallback, useEffect, useRef, useState } from "react";

/** Output size of a featured creative (portrait 3:4). */
const OUT_W = 900;
const OUT_H = 1200;

type Props = {
  file: File;
  label: string;
  zoomLabel: string;
  hint: string;
  /** Called whenever the framing changes, with the rendered banner. */
  onChange: (blob: Blob) => void;
};

/**
 * Lightweight preview + crop + zoom for a featured creative.
 *
 * The user drags the photo inside a fixed 3:4 portrait frame and zooms with a
 * slider; the framing is rendered to a canvas so the uploaded file is exactly
 * what the featured area will show (cover, never stretched).
 */
export function CreativeCropper({ file, label, zoomLabel, hint, onChange }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    ctx.clearRect(0, 0, OUT_W, OUT_H);

    const base = Math.max(OUT_W / img.width, OUT_H / img.height);
    const scale = base * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (OUT_W - w) / 2 + offset.x * (OUT_W / FRAME_W);
    const y = (OUT_H - h) / 2 + offset.y * (OUT_H / FRAME_H);
    ctx.drawImage(img, x, y, w, h);

    canvas.toBlob(
      (blob) => {
        if (blob) onChange(blob);
      },
      "image/jpeg",
      0.9,
    );
  }, [img, zoom, offset, onChange]);

  useEffect(() => {
    render();
  }, [render]);

  if (!url) return null;

  return (
    <div className="sm:col-span-2">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-cream/60">{label}</p>
      <div
        className="relative h-[200px] w-full cursor-grab overflow-hidden rounded-2xl border border-gold/25 bg-navy-deep active:cursor-grabbing"
        onPointerDown={(e) => {
          dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const start = dragRef.current;
          if (!start) return;
          setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      >
        <img
          src={url}
          alt=""
          draggable={false}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
          style={{
            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            minWidth: "100%",
            minHeight: "100%",
          }}
        />
        <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-cream/10" />
      </div>
      <label className="mt-3 block">
        <span className="flex items-center justify-between text-[11px] font-semibold text-cream/70">
          {zoomLabel}
          <span className="tabular-nums text-cream/50">{zoom.toFixed(1)}×</span>
        </span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-cream/15 accent-gold"
        />
      </label>
      <p className="mt-1 text-[11px] text-cream/50">{hint}</p>
      <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
    </div>
  );
}