import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal/LegalPage";
import { useFeatureStrings } from "@/i18n/feature";
import { privacyContent } from "@/lib/legal/privacy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | سَكَن" },
      {
        name: "description",
        content:
          "كيف تجمع منصة سَكَن بياناتك وتحميها وفق اللائحة الأوروبية GDPR: التخزين داخل الاتحاد الأوروبي، حقوقك، والحذف النهائي.",
      },
      { property: "og:title", content: "سياسة الخصوصية | سَكَن" },
      { property: "og:description", content: "سياسة الخصوصية المتوافقة مع GDPR لمنصة سَكَن." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalPage content={useFeatureStrings(privacyContent)} />;
}