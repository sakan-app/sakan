import { supabase } from "@/integrations/supabase/client";

/**
 * The `/~oauth/initiate` broker path only exists on Lovable-hosted origins
 * (*.lovable.app / *.lovable.dev and Lovable-managed custom domains), where a
 * proxy worker intercepts it. On any other host (e.g. a Vercel deployment of
 * www.sakanapp.net) that path 404s, so we must talk to the auth provider
 * directly instead of going through the Lovable broker.
 */
export function isLovableHostedOrigin(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return (
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovable.dev") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

export type GoogleSignInResult = { redirected: boolean; error?: Error };

export async function signInWithGoogle(redirectTo: string): Promise<GoogleSignInResult> {
  if (isLovableHostedOrigin()) {
    // Preview / Lovable hosting: keep the managed broker flow (handles the
    // editor iframe popup and partitioned storage).
    const { lovable } = await import("@/integrations/lovable");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectTo,
    });
    if (result.error) {
      return {
        redirected: false,
        error: result.error instanceof Error ? result.error : new Error(String(result.error)),
      };
    }
    return { redirected: Boolean(result.redirected) };
  }

  // Self-hosted origin (Vercel/custom domain): full-page redirect straight to
  // the backend auth endpoint, which then hands off to Google.
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, queryParams: { prompt: "select_account" } },
  });
  if (error) return { redirected: false, error };
  return { redirected: true };
}
