import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

/** True when the browser reports no connectivity. */
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Distinguishes "the network is unavailable" from "the session is invalid".
 * Supabase surfaces transport failures as AuthRetryableFetchError (status 0 or
 * undefined) or as a raw TypeError from fetch.
 */
export function isNetworkAuthError(error: unknown): boolean {
  if (!error) return false;
  const err = error as { name?: string; status?: number; message?: string };
  if (err.name === "AuthRetryableFetchError") return true;
  if (typeof err.status === "number" && err.status !== 0) return false;
  const message = (err.message ?? "").toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed") ||
    message.includes("fetch") ||
    err.status === 0 ||
    err.status === undefined
  );
}

/**
 * Resolves the current user for route guards without treating a dead network
 * as a sign-out. Offline (or on a transport error) it falls back to the
 * session persisted in localStorage, so previously visited authenticated
 * routes keep working instead of bouncing to /auth → onboarding.
 */
export async function resolveGuardUser(): Promise<Session["user"] | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const cached = sessionData.session?.user ?? null;

  if (isOffline()) return cached;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (data?.user) return data.user;
    if (error && isNetworkAuthError(error)) return cached;
    return null;
  } catch (error) {
    return isNetworkAuthError(error) ? cached : null;
  }
}