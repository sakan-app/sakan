import { createFileRoute } from "@tanstack/react-router";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PlanCards } from "@/components/billing/PlanCards";
import { useFeatureStrings } from "@/i18n/feature";
import { billingStrings } from "@/lib/billing/strings";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "باقات العضوية | سَكَن" },
      {
        name: "description",
        content:
          "باقات سَكَن: مجاني، بريميوم، وبريميوم بلس — رسائل بلا حدود، فلاتر متقدمة، ومطابقة بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "باقات العضوية | سَكَن" },
      {
        property: "og:description",
        content: "اختر الباقة التي تناسب رحلتك نحو الزواج على منصة سَكَن.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const s = useFeatureStrings(billingStrings);

  return (
    <div className="flex min-h-screen flex-col bg-cream pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Header />
      <main className="mx-auto w-full max-w-[1160px] flex-1 px-6 py-12 lg:px-8">
        <h1 className="text-center text-3xl font-black text-navy">{s.pricingTitle}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{s.pricingSubtitle}</p>
        <div className="mt-10">
          <PlanCards />
        </div>
      </main>
      <Footer />
    </div>
  );
}