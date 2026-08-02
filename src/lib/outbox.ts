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
