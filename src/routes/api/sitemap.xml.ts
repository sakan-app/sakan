import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://sakan.app";

const PUBLIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/search", priority: "0.8", changefreq: "hourly" },
  { path: "/pricing", priority: "0.7", changefreq: "weekly" },
  { path: "/auth", priority: "0.3", changefreq: "monthly" },
];

export const Route = createFileRoute("/api/sitemap")({
  server: {
    handlers: {
      GET: async () => {
        const urls = PUBLIC_ROUTES.map(
          (r) =>
            `  <url>\n    <loc>${SITE_URL}${r.path}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`,
        ).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
