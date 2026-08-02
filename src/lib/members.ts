import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Gender = Database["public"]["Enums"]["gender"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** Presentation shape consumed by the member cards and profile page. */
export type MemberView = {
  id: string;
  name: string;
  age: number | null;
  gender: Gender | null;
  lookingFor: Gender | null;
  countryCode: string | null;
  city: string | null;
  profilePhoto: string | null;
  gallery: string[];
  isVerified: boolean;
  bio: string | null;
  interests: string[];
  languages: string[];
  education: string | null;
  occupation: string | null;
  maritalStatus: Database["public"]["Enums"]["marital_status"] | null;
  religiosity: Database["public"]["Enums"]["religiosity_level"] | null;
  heightCm: number | null;
  online: boolean;
};

const ONLINE_WINDOW_MS = 15 * 60 * 1000;
export const PUBLIC_COLUMNS =
  "id, display_name, birth_date, gender, looking_for, country_code, city, bio, interests, spoken_languages, education, occupation, marital_status, religiosity, height_cm, is_verified, last_seen_at, avatar_url";

function ageFromBirthDate(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export type PublicProfile = Pick<
  ProfileRow,
  | "id"
  | "display_name"
  | "birth_date"
  | "gender"
  | "looking_for"
  | "country_code"
  | "city"
  | "bio"
  | "interests"
  | "spoken_languages"
  | "education"
  | "occupation"
  | "marital_status"
  | "religiosity"
  | "height_cm"
  | "is_verified"
  | "last_seen_at"
  | "avatar_url"
>;

/** Signs storage paths in bulk so private buckets can be rendered in the browser. */
async function signPaths(bucket: "avatars" | "gallery", paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return new Map<string, string>();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(unique, 60 * 60);
  if (error || !data) return new Map<string, string>();
  const map = new Map<string, string>();
  for (const entry of data) {
    if (entry.signedUrl && entry.path) map.set(entry.path, entry.signedUrl);
  }
  return map;
}

export async function toMemberViews(rows: PublicProfile[]): Promise<MemberView[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);

  const { data: photos } = await supabase
    .from("photos")
    .select("user_id, storage_path, kind, is_primary, position")
    .in("user_id", ids)
    .eq("is_approved", true)
    .neq("kind", "verification")
    .order("position", { ascending: true });

  const avatarPaths = rows.map((row) => row.avatar_url).filter((p): p is string => Boolean(p));
  const galleryPaths = (photos ?? [])
    .filter((p) => p.kind !== "avatar")
    .map((p) => p.storage_path);
  const avatarPhotoPaths = (photos ?? [])
    .filter((p) => p.kind === "avatar")
    .map((p) => p.storage_path);

  const [avatarUrls, galleryUrls] = await Promise.all([
    signPaths("avatars", [...avatarPaths, ...avatarPhotoPaths]),
    signPaths("gallery", galleryPaths),
  ]);

  return rows.map((row) => {
    const own = (photos ?? []).filter((p) => p.user_id === row.id);
    const gallery = own
      .filter((p) => p.kind !== "avatar")
      .map((p) => galleryUrls.get(p.storage_path))
      .filter((url): url is string => Boolean(url));
    const avatarFromPhotos = own.find((p) => p.kind === "avatar" && p.is_primary) ?? own[0];
    const profilePhoto =
      (row.avatar_url ? avatarUrls.get(row.avatar_url) : undefined) ??
      (avatarFromPhotos ? avatarUrls.get(avatarFromPhotos.storage_path) : undefined) ??
      gallery[0] ??
      null;

    return {
      id: row.id,
      name: row.display_name,
      age: ageFromBirthDate(row.birth_date),
      gender: row.gender,
      lookingFor: row.looking_for,
      countryCode: row.country_code,
      city: row.city,
      profilePhoto,
      gallery,
      isVerified: row.is_verified,
      bio: row.bio,
      interests: row.interests ?? [],
      languages: row.spoken_languages ?? [],
      education: row.education,
      occupation: row.occupation,
      maritalStatus: row.marital_status,
      religiosity: row.religiosity,
      heightCm: row.height_cm,
      online: Date.now() - new Date(row.last_seen_at).getTime() < ONLINE_WINDOW_MS,
    };
  });
}

export type MemberFilters = {
  lookingFor?: Gender | undefined;
  minAge?: number | undefined;
  maxAge?: number | undefined;
  country?: string | undefined;
  sort?: MemberSort | undefined;
};

export type MemberSort = "recent" | "newest" | "complete";

export const PAGE_SIZE = 24;

const SORT_COLUMN: Record<MemberSort, string> = {
  recent: "last_seen_at",
  newest: "created_at",
  complete: "completeness",
};

function birthRange(minAge?: number, maxAge?: number) {
  const now = new Date();
  const iso = (years: number) =>
    new Date(now.getFullYear() - years, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
  return {
    // Older bound: born on or before this date.
    newest: minAge != null ? iso(minAge) : null,
    oldest: maxAge != null ? iso(maxAge + 1) : null,
  };
}

async function fetchMembers(filters: MemberFilters, limit: number, offset = 0) {
  let query = supabase
    .from("profiles")
    .select(PUBLIC_COLUMNS, { count: "exact" })
    .eq("is_active", true)
    .eq("is_hidden", false)
    .order(SORT_COLUMN[filters.sort ?? "recent"], { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.lookingFor) query = query.eq("gender", filters.lookingFor);
  if (filters.country && filters.country !== "all") {
    query = query.eq("country_code", filters.country);
  }
  const { newest, oldest } = birthRange(filters.minAge, filters.maxAge);
  if (newest) query = query.lte("birth_date", newest);
  if (oldest) query = query.gte("birth_date", oldest);

  const { data, error, count } = await query;
  if (error) throw error;
  const items = await toMemberViews((data ?? []) as PublicProfile[]);
  return { items, total: count ?? items.length };
}

export const activeMembersQuery = (limit = 12) =>
  queryOptions({
    queryKey: ["members", "active", limit],
    queryFn: async () => (await fetchMembers({}, limit)).items,
    staleTime: 60_000,
    retry: 2,
  });

export const searchMembersQuery = (filters: MemberFilters, page = 1) =>
  queryOptions({
    queryKey: ["members", "search", filters, page],
    queryFn: () => fetchMembers(filters, PAGE_SIZE, (page - 1) * PAGE_SIZE),
    staleTime: 30_000,
    retry: 2,
  });

export const memberQuery = (id: string) =>
  queryOptions({
    queryKey: ["member", id],
    queryFn: async (): Promise<MemberView | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PUBLIC_COLUMNS)
        .eq("id", id)
        .eq("is_active", true)
        .eq("is_hidden", false)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [view] = await toMemberViews([data as PublicProfile]);
      return view ?? null;
    },
  });