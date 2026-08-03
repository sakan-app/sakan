import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { authErrorMessage } from "@/lib/auth-errors";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/auth/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة | سَكَن" },
      { name: "description", content: "اختر كلمة مرور جديدة لحسابك على منصة سَكَن." },
      { property: "og:title", content: "تعيين كلمة مرور جديدة | سَكَن" },
      { property: "og:description", content: "اختر كلمة مرور جديدة لحسابك على منصة سَكَن." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
  errorComponent: RouteErrorBoundary,
});

function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError(t.auth.errors.passwordShort);
    if (password !== confirm) return setError(t.auth.errors.passwordMismatch);
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => void navigate({ to: "/home", replace: true }), 1200);
    } catch (err) {
      setError(authErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-navy-deep">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-14">
        <div className="panel-navy w-full max-w-md p-7 sm:p-9">
          <h1 className="text-center text-2xl font-bold text-cream">{t.auth.newPasswordTitle}</h1>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-cream/80">{t.auth.newPassword}</span>
              <input
                type="password"
                dir="ltr"
                className="field-navy latin w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-cream/80">{t.auth.confirmPassword}</span>
              <input
                type="password"
                dir="ltr"
                className="field-navy latin w-full"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            {error && <p className="text-xs text-red-300">{error}</p>}
            {done && <p className="text-xs text-gold">{t.auth.passwordUpdated}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn-gold flex items-center justify-center gap-2 py-3 text-sm font-bold disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {t.auth.updatePassword}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}