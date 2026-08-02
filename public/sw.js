/* SAKAN service worker — offline shell, runtime caching, background sync, push. */
const VERSION = "sakan-v3";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const IMAGE_CACHE = `${VERSION}-images`;
const OUTBOX_TAG = "sakan-outbox-sync";

const SHELL_URLS = ["/", "/offline", "/manifest.webmanifest", "/favicon.ico"];
const MAX_IMAGE_ENTRIES = 80;

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

/** Network-first with an offline fallback — used for page navigations. */
async function handleNavigation(event) {
  try {
    const preload = await event.preloadResponse;
    if (preload) return preload;
    const network = await fetch(event.request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put("/", network.clone()).catch(() => undefined);
    return network;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (
      (await cache.match(event.request)) ||
      (await cache.match("/offline")) ||
      (await cache.match("/")) ||
      new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
    );
  }
}

/** Stale-while-revalidate — used for hashed build assets. */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
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
    if (response && response.ok) {
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
  if (url.origin !== self.location.origin) return;
  // Never cache dev modules, API traffic or auth callbacks.
  if (url.pathname.startsWith("/src/") || url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn")) {
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

  if (["script", "style", "font", "worker"].includes(request.destination) || url.pathname.startsWith("/assets/")) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});

/* ---- Background Sync: replay queued messages once connectivity returns ---- */
self.addEventListener("sync", (event) => {
  if (event.tag !== OUTBOX_TAG) return;
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clientList.forEach((client) => client.postMessage({ type: "sakan:flush-outbox" }));
    })(),
  );
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
