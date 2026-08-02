import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "إتمام تسجيل الدخول | سَكَن" },
      { name: "description", content: "جارٍ إتمام عملية تسجيل الدخول إلى منصة سَكَن." },
      { property: "og:title", content: "إتمام تسجيل الدخول | سَكَن" },
      { property: "og:description", content: "جارٍ إتمام عملية تسجيل الدخول إلى منصة سَكَن." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function finish() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", data.session.user.id)
          .maybeSingle();
        void navigate({
          to: profile?.onboarding_completed ? "/profile" : "/onboarding",
          replace: true,
        });
      } else {
        void navigate({ to: "/auth", replace: true });
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void finish();
    });
    void finish();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deep">
      <div className="flex flex-col items-center gap-3 text-cream/80">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
        <p className="text-sm">{t.auth.callbackTitle}</p>
      </div>
    </div>
  );
}