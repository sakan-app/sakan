import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal/LegalPage";
import { useFeatureStrings } from "@/i18n/feature";
import { termsContent } from "@/lib/legal/terms";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الخدمة | سَكَن" },
      {
        name: "description",
        content:
          "شروط استخدام منصة سَكَن: الأهلية، قواعد السلوك، الرسوم الاختيارية (99 سنتاً)، وحق الانسحاب خلال 14 يوماً.",
      },
      { property: "og:title", content: "شروط الخدمة | سَكَن" },
      { property: "og:description", content: "الشروط والأحكام الخاصة باستخدام منصة سَكَن." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
  errorComponent: RouteErrorBoundary,
});

function TermsPage() {
  return <LegalPage content={useFeatureStrings(termsContent)} />;
}