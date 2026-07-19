import type { SerializedKeyPair, SerializedRatchetState, ConversationCryptoState, CryptoLogEntry } from './types';

const DB_NAME = 'NeutronE2EE';
const DB_VERSION = 1;

const STORES = {
  KEY_PAIRS: 'keyPairs',
  CONVERSATIONS: 'cryptoConversations',
  LOGS: 'cryptoLogs',
} as const;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.KEY_PAIRS)) {
        db.createObjectStore(STORES.KEY_PAIRS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
        const store = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'conversationId' });
        store.createIndex('peerPublicKey', 'peerPublicKey', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.LOGS)) {
        const store = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

export async function saveKeyPair(keyPair: SerializedKeyPair): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.KEY_PAIRS, 'readwrite');
    const store = tx.objectStore(STORES.KEY_PAIRS);
    store.put({ id: 'main', ...keyPair });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadKeyPair(): Promise<SerializedKeyPair | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.KEY_PAIRS, 'readonly');
    const store = tx.objectStore(STORES.KEY_PAIRS);
    const request = store.get('main');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteKeyPair(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.KEY_PAIRS, 'readwrite');
    const store = tx.objectStore(STORES.KEY_PAIRS);
    store.delete('main');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveConversationState(state: ConversationCryptoState): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CONVERSATIONS, 'readwrite');
    const store = tx.objectStore(STORES.CONVERSATIONS);
    store.put(state);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadConversationState(
  conversationId: string
): Promise<ConversationCryptoState | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CONVERSATIONS, 'readonly');
    const store = tx.objectStore(STORES.CONVERSATIONS);
    const request = store.get(conversationId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function loadConversationStateByPeer(
  peerPublicKey: string
): Promise<ConversationCryptoState | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CONVERSATIONS, 'readonly');
    const store = tx.objectStore(STORES.CONVERSATIONS);
    const index = store.index('peerPublicKey');
    const request = index.get(peerPublicKey);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function loadAllConversationStates(): Promise<ConversationCryptoState[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CONVERSATIONS, 'readonly');
    const store = tx.objectStore(STORES.CONVERSATIONS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteConversationState(conversationId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CONVERSATIONS, 'readwrite');
    const store = tx.objectStore(STORES.CONVERSATIONS);
    store.delete(conversationId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function addCryptoLog(entry: CryptoLogEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.LOGS, 'readwrite');
    const store = tx.objectStore(STORES.LOGS);
    store.put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCryptoLogs(limit: number = 50): Promise<CryptoLogEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.LOGS, 'readonly');
    const store = tx.objectStore(STORES.LOGS);
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');
    const results: CryptoLogEntry[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

export async function clearCryptoLogs(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.LOGS, 'readwrite');
    const store = tx.objectStore(STORES.LOGS);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
