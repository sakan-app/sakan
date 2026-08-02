import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SETTINGS,
  ensureReadable,
  type WallpaperSettings,
} from "@/lib/chat/wallpapers";

export const wallpaperKeys = {
  all: (userId: string) => ["chat", "wallpapers", userId] as const,
};

type Row = {
  conversation_id: string | null;
  wallpaper_id: string;
  wallpaper_type: string;
  custom_image: string | null;
  opacity: number;
  blur: number;
  brightness: number;
  overlay: number;
};

export type WallpaperMap = {
  /** Applies to every conversation without an override. */
  global: WallpaperSettings;
  /** Per-conversation overrides. */
  byConversation: Record<string, WallpaperSettings>;
};

function toSettings(row: Row): WallpaperSettings {
  return ensureReadable({
    wallpaperId: row.wallpaper_id,
    wallpaperType: (row.wallpaper_type as WallpaperSettings["wallpaperType"]) ?? "builtin",
    customImage: row.custom_image,
    opacity: row.opacity,
    blur: row.blur,
    brightness: row.brightness,
    overlay: row.overlay,
  });
}

export function wallpapersQuery(userId: string) {
  return queryOptions({
    queryKey: wallpaperKeys.all(userId),
    queryFn: async (): Promise<WallpaperMap> => {
      const result: WallpaperMap = { global: DEFAULT_SETTINGS, byConversation: {} };
      if (!userId) return result;
      const { data, error } = await supabase
        .from("chat_wallpapers")
        .select("conversation_id, wallpaper_id, wallpaper_type, custom_image, opacity, blur, brightness, overlay")
        .eq("user_id", userId);
      if (error) throw error;
      for (const row of (data ?? []) as Row[]) {
        if (row.conversation_id) result.byConversation[row.conversation_id] = toSettings(row);
        else result.global = toSettings(row);
      }
      return result;
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

export function resolveSettings(map: WallpaperMap | undefined, conversationId: string | null): WallpaperSettings {
  if (!map) return DEFAULT_SETTINGS;
  if (conversationId && map.byConversation[conversationId]) return map.byConversation[conversationId]!;
  return map.global;
}

export async function saveWallpaper(
  queryClient: QueryClient,
  args: { userId: string; conversationId: string | null; settings: WallpaperSettings },
) {
  const settings = ensureReadable(args.settings);
  const key = wallpaperKeys.all(args.userId);

  /* Optimistic: the picker preview and the chat update in the same frame. */
  const previous = queryClient.getQueryData<WallpaperMap>(key);
  queryClient.setQueryData<WallpaperMap>(key, (old) => {
    const base: WallpaperMap = old ?? { global: DEFAULT_SETTINGS, byConversation: {} };
    if (args.conversationId) {
      return { ...base, byConversation: { ...base.byConversation, [args.conversationId]: settings } };
    }
    return { ...base, global: settings };
  });

  const payload = {
    user_id: args.userId,
    conversation_id: args.conversationId,
    wallpaper_id: settings.wallpaperId,
    wallpaper_type: settings.wallpaperType,
    custom_image: settings.customImage,
    opacity: settings.opacity,
    blur: settings.blur,
    brightness: settings.brightness,
    overlay: settings.overlay,
  };

  const { error } = await supabase.from("chat_wallpapers").upsert(payload, {
    onConflict: args.conversationId ? "user_id,conversation_id" : "user_id",
    ignoreDuplicates: false,
  });

  if (error) {
    /* Postgres partial unique indexes are not addressable by onConflict, so
       fall back to an explicit update-or-insert on conflict failure. */
    const existing = supabase
      .from("chat_wallpapers")
      .select("id")
      .eq("user_id", args.userId);
    const { data: found } = args.conversationId
      ? await existing.eq("conversation_id", args.conversationId).maybeSingle()
      : await existing.is("conversation_id", null).maybeSingle();

    const retry = found
      ? await supabase.from("chat_wallpapers").update(payload).eq("id", found.id)
      : await supabase.from("chat_wallpapers").insert(payload);

    if (retry.error) {
      if (previous) queryClient.setQueryData(key, previous);
      throw retry.error;
    }
  }

  return settings;
}

export async function resetConversationWallpaper(
  queryClient: QueryClient,
  args: { userId: string; conversationId: string },
) {
  const key = wallpaperKeys.all(args.userId);
  queryClient.setQueryData<WallpaperMap>(key, (old) => {
    if (!old) return old;
    const next = { ...old.byConversation };
    delete next[args.conversationId];
    return { ...old, byConversation: next };
  });
  const { error } = await supabase
    .from("chat_wallpapers")
    .delete()
    .eq("user_id", args.userId)
    .eq("conversation_id", args.conversationId);
  if (error) throw error;
}

export const WALLPAPER_MAX_BYTES = 10 * 1024 * 1024;
export const WALLPAPER_MIME = ["image/jpeg", "image/png", "image/webp"];

export type UploadError = "type" | "size" | "failed" | "moderation";

/**
 * Downscales to at most 2048px on the long edge and re-encodes to webp before
 * upload, then stores it privately under `<userId>/`.
 */
async function optimize(file: File, maxEdge: number, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) throw new Error("encode");
  return blob;
}

export async function uploadCustomWallpaper(userId: string, file: File): Promise<string> {
  if (!WALLPAPER_MIME.includes(file.type)) throw new Error("type");
  if (file.size > WALLPAPER_MAX_BYTES) throw new Error("size");

  const stamp = Date.now();
  const base = `${userId}/${stamp}`;
  const [full, thumb] = await Promise.all([optimize(file, 2048, 0.85), optimize(file, 320, 0.7)]);

  const main = await supabase.storage
    .from("wallpapers")
    .upload(`${base}.webp`, full, { contentType: "image/webp", upsert: true });
  if (main.error) throw new Error("failed");

  /* Thumbnail is best-effort; the picker falls back to the full image. */
  await supabase.storage
    .from("wallpapers")
    .upload(`${base}-thumb.webp`, thumb, { contentType: "image/webp", upsert: true });

  return `${base}.webp`;
}

export async function signWallpaper(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("wallpapers").createSignedUrl(path, 60 * 60 * 6);
  if (error) return null;
  return data.signedUrl;
}

export function wallpaperUrlQuery(path: string | null) {
  return queryOptions({
    queryKey: ["chat", "wallpaper-url", path] as const,
    queryFn: () => signWallpaper(path),
    enabled: Boolean(path),
    staleTime: 60 * 60_000,
  });
}
