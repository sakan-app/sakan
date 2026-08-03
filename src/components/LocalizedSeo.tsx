import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { useI18n } from "@/lib/i18n";
import { pageForPath, seoFor, SKIP_LINK } from "@/lib/seo";

const OG_LOCALE = { ar: "ar_AR", en: "en_GB", de: "de_DE", fr: "fr_FR" } as const;

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Writes a title/description pair into the live document head. */
export function applyDocumentSeo(entry: { title: string; description: string }) {
  document.title = entry.title;
  setMeta('meta[name="description"]', "name", "description", entry.description);
  setMeta('meta[property="og:title"]', "property", "og:title", entry.title);
  setMeta('meta[property="og:description"]', "property", "og:description", entry.description);
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", entry.title);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", entry.description);
}

/**
 * Keeps the document title and social metadata in the visitor's language.
 *
 * Route `head()` blocks are evaluated on the server before the stored locale is
 * known, so they carry the Arabic default. Once the language context resolves,
 * this component rewrites title/description/og/twitter tags for the active
 * locale. Pages with their own dynamic metadata (member profiles) opt out by
 * rendering `<LocalizedSeo page="..." />` themselves.
 */
export function LocalizedSeo() {
  const { locale } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const page = pageForPath(pathname);
    if (page) {
      applyDocumentSeo(seoFor(page, locale));
    }
    setMeta('meta[property="og:locale"]', "property", "og:locale", OG_LOCALE[locale]);

    const skip = document.getElementById("skip-to-content");
    if (skip) skip.textContent = SKIP_LINK[locale];
  }, [locale, pathname]);

  return null;
}
