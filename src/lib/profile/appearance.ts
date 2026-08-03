import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { ProfileRow } from "@/lib/profile-queries";

export type PresenceStatus = Database["public"]["Enums"]["presence_status"];
export type ProfileTheme = Database["public"]["Enums"]["profile_theme"];
export type AvatarBorder = Database["public"]["Enums"]["avatar_border"];

export const PROFILE_THEMES: ProfileTheme[] = ["navy", "aurora", "sand", "emerald", "rose", "midnight"];
export const AVATAR_BORDERS: AvatarBorder[] = ["none", "gold", "glow", "gradient", "verified"];
export const PRESENCE_STATUSES: PresenceStatus[] = ["online", "away", "busy", "dnd", "invisible"];

export const ACCENT_PRESETS = ["#D4AF37", "#E7C873", "#6EA8FE", "#59C9A5", "#E28FA8", "#B79CED"];

/** Background gradient per theme. */
export const THEME_GRADIENT: Record<ProfileTheme, string> = {
  navy: "linear-gradient(135deg, oklch(0.22 0.06 264), oklch(0.16 0.05 264))",
  aurora: "linear-gradient(135deg, oklch(0.32 0.11 220), oklch(0.24 0.10 300))",
  sand: "linear-gradient(135deg, oklch(0.38 0.06 80), oklch(0.22 0.04 60))",
  emerald: "linear-gradient(135deg, oklch(0.34 0.09 165), oklch(0.20 0.06 190))",
  rose: "linear-gradient(135deg, oklch(0.36 0.10 10), oklch(0.22 0.07 340))",
  midnight: "linear-gradient(135deg, oklch(0.18 0.03 270), oklch(0.10 0.02 270))",
};

export const PRESENCE_DOT: Record<PresenceStatus, string> = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  busy: "bg-orange-400",
  dnd: "bg-red-400",
  invisible: "bg-cream/40",
};

export type AppearanceSettings = {
  coverUrl: string | null;
  accentColor: string;
  profileTheme: ProfileTheme;
  glassIntensity: number;
  avatarBorder: AvatarBorder;
};

export type PresenceSettings = {
  presenceStatus: PresenceStatus;
  hideLastSeen: boolean;
  hideTyping: boolean;
};

export function appearanceOf(profile: ProfileRow): AppearanceSettings {
  return {
    coverUrl: profile.cover_url,
    accentColor: profile.accent_color,
    profileTheme: profile.profile_theme,
    glassIntensity: profile.glass_intensity,
    avatarBorder: profile.avatar_border,
  };
}

export function presenceOf(profile: ProfileRow): PresenceSettings {
  return {
    presenceStatus: profile.presence_status,
    hideLastSeen: profile.hide_last_seen,
    hideTyping: profile.hide_typing,
  };
}

/** Ring classes for the avatar, derived from the chosen border style. */
export function avatarBorderClass(border: AvatarBorder): string {
  switch (border) {
    case "gold":
      return "ring-2 ring-gold-deep";
    case "glow":
      return "ring-2 ring-gold-deep shadow-[0_0_28px_-4px_var(--sakan-accent)]";
    case "gradient":
      return "ring-2 ring-gold/60";
    case "verified":
      return "ring-2 ring-sky-400";
    default:
      return "ring-1 ring-white/15";
  }
}

const MAX_COVER_BYTES = 8 * 1024 * 1024;
const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type CoverError = "size" | "type";

export function validateCover(file: File): CoverError | null {
  if (!COVER_TYPES.includes(file.type)) return "type";
  if (file.size > MAX_COVER_BYTES) return "size";
  return null;
}

/** Uploads a cover photo to the private gallery bucket and returns its path. */
export async function uploadCover(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/cover-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("gallery")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function signedCoverUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage.from("gallery").createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export const coverUrlQuery = (path: string | null | undefined) =>
  queryOptions({
    queryKey: ["cover-url", path],
    queryFn: () => signedCoverUrl(path),
    staleTime: 50 * 60 * 1000,
  });

export type StrengthSegment = { key: StrengthKey; done: boolean; weight: number };
export type StrengthKey =
  | "avatar"
  | "cover"
  | "bio"
  | "interests"
  | "details"
  | "languages"
  | "verified";

/** Profile strength: content quality plus personalization signals. */
export function profileStrength(profile: ProfileRow): { score: number; segments: StrengthSegment[] } {
  const segments: StrengthSegment[] = [
    { key: "avatar", done: Boolean(profile.avatar_url), weight: 20 },
    { key: "cover", done: Boolean(profile.cover_url), weight: 10 },
    { key: "bio", done: (profile.bio?.length ?? 0) >= 60, weight: 20 },
    { key: "interests", done: profile.interests.length >= 3, weight: 15 },
    { key: "details", done: Boolean(profile.occupation && profile.education), weight: 15 },
    { key: "languages", done: profile.spoken_languages.length > 0, weight: 10 },
    { key: "verified", done: profile.is_verified, weight: 10 },
  ];
  const score = segments.reduce((sum, s) => sum + (s.done ? s.weight : 0), 0);
  return { score: Math.min(100, score), segments };
}
