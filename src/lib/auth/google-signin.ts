import { supabase } from "@/integrations/supabase/client";

const MANAGED_OAUTH_BROKER_URL =
  "https://sakan-connect-prototype.lovable.app/~oauth/initiate";

/**
 * The relative `/~oauth/initiate` broker path only exists on Lovable-hosted
 * origins. Self-hosted deployments use the project's stable Lovable broker
 * URL so managed Google credentials continue to work without a local proxy.
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

  // Self-hosted origin (Vercel/custom domain): use the same managed broker via
  // its stable Lovable-hosted URL. Direct provider access requires a separate
  // Google secret in the auth service and fails when only managed OAuth is set.
  const params = new URLSearchParams({
    provider: "google",
    redirect_uri: redirectTo,
    prompt: "select_account",
  });
  window.location.assign(`${MANAGED_OAUTH_BROKER_URL}?${params.toString()}`);
  return { redirected: true };
}
