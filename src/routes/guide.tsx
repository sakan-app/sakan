import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal/LegalPage";
import { useFeatureStrings } from "@/i18n/feature";
import { guideContent } from "@/lib/legal/guide";
import { RouteErrorBoundary } from "@/components/RouteError";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "دليل قانون الزواج والتحذيرات الأمنية | سَكَن" },
      {
        name: "description",
        content:
          "دليل سَكَن الرسمي: شروط الزواج المدني في ألمانيا وأوروبا، أوراق لم الشمل، الزواج في الدنمارك، وتحذيرات صارمة من الاحتيال المالي.",
      },
      { property: "og:title", content: "دليل قانون الزواج الرسمي | سَكَن" },
      {
        property: "og:description",
        content: "القاعدة القانونية في أوروبا، الأوراق المطلوبة، وحمايتك من النصب.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "دليل قانون الزواج الرسمي والتحذيرات الأمنية",
          inLanguage: "ar",
          author: { "@type": "Organization", name: "SAKAN" },
          publisher: { "@type": "Organization", name: "SAKAN" },
          mainEntityOfPage: "https://www.sakanapp.net/guide",
        }),
      },
    ],
  }),
  component: GuidePage,
  errorComponent: RouteErrorBoundary,
});

function GuidePage() {
  return <LegalPage content={useFeatureStrings(guideContent)} />;
}