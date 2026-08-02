import type { Dictionary } from "@/i18n";

/** Maps a Supabase auth error to a translated, user-facing message. */
export function authErrorMessage(error: unknown, t: Dictionary): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const haystack = `${code} ${message}`.toLowerCase();

  if (haystack.includes("invalid login") || haystack.includes("invalid_credentials")) {
    return t.auth.errors.invalidCredentials;
  }
  if (haystack.includes("email not confirmed") || haystack.includes("email_not_confirmed")) {
    return t.auth.errors.emailNotConfirmed;
  }
  if (haystack.includes("rate limit") || haystack.includes("over_email_send_rate_limit")) {
    return t.auth.errors.rateLimit;
  }
  if (haystack.includes("weak") || haystack.includes("pwned") || haystack.includes("leaked")) {
    return t.auth.errors.weakPassword;
  }
  if (haystack.includes("already registered") || haystack.includes("user_already_exists")) {
    return t.auth.errors.userExists;
  }
  return message || t.auth.errors.generic;
}