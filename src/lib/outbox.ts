/**
 * Tiny IndexedDB-backed outbox for queuing POST requests when offline.
 * Paired with the `sync` event handler in public/sw.js.
 */

const DB_NAME = "sakan-outbox";
const STORE_NAME = "requests";

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
}): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(entry);
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
    try {
      const response = await fetch(entry.url, {
        method: entry.method ?? "POST",
        headers: { "Content-Type": "application/json", ...(entry.headers ?? {}) },
        body: entry.body ?? null,
      });
      // Drop permanently rejected requests so the queue cannot deadlock.
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        await remove(db, entry.id);
        if (response.ok) flushed += 1;
      }
    } catch {
      break; // still offline — retry on the next sync
    }
  }
  return flushed;
}
