import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { validateImageFile } from "@/lib/validation";

export type GalleryPhoto = {
  id: string;
  path: string;
  url: string | null;
  position: number;
};

export const myGalleryQuery = (userId: string) =>
  queryOptions({
    queryKey: ["gallery", userId],
    queryFn: async (): Promise<GalleryPhoto[]> => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, storage_path, position")
        .eq("user_id", userId)
        .eq("kind", "gallery")
        .order("position", { ascending: true });
      if (error) throw error;
      const rows = data ?? [];
      if (rows.length === 0) return [];
      const { data: signed } = await supabase.storage
        .from("gallery")
        .createSignedUrls(
          rows.map((r) => r.storage_path),
          60 * 60,
        );
      const urls = new Map((signed ?? []).map((s) => [s.path ?? "", s.signedUrl]));
      return rows.map((r) => ({
        id: r.id,
        path: r.storage_path,
        url: urls.get(r.storage_path) ?? null,
        position: r.position,
      }));
    },
    staleTime: 50 * 60 * 1000,
  });

export async function uploadGalleryPhoto(userId: string, file: File, position: number) {
  const invalid = validateImageFile(file);
  if (invalid) throw new Error(invalid);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/gallery-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("gallery")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;
  const { error } = await supabase
    .from("photos")
    .insert({ user_id: userId, storage_path: path, kind: "gallery", position });
  if (error) throw error;
  return path;
}

export async function deleteGalleryPhoto(photoId: string, path: string) {
  const { error } = await supabase.from("photos").delete().eq("id", photoId);
  if (error) throw error;
  await supabase.storage.from("gallery").remove([path]);
}
