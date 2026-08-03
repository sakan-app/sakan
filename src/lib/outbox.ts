/**
 * IndexedDB-backed outbox for write requests made while offline.
 *
 * `installOfflineWriteInterceptor()` wraps `window.fetch`, so **every**
 * POST/PUT/PATCH/DELETE the app makes — TanStack server functions (messages,
 * likes, favorites, profile edits, settings, verification, premium actions,
 * featured-banner purchases) and direct Supabase REST writes — is captured
 * automatically when the network is unavailable. Replay happens on `online`,
 * on a Background Sync event, or from the worker itself when no tab is open
 * (see `public/sw-push.js`).
 */

const DB_NAME = "sakan-outbox";
const STORE_NAME = "requests";
/** Requests that must never be replayed later. */
const SKIP_PATTERNS = [
  "/auth/v1/", // tokens are time-bound; replaying a stale sign-in is wrong
  "/storage/v1/", // binary bodies cannot be serialized
  "/realtime/v1/",
  "/api/public/stripe-webhook",
  "checkout.stripe.com",
  "api.stripe.com",
];
const MAX_BODY_BYTES = 512 * 1024;
/** Give up on an entry after this many failed replay attempts. */
const MAX_ATTEMPTS = 8;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOutboxRequest(entry: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  credentials?: RequestCredentials;
}): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add({ ...entry, attempts: 0, queuedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-expect-error - sync is not in the default lib.dom types
      await registration.sync.register("sakan-outbox-sync");
    } catch {
      // background sync unsupported; the outbox will replay on next online fetch
    }
  }
}

interface OutboxEntry {
  id: number;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  credentials?: RequestCredentials;
  attempts?: number;
  queuedAt?: number;
}

async function readAll(db: IDBDatabase): Promise<OutboxEntry[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as OutboxEntry[]);
    request.onerror = () => reject(request.error);
  });
}

async function remove(db: IDBDatabase, id: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function bumpAttempts(db: IDBDatabase, entry: OutboxEntry): Promise<void> {
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ ...entry, attempts: (entry.attempts ?? 0) + 1 });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/** Number of writes still waiting to be sent. */
export async function outboxSize(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  try {
    const db = await openDb();
    return (await readAll(db)).length;
  } catch {
    return 0;
  }
}

/**
 * Replays every queued request. Called when the browser reports connectivity
 * again or when the service worker's Background Sync event fires.
 * Returns the number of successfully flushed entries.
 */
export async function flushOutbox(): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  let flushed = 0;
  const db = await openDb();
  const entries = await readAll(db);
  for (const entry of entries) {
    if ((entry.attempts ?? 0) >= MAX_ATTEMPTS) {
      await remove(db, entry.id);
      continue;
    }
    try {
      const response = await fetch(entry.url, {
        method: entry.method ?? "POST",
        headers: { "Content-Type": "application/json", ...(entry.headers ?? {}) },
        body: entry.body ?? null,
        credentials: entry.credentials ?? "same-origin",
      });
      // Drop permanently rejected requests so the queue cannot deadlock.
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        await remove(db, entry.id);
        if (response.ok) flushed += 1;
      } else {
        await bumpAttempts(db, entry); // 5xx — server-side, retry later
        break;
      }
    } catch {
      break; // still offline — retry on the next sync
    }
  }
  if (flushed > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sakan:outbox-flushed", { detail: { flushed } }));
  }
  return flushed;
}

/* ------------------------------------------------------------------ */
/* Automatic capture of every write request                            */
/* ------------------------------------------------------------------ */

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let interceptorInstalled = false;

function shouldQueue(url: string, method: string): boolean {
  if (!WRITE_METHODS.has(method)) return false;
  return !SKIP_PATTERNS.some((pattern) => url.includes(pattern));
}

/**
 * Wraps `window.fetch` once. A write that fails because the device is offline
 * is stored in the outbox and the original network error is re-thrown, so
 * callers keep their existing error handling while the request is replayed
 * automatically as soon as connectivity returns.
 */
export function installOfflineWriteInterceptor(): () => void {
  if (typeof window === "undefined" || interceptorInstalled) return () => undefined;
  interceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const request = input instanceof Request ? input : null;
    const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
    const url = request ? request.url : String(input);

    try {
      return await originalFetch(input as RequestInfo, init);
    } catch (error) {
      if (!shouldQueue(url, method)) throw error;
      try {
        // Only serializable text bodies can be replayed.
        let body: string | undefined;
        if (typeof init?.body === "string") body = init.body;
        else if (request && !request.bodyUsed) body = await request.clone().text();
        if (body === undefined || body.length > MAX_BODY_BYTES) throw error;

        const headers: Record<string, string> = {};
        new Headers(init?.headers ?? request?.headers ?? {}).forEach((value, key) => {
          headers[key] = value;
        });

        await queueOutboxRequest({
          url,
          method,
          headers,
          body,
          credentials: init?.credentials ?? request?.credentials ?? "same-origin",
        });
        window.dispatchEvent(new CustomEvent("sakan:outbox-queued", { detail: { url, method } }));
      } catch {
        /* queueing is best-effort */
      }
      throw error;
    }
  } as typeof window.fetch;

  return () => {
    window.fetch = originalFetch;
    interceptorInstalled = false;
  };
}
