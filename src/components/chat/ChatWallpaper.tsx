import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { findWallpaper, ensureReadable, type WallpaperSettings } from "@/lib/chat/wallpapers";
import { wallpaperUrlQuery } from "@/lib/chat/wallpaper-queries";

type Props = {
  settings: WallpaperSettings;
  /** Rendered inside a `relative` container; sits behind the message list. */
  className?: string;
};

/**
 * Renders the wallpaper as three stacked, non-interactive layers:
 * image (cover, never stretched) → readability scrim → content.
 * Switching wallpapers cross-fades instead of popping.
 */
export function ChatWallpaper({ settings: raw, className = "" }: Props) {
  const settings = ensureReadable(raw);
  const isCustom = settings.wallpaperType === "custom";
  const urlQ = useQuery(wallpaperUrlQuery(isCustom ? settings.customImage : null));
  const builtin = findWallpaper(settings.wallpaperId);

  const signature = `${settings.wallpaperType}:${settings.wallpaperId}:${settings.customImage ?? ""}`;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const handle = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(handle);
  }, [signature]);

  if (settings.wallpaperType === "none") return null;

  const background = isCustom
    ? urlQ.data
      ? `url("${urlQ.data}")`
      : "linear-gradient(180deg, #0A1430, #0D1B3D)"
    : builtin.image;

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        key={signature}
        className="absolute inset-0 motion-safe:transition-opacity motion-safe:duration-500"
        style={{
          background,
          backgroundSize: isCustom ? "cover" : undefined,
          backgroundPosition: "center",
          backgroundRepeat: isCustom ? "no-repeat" : undefined,
          filter: `blur(${settings.blur}px) brightness(${settings.brightness}%)`,
          transform: settings.blur > 0 ? `scale(${1 + settings.blur / 100})` : undefined,
          opacity: visible ? settings.opacity / 100 : 0,
        }}
      />
      {/* Contrast guard: keeps bubble text above AA on any wallpaper. */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(7, 12, 28, ${settings.overlay / 100})` }}
      />
    </div>
  );
}
