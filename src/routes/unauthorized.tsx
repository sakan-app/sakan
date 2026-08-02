import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({
    meta: [
      { title: "لا تملك صلاحية الوصول | سَكَن" },
      { name: "description", content: "هذه الصفحة تتطلب تسجيل الدخول أو صلاحيات إضافية على منصة سَكَن." },
      { property: "og:title", content: "لا تملك صلاحية الوصول | سَكَن" },
      {
        property: "og:description",
        content: "هذه الصفحة تتطلب تسجيل الدخول أو صلاحيات إضافية على منصة سَكَن.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-navy-deep">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="panel-navy w-full max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-gold" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-cream">{t.system.unauthorizedTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-cream/75">{t.system.unauthorizedText}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {!isAuthenticated && (
              <Link to="/auth" className="btn-gold flex-1 py-3 text-sm font-bold">
                {t.system.signIn}
              </Link>
            )}
            <Link to="/" className="btn-outline-gold flex-1 py-3 text-sm font-semibold">
              {t.system.goHome}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
