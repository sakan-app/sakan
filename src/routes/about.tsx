import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal/LegalPage";
import { useFeatureStrings } from "@/i18n/feature";
import { aboutContent } from "@/lib/legal/about";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | سَكَن — منصة الزواج الآمنة" },
      {
        name: "description",
        content:
          "سَكَن منصة دولية للتعارف الجاد والزواج، تُدار بوكلاء ذكاء اصطناعي مع توثيق للحسابات وترجمة فورية داخل الشات.",
      },
      { property: "og:title", content: "من نحن | سَكَن" },
      {
        property: "og:description",
        content: "تعرّف على رسالة منصة سَكَن وكيف تعمل منظومة الذكاء الاصطناعي لحمايتك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return <LegalPage content={useFeatureStrings(aboutContent)} />;
}