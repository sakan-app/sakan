/* eslint-disable */
/**
 * SAKAN service worker extensions.
 *
 * Imported (via `importScripts`) at the top of the Workbox-generated
 * `/sw.js`. Workbox owns caching; this file owns everything Workbox does not
 * generate: Web Push, notification clicks, Background Sync and Periodic
 * Background Sync. It registers no `fetch` listener, so it can never shadow a
 * Workbox route.
 */

const SAKAN_OUTBOX_TAG = "sakan-outbox-sync";
const SAKAN_REFRESH_TAG = "sakan-content-refresh";
const OUTBOX_DB = "sakan-outbox";
const OUTBOX_STORE = "requests";

/* ------------------------------- Outbox ------------------------------- */

function sakanOpenOutbox() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OUTBOX_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        db.createObjectStore(OUTBOX_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Replays queued writes from the worker itself (used when no page is open).
 * A 4xx is terminal — the entry is dropped instead of retried forever.
 * A network error aborts the run so the next sync retries in order.
 */
async function sakanReplayOutbox() {
  let db;
  try {
    db = await sakanOpenOutbox();
  } catch {
    return;
  }
  const entries = await new Promise((resolve) => {
    const req = db.transaction(OUTBOX_STORE, "readonly").objectStore(OUTBOX_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });

  for (const entry of entries) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method || "POST",
        headers: entry.headers || { "Content-Type": "application/json" },
        body: entry.body || null,
        credentials: entry.credentials || "same-origin",
      });
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        const tx = db.transaction(OUTBOX_STORE, "readwrite");
        tx.objectStore(OUTBOX_STORE).delete(entry.id);
      } else {
        break; // 5xx — server trouble, retry on the next sync
      }
    } catch {
      break; // still offline
    }
  }
}

/** Prefers an open page (it holds fresh auth tokens); falls back to the worker. */
async function sakanFlush() {
  const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  if (clientList.length > 0) {
    clientList.forEach((client) => client.postMessage({ type: "sakan:flush-outbox" }));
    return;
  }
  await sakanReplayOutbox();
}

self.addEventListener("sync", (event) => {
  if (event.tag !== SAKAN_OUTBOX_TAG) return;
  event.waitUntil(sakanFlush());
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === SAKAN_OUTBOX_TAG) {
    event.waitUntil(sakanFlush());
    return;
  }
  if (event.tag === SAKAN_REFRESH_TAG) {
    // Warm the shell so the next cold offline start is current.
    event.waitUntil(
      (async () => {
        await sakanFlush();
        try {
          const cache = await caches.open("sakan-pages");
          const response = await fetch("/", { cache: "reload" });
          if (response.ok) await cache.put("/", response.clone());
        } catch {
          /* offline — nothing to warm */
        }
      })(),
    );
  }
});

/* -------------------------------- Push -------------------------------- */

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "سَكَن";
  const url = payload.url || "/notifications";
  const badgeCount = Number(payload.badge_count);

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body: payload.body || "",
        icon: payload.icon || "/icons/icon-192.png",
        badge: "/icons/icon-192-maskable.png",
        image: payload.image || undefined,
        dir: payload.dir || "auto",
        lang: payload.lang || "ar",
        tag: payload.tag || "sakan-notification",
        renotify: Boolean(payload.renotify),
        requireInteraction: Boolean(payload.require_interaction),
        vibrate: payload.vibrate || [80, 40, 80],
        timestamp: Date.now(),
        data: { url, kind: payload.kind || "system" },
        actions: Array.isArray(payload.actions) ? payload.actions.slice(0, 2) : undefined,
      });

      if (Number.isFinite(badgeCount) && "setAppBadge" in self.navigator) {
        try {
          await self.navigator.setAppBadge(badgeCount);
        } catch {
          /* badge unsupported */
        }
      }

      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clientList.forEach((client) => client.postMessage({ type: "sakan:push", payload }));
    })(),
  );
});

/** Deep-links into the app: focus an open tab, otherwise open a window. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = event.action === "dismiss" ? null : data.url || "/notifications";
  if (!target) return;

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

/**
 * Chrome fires this when a subscription is rotated or revoked; the new
 * subscription is handed to any open page, which persists it server-side.
 */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clientList.forEach((client) =>
        client.postMessage({
          type: "sakan:push-resubscribe",
          oldEndpoint: event.oldSubscription ? event.oldSubscription.endpoint : null,
        }),
      );
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "sakan:replay-outbox") {
    event.waitUntil(sakanReplayOutbox());
  }
});