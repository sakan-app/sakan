/* SAKAN service worker — offline shell, runtime caching, background sync, push. */
const VERSION = "sakan-v4";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const IMAGE_CACHE = `${VERSION}-images`;
const PAGE_CACHE = `${VERSION}-pages`;
const FONT_CACHE = `${VERSION}-fonts`;
const OUTBOX_TAG = "sakan-outbox-sync";

/** Precached at install so a cold, offline start still renders. */
const SHELL_URLS = [
  "/",
  "/offline",
  "/search",
  "/pricing",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];
const MAX_IMAGE_ENTRIES = 120;
const MAX_PAGE_ENTRIES = 40;

/** Cross-origin hosts whose responses we may cache (fonts only). */
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.allSettled(
        keys
          .filter((key) => key.startsWith("sakan-") && !key.startsWith(VERSION))
          .map((key) => caches.delete(key)),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.allSettled(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

/**
 * Network-first with per-URL route caching and an offline fallback.
 * Every successful navigation is stored under its own URL so previously
 * visited routes open offline, not just the home page.
 */
async function handleNavigation(event) {
  const request = event.request;
  try {
    const preload = await event.preloadResponse;
    const network = preload || (await fetch(request));
    if (network && network.ok) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, network.clone()).catch(() => undefined);
      void trimCache(PAGE_CACHE, MAX_PAGE_ENTRIES);
    }
    return network;
  } catch {
    const pages = await caches.open(PAGE_CACHE);
    const shell = await caches.open(SHELL_CACHE);
    return (
      (await pages.match(request, { ignoreSearch: true })) ||
      (await shell.match(request, { ignoreSearch: true })) ||
      (await shell.match("/offline")) ||
      (await shell.match("/")) ||
      new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
    );
  }
}

/** Stale-while-revalidate — used for hashed build assets and fonts. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      // Opaque cross-origin font responses are cacheable and still usable.
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })
    .catch(() => undefined);
  return cached || (await network) || Response.error();
}

/** Cache-first with LRU trimming — used for images. */
async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === "opaque")) {
      await cache.put(request, response.clone());
      void trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
    }
    return response;
  } catch {
    return cached || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Google Fonts (stylesheet + woff2) so typography survives offline.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Never cache dev modules, API traffic, server functions or auth callbacks.
  if (
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_serverFn") ||
    url.pathname.startsWith("/auth/callback")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  if (
    ["script", "style", "font", "worker", "manifest"].includes(request.destination) ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});

/* ---- Background Sync: replay queued writes once connectivity returns ---- */
async function askClientsToFlush() {
  const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  if (clientList.length > 0) {
    clientList.forEach((client) => client.postMessage({ type: "sakan:flush-outbox" }));
    return;
  }
  // No page open: replay the IndexedDB outbox straight from the worker.
  await replayOutbox();
}

/** Minimal IndexedDB reader mirroring src/lib/outbox.ts. */
function openOutbox() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sakan-outbox", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("requests")) {
        db.createObjectStore("requests", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function replayOutbox() {
  let db;
  try {
    db = await openOutbox();
  } catch {
    return;
  }
  const entries = await new Promise((resolve) => {
    const req = db.transaction("requests", "readonly").objectStore("requests").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
  for (const entry of entries) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method || "POST",
        headers: { "Content-Type": "application/json", ...(entry.headers || {}) },
        body: entry.body || null,
      });
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        const tx = db.transaction("requests", "readwrite");
        tx.objectStore("requests").delete(entry.id);
      }
    } catch {
      break; // still offline — the next sync retries
    }
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag !== OUTBOX_TAG) return;
  event.waitUntil(askClientsToFlush());
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag !== OUTBOX_TAG) return;
  event.waitUntil(askClientsToFlush());
});

/* ---- Push notifications (ready for a future push provider) ---- */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "سَكَن";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      dir: "rtl",
      lang: payload.lang || "ar",
      tag: payload.tag || "sakan-notification",
      renotify: false,
      data: { url: payload.url || "/notifications" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = clientList.find((client) => "focus" in client);
      if (existing) {
        await existing.focus();
        existing.postMessage({ type: "sakan:navigate", url: target });
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});
