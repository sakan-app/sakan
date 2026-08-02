import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import type { LegalPageContent } from "@/lib/legal/types";

/**
 * Shared shell for the public legal / informational pages (About, Impressum,
 * Privacy, Terms, Marriage guide) so they stay visually identical.
 */
export function LegalPage({ content }: { content: LegalPageContent }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Header />
      <main className="mx-auto w-full max-w-[900px] flex-1 px-6 py-12 lg:px-8">
        <h1 className="text-3xl font-black leading-tight text-navy sm:text-4xl">{content.title}</h1>
        <p className="mt-3 text-sm leading-7 text-navy/70">{content.subtitle}</p>

        <div className="mt-10 space-y-8">
          {content.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-gold/20 bg-white/70 p-6 shadow-sm backdrop-blur"
            >
              <h2 className="text-lg font-bold text-navy">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-8 text-navy/80">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}