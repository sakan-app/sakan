import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal/LegalPage";
import { useFeatureStrings } from "@/i18n/feature";
import { impressumContent } from "@/lib/legal/impressum";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum | SAKAN" },
      {
        name: "description",
        content:
          "Anbieterkennzeichnung nach §5 DDG für die Plattform SAKAN: Betreiber, Anschrift und Kontaktmöglichkeiten.",
      },
      { property: "og:title", content: "Impressum | SAKAN" },
      { property: "og:description", content: "Betreiber und Kontaktdaten der Plattform SAKAN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImpressumPage,
});

function ImpressumPage() {
  return <LegalPage content={useFeatureStrings(impressumContent)} />;
}