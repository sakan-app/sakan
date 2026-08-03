// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Production service worker.
 *
 * Workbox (via vite-plugin-pwa, `generateSW`) owns precaching, asset
 * revisioning, cache versioning and outdated-cache cleanup. The hand-written
 * parts that Workbox does not generate — push, notification clicks,
 * background/periodic sync — live in `public/sw-push.js` and are pulled in
 * with `importScripts`, so there is still exactly one worker at `/sw.js`.
 */
const pwa = VitePWA({
  strategies: "generateSW",
  registerType: "autoUpdate",
  // The wrapper in src/lib/pwa/register.ts is the only registrar.
  injectRegister: null,
  // public/manifest.webmanifest stays authoritative (shortcuts, screenshots…).
  manifest: false,
  filename: "sw.js",
  devOptions: { enabled: false },
  workbox: {
    importScripts: ["/sw-push.js"],
    globPatterns: ["**/*.{js,css,ico,png,svg,webp,woff2,webmanifest}"],
    // SSR means there is no static HTML on disk; these documents are fetched
    // and precached at install so a cold offline start still renders.
    additionalManifestEntries: [
      { url: "/offline", revision: `${Date.now()}` },
      { url: "/", revision: `${Date.now()}` },
    ],
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    navigateFallback: null,
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    navigationPreload: true,
    runtimeCaching: [
      {
        // HTML navigations: always network-first, never cache-first.
        urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "sakan-pages",
          networkTimeoutSeconds: 8,
          expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 7 },
          cacheableResponse: { statuses: [200] },
          plugins: [
            {
              // Offline and never visited before → the offline shell.
              handlerDidError: async () =>
                (await caches.match("/offline", { ignoreSearch: true })) ??
                (await caches.match("/", { ignoreSearch: true })) ??
                Response.error(),
            },
          ],
        },
      },
      {
        urlPattern: ({ request }: { request: Request }) => request.destination === "image",
        handler: "CacheFirst",
        options: {
          cacheName: "sakan-images",
          expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "sakan-font-css", cacheableResponse: { statuses: [0, 200] } },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "sakan-fonts",
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Supabase storage media (avatars, gallery, wallpapers).
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "sakan-remote-media",
          expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 14 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

export default defineConfig({
  vite: {
    plugins: [pwa],
    // Keep every hook-based dependency on the same optimized React instance.
    // Explicit entries also prevent a partially stale dev prebundle from giving
    // React, React DOM, and Sonner different dependency hashes.
    optimizeDeps: {
      include: ["react", "react/jsx-runtime", "react-dom", "react-dom/client", "sonner"],
      force: true,
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
