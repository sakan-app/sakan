import { supabase } from "@/integrations/supabase/client";

export type GoogleSignInResult = {
  redirected: boolean;
  error?: Error;
};

export async function signInWithGoogle(redirectTo: string): Promise<GoogleSignInResult> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    return {
      redirected: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  return { redirected: true };
}
