/* SAKAN service worker */
const VERSION = "sakan-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const IMAGE_CACHE = `${VERSION}-images`;
const OFFLINE_URL = "/offline";

const APP_SHELL = [
  "/",
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(VERSION))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isSupabaseRequest(url) {
  return url.hostname.includes("supabase.co") || url.pathname.startsWith("/auth") || url.pathname.startsWith("/rest/");
}

function isImageRequest(request) {
  return request.destination === "image";
}

function isStaticAsset(request) {
  return ["style", "script", "font"].includes(request.destination);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isSupabaseRequest(url)) return; // never cache API/auth

  // Navigations: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch (err) {
          const cache = await caches.open(SHELL_CACHE);
          const cached = await cache.match(request);
          return cached || (await cache.match(OFFLINE_URL));
        }
      })()
    );
    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await networkPromise) || Response.error();
}

/* ---------------- Background sync outbox ---------------- */
const DB_NAME = "sakan-outbox";
const STORE_NAME = "requests";

function openOutboxDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getQueuedRequests() {
  const db = await openOutboxDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteQueuedRequest(id) {
  const db = await openOutboxDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
  });
}

async function replayOutbox() {
  const queued = await getQueuedRequests();
  for (const item of queued) {
    try {
      await fetch(item.url, {
        method: item.method || "POST",
        headers: item.headers || {},
        body: item.body,
      });
      await deleteQueuedRequest(item.id);
    } catch (err) {
      // keep in queue for next sync
    }
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "sakan-outbox-sync") {
    event.waitUntil(replayOutbox());
  }
});
