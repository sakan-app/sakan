import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Mail } from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { useI18n, format } from "@/lib/i18n";
import { authErrorMessage } from "@/lib/auth-errors";

export const Route = createFileRoute("/auth/")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | سَكَن" },
      {
        name: "description",
        content: "سجّل الدخول أو أنشئ حسابك على منصة سَكَن للتعارف الجاد والزواج المستقر.",
      },
      { property: "og:title", content: "تسجيل الدخول | سَكَن" },
      {
        property: "og:description",
        content: "انضم إلى سَكَن — منصة دولية آمنة للتعارف الجاد والزواج.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "reset";

function AuthPage() {
  const { t } = useI18n();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Guest-only route: signed-in visitors go straight to their profile.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void navigate({ to: "/profile", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  function validate(): string | null {
    if (mode === "signup" && displayName.trim().length < 2) return t.auth.errors.nameShort;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return t.auth.errors.email;
    if (mode !== "reset" && password.length < 8) return t.auth.errors.passwordShort;
    if (mode === "signup" && password !== confirm) return t.auth.errors.passwordMismatch;
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        void navigate({ to: "/profile", replace: true });
      } else if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { display_name: displayName.trim() },
          },
        });
        if (err) throw err;
        if (data.session) {
          void navigate({ to: "/onboarding", replace: true });
        } else {
          setPendingEmail(email.trim());
        }
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (err) throw err;
        setNotice(t.auth.resetSent);
      }
    } catch (err) {
      setError(authErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      void navigate({ to: "/profile", replace: true });
    } catch (err) {
      setError(authErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    if (!pendingEmail) return;
    setBusy(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (err) throw err;
      setNotice(t.auth.verificationResent);
    } catch (err) {
      setError(authErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "signin"
      ? t.auth.signInTitle
      : mode === "signup"
        ? t.auth.signUpTitle
        : t.auth.resetTitle;
  const subtitle =
    mode === "signin"
      ? t.auth.signInSubtitle
      : mode === "signup"
        ? t.auth.signUpSubtitle
        : t.auth.resetSubtitle;

  return (
    <div className="flex min-h-screen flex-col bg-navy-deep">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-14">
        <div className="panel-navy w-full max-w-md p-7 sm:p-9">
          {pendingEmail ? (
            <div className="text-center">
              <Mail className="mx-auto h-10 w-10 text-gold" />
              <h1 className="mt-4 text-xl font-bold text-cream">{t.auth.verifyTitle}</h1>
              <p className="mt-3 text-sm leading-relaxed text-cream/75">
                {format(t.auth.verifySent, { email: pendingEmail })}
              </p>
              {notice && <p className="mt-3 text-xs text-gold">{notice}</p>}
              {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
              <button
                onClick={resendVerification}
                disabled={busy}
                className="btn-outline-gold mt-5 w-full py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {t.auth.resendVerification}
              </button>
              <button
                onClick={() => {
                  setPendingEmail(null);
                  setMode("signin");
                }}
                className="mt-3 text-xs text-cream/70 hover:text-gold"
              >
                {t.auth.backToSignIn}
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-center text-2xl font-bold text-cream">{title}</h1>
              <p className="mt-2 text-center text-sm text-cream/70">{subtitle}</p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                {mode === "signup" && (
                  <Field label={t.auth.displayName}>
                    <input
                      className="field-navy w-full"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      autoComplete="name"
                    />
                  </Field>
                )}
                <Field label={t.auth.email}>
                  <input
                    type="email"
                    className="field-navy w-full latin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    dir="ltr"
                  />
                </Field>
                {mode !== "reset" && (
                  <Field label={t.auth.password}>
                    <input
                      type="password"
                      className="field-navy w-full latin"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      dir="ltr"
                    />
                  </Field>
                )}
                {mode === "signup" && (
                  <Field label={t.auth.confirmPassword}>
                    <input
                      type="password"
                      className="field-navy w-full latin"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      dir="ltr"
                    />
                  </Field>
                )}

                {error && <p className="text-xs text-red-300">{error}</p>}
                {notice && <p className="text-xs text-gold">{notice}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="btn-gold flex items-center justify-center gap-2 py-3 text-sm font-bold disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "signin"
                    ? t.auth.signIn
                    : mode === "signup"
                      ? t.auth.signUp
                      : t.auth.sendReset}
                </button>
              </form>

              {mode !== "reset" && (
                <>
                  <div className="my-5 flex items-center gap-3 text-xs text-cream/45">
                    <span className="h-px flex-1 bg-gold/20" />
                    {t.auth.or}
                    <span className="h-px flex-1 bg-gold/20" />
                  </div>
                  <button
                    onClick={handleGoogle}
                    disabled={busy}
                    className="btn-outline-gold flex w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold disabled:opacity-60"
                  >
                    <GoogleIcon />
                    {t.auth.google}
                  </button>
                </>
              )}

              <div className="mt-6 flex flex-col items-center gap-2 text-xs text-cream/70">
                {mode === "signin" && (
                  <>
                    <button onClick={() => setMode("reset")} className="hover:text-gold">
                      {t.auth.forgot}
                    </button>
                    <span>
                      {t.auth.noAccount}{" "}
                      <button
                        onClick={() => setMode("signup")}
                        className="font-semibold text-gold hover:underline"
                      >
                        {t.auth.signUp}
                      </button>
                    </span>
                  </>
                )}
                {mode === "signup" && (
                  <span>
                    {t.auth.haveAccount}{" "}
                    <button
                      onClick={() => setMode("signin")}
                      className="font-semibold text-gold hover:underline"
                    >
                      {t.auth.signIn}
                    </button>
                  </span>
                )}
                {mode === "reset" && (
                  <button onClick={() => setMode("signin")} className="hover:text-gold">
                    {t.auth.backToSignIn}
                  </button>
                )}
                <Link to="/" className="mt-1 text-cream/50 hover:text-gold">
                  {t.nav.home}
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-cream/80">{label}</span>
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4c1.9 0 3.2.8 3.9 1.5l2.7-2.6A9.6 9.6 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.8 0-.7-.1-1.2-.2-1.7H12Z"
      />
    </svg>
  );
}