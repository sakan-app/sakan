import { z } from "zod";

/** Shared production validation schemas. Never trust client input. */

export const emailSchema = z.string().trim().min(1).email();
export const passwordSchema = z.string().min(8).max(72);
export const displayNameSchema = z.string().trim().min(2).max(60);

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    displayName: displayNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "passwordMismatch" });

export const resetRequestSchema = z.object({ email: emailSchema });

export const MIN_AGE = 18;
export const MAX_AGE = 99;

export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const birth = new Date(value);
    if (Number.isNaN(birth.getTime())) return false;
    const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= MIN_AGE && age <= 120;
  }, "ageError");

/** ISO-2 country code, or the "OTHER" sentinel with a free-text country. */
export const countryCodeSchema = z.string().regex(/^([A-Z]{2}|OTHER)$/);
export const bioSchema = z.string().trim().max(1200);

export const profileFormSchema = z.object({
  display_name: displayNameSchema,
  birth_date: birthDateSchema,
  gender: z.enum(["male", "female"]),
  looking_for: z.enum(["male", "female"]),
  country_code: countryCodeSchema,
  city: z.string().trim().max(80).optional(),
  bio: bioSchema.optional(),
  occupation: z.string().trim().max(80).optional(),
  education: z.string().trim().max(80).optional(),
  marital_status: z.enum(["single", "divorced", "widowed"]).optional(),
  religiosity: z.enum(["practicing", "moderate", "cultural", "prefer_not_say"]).optional(),
  height_cm: z.number().int().min(120).max(230).optional(),
  interests: z.array(z.string().trim().min(1).max(30)).max(20),
  spoken_languages: z.array(z.string().trim().min(1).max(30)).max(10),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const imageFileSchema = z.object({
  type: z.enum(ALLOWED_IMAGE_TYPES),
  size: z.number().max(MAX_IMAGE_BYTES),
});

export type ImageError = "type" | "size";

export function validateImageFile(file: File): ImageError | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return "type";
  if (file.size > MAX_IMAGE_BYTES) return "size";
  return null;
}

export const searchParamsSchema = z.object({
  iAm: z.enum(["male", "female"]).catch("male"),
  lookingFor: z.enum(["male", "female"]).catch("female"),
  minAge: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE).catch(MIN_AGE),
  maxAge: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE).catch(60),
  country: z.string().catch("all"),
  sort: z.enum(["recent", "newest", "complete"]).catch("recent"),
  page: z.coerce.number().int().min(1).max(200).catch(1),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
