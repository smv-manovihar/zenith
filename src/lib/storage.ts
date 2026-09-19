/**
 * Centralized Storage Utility for Zenith
 * Powered by IndexedDB (via idb) for high capacity, non-blocking I/O,
 * with synchronous memory cache and automatic migration from localStorage.
 */
import { openDB, type IDBPDatabase } from "idb"

const DB_NAME = "zenith_db"
const DB_VERSION = 1
const KV_STORE = "keyval"

const PREFIX = "zenith_"
const OLD_PREFIX = "anilist_updator_"

export const STORAGE_KEYS = {
  ENTRIES: `${PREFIX}entries`,
  TOKEN: `${PREFIX}token`,
  TOKEN_TIMESTAMP: `${PREFIX}token_timestamp`,
  USER: `${PREFIX}user`,
  LAST_INDEX: `${PREFIX}last_index`,
  PREFERRED_FORMATS: `${PREFIX}preferred_formats`,
  SYNC_HISTORY: `${PREFIX}sync_history`,
}

const OLD_STORAGE_KEYS = {
  ENTRIES: `${OLD_PREFIX}entries`,
  TOKEN: `${OLD_PREFIX}token`,
  USER: `${OLD_PREFIX}user`,
  LAST_INDEX: `${OLD_PREFIX}last_index`,
  PREFERRED_FORMATS: `${OLD_PREFIX}preferred_formats`,
}

// In-memory cache for synchronous read availability during render
const memoryCache = new Map<string, string>()

// Initialize memory cache from localStorage on script evaluation for instantaneous synchronous access
if (typeof window !== "undefined") {
  try {
    for (const [, key] of Object.entries(STORAGE_KEYS)) {
      const val = localStorage.getItem(key)
      if (val !== null) memoryCache.set(key, val)
    }
    // Check old keys if new keys are missing
    for (const [name, oldKey] of Object.entries(OLD_STORAGE_KEYS)) {
      const newKey = STORAGE_KEYS[name as keyof typeof STORAGE_KEYS]
      if (newKey && !memoryCache.has(newKey)) {
        const oldVal = localStorage.getItem(oldKey)
        if (oldVal !== null) {
          memoryCache.set(newKey, oldVal)
        }
      }
    }
  } catch (e) {
    console.warn("Error initializing memory cache from localStorage:", e)
  }
}

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(KV_STORE)) {
          db.createObjectStore(KV_STORE)
        }
      },
    })
  }
  return dbPromise
}

async function idbGet<T = any>(key: string): Promise<T | undefined> {
  try {
    const db = await getDB()
    return await db.get(KV_STORE, key)
  } catch (e) {
    console.warn(`IndexedDB get error for key "${key}":`, e)
    return undefined
  }
}

async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await getDB()
    await db.put(KV_STORE, value, key)
  } catch (e) {
    console.warn(`IndexedDB set error for key "${key}":`, e)
  }
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await getDB()
    await db.delete(KV_STORE, key)
  } catch (e) {
    console.warn(`IndexedDB delete error for key "${key}":`, e)
  }
}

async function idbClear(): Promise<void> {
  try {
    const db = await getDB()
    await db.clear(KV_STORE)
  } catch (e) {
    console.warn("IndexedDB clear error:", e)
  }
}

/**
 * Run one-time migration from localStorage into IndexedDB and clean up old keys.
 */
export async function initAndMigrateStorage(): Promise<{ entries?: any[] }> {
  if (typeof window === "undefined") return {}

  try {
    const db = await getDB()
    
    // Migrate items from localStorage to IDB if not yet present in IDB
    for (const [name, newKey] of Object.entries(STORAGE_KEYS)) {
      const existingInIdb = await db.get(KV_STORE, newKey)
      if (existingInIdb === undefined) {
        let val = localStorage.getItem(newKey)
        if (val === null) {
          const oldKey = OLD_STORAGE_KEYS[name as keyof typeof OLD_STORAGE_KEYS]
          if (oldKey) {
            val = localStorage.getItem(oldKey)
          }
        }
        if (val !== null) {
          try {
            // Parse JSON for structured objects/arrays if applicable
            const parsed = JSON.parse(val)
            await db.put(KV_STORE, parsed, newKey)
          } catch {
            await db.put(KV_STORE, val, newKey)
          }
          memoryCache.set(newKey, val)
        }
      } else {
        // Sync IDB into memory cache as string
        const strVal = typeof existingInIdb === "string" ? existingInIdb : JSON.stringify(existingInIdb)
        memoryCache.set(newKey, strVal)
      }
    }

    // Populate token timestamp if token exists but no timestamp
    const token = memoryCache.get(STORAGE_KEYS.TOKEN)
    if (token && !memoryCache.has(STORAGE_KEYS.TOKEN_TIMESTAMP)) {
      const now = Date.now().toString()
      memoryCache.set(STORAGE_KEYS.TOKEN_TIMESTAMP, now)
      await db.put(KV_STORE, now, STORAGE_KEYS.TOKEN_TIMESTAMP)
    }

    // Clean up old localStorage keys to free browser storage
    for (const oldKey of Object.values(OLD_STORAGE_KEYS)) {
      localStorage.removeItem(oldKey)
    }
    // Clean up large entries payload from localStorage to free 5MB quota once confirmed stored in IDB
    const loadedEntries = await db.get(KV_STORE, STORAGE_KEYS.ENTRIES)
    if (loadedEntries !== undefined) {
      localStorage.removeItem(STORAGE_KEYS.ENTRIES)
    }

    return { entries: loadedEntries }
  } catch (e) {
    console.warn("Storage migration failed:", e)
    return {}
  }
}

export const Storage = {
  // Entries
  getEntries: (): string | null => {
    return memoryCache.get(STORAGE_KEYS.ENTRIES) ?? null
  },
  getEntriesAsync: async <T = any>(): Promise<T | null> => {
    const raw = await idbGet<T>(STORAGE_KEYS.ENTRIES)
    if (raw !== undefined) return raw
    const mem = memoryCache.get(STORAGE_KEYS.ENTRIES)
    if (mem) {
      try {
        return JSON.parse(mem)
      } catch {
        return null
      }
    }
    return null
  },
  setEntries: (entries: any[]) => {
    const serialized = JSON.stringify(entries)
    memoryCache.set(STORAGE_KEYS.ENTRIES, serialized)
    // Non-blocking asynchronous write to IndexedDB
    idbSet(STORAGE_KEYS.ENTRIES, entries)
  },

  // Token
  getToken: (): string | null => {
    return memoryCache.get(STORAGE_KEYS.TOKEN) ?? null
  },
  setToken: (token: string) => {
    memoryCache.set(STORAGE_KEYS.TOKEN, token)
    const timestamp = Date.now().toString()
    memoryCache.set(STORAGE_KEYS.TOKEN_TIMESTAMP, timestamp)
    
    // Save to IDB
    idbSet(STORAGE_KEYS.TOKEN, token)
    idbSet(STORAGE_KEYS.TOKEN_TIMESTAMP, timestamp)
    // Keep in localStorage for instant sync on cold start
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
      localStorage.setItem(STORAGE_KEYS.TOKEN_TIMESTAMP, timestamp)
    } catch {
      // Ignore if localStorage quota exceeded
    }
  },
  getTokenTimestamp: (): number | null => {
    const ts = memoryCache.get(STORAGE_KEYS.TOKEN_TIMESTAMP)
    return ts ? parseInt(ts, 10) : null
  },
  removeToken: () => {
    memoryCache.delete(STORAGE_KEYS.TOKEN)
    memoryCache.delete(STORAGE_KEYS.TOKEN_TIMESTAMP)
    memoryCache.delete(STORAGE_KEYS.USER)
    
    idbDelete(STORAGE_KEYS.TOKEN)
    idbDelete(STORAGE_KEYS.TOKEN_TIMESTAMP)
    idbDelete(STORAGE_KEYS.USER)
    
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.TOKEN_TIMESTAMP)
      localStorage.removeItem(STORAGE_KEYS.USER)
    } catch {
      // Ignore
    }
  },

  // User profile
  getUser: (): string | null => {
    return memoryCache.get(STORAGE_KEYS.USER) ?? null
  },
  setUser: (user: any) => {
    const serialized = JSON.stringify(user)
    memoryCache.set(STORAGE_KEYS.USER, serialized)
    idbSet(STORAGE_KEYS.USER, user)
    try {
      localStorage.setItem(STORAGE_KEYS.USER, serialized)
    } catch {
      // Ignore
    }
  },

  // Last visited index
  getLastIndex: (): string | null => {
    return memoryCache.get(STORAGE_KEYS.LAST_INDEX) ?? null
  },
  setLastIndex: (index: number) => {
    const str = index.toString()
    memoryCache.set(STORAGE_KEYS.LAST_INDEX, str)
    idbSet(STORAGE_KEYS.LAST_INDEX, index)
  },

  // Preferred formats
  getPreferredFormats: (): string | null => {
    return memoryCache.get(STORAGE_KEYS.PREFERRED_FORMATS) ?? null
  },
  setPreferredFormats: (formats: string[]) => {
    const serialized = JSON.stringify(formats)
    memoryCache.set(STORAGE_KEYS.PREFERRED_FORMATS, serialized)
    idbSet(STORAGE_KEYS.PREFERRED_FORMATS, formats)
  },

  // Sync History
  getSyncHistory: async <T = any>(): Promise<T | null> => {
    const data = await idbGet<T>(STORAGE_KEYS.SYNC_HISTORY)
    return data ?? null
  },
  setSyncHistory: async (history: any): Promise<void> => {
    await idbSet(STORAGE_KEYS.SYNC_HISTORY, history)
  },

  // Clear all data
  clearAll: () => {
    memoryCache.clear()
    idbClear()
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k))
      Object.values(OLD_STORAGE_KEYS).forEach((k) => localStorage.removeItem(k))
    } catch {
      // Ignore
    }
  },

  // Immediate flush for beforeunload event
  flushEntriesNow: (entries: any[]) => {
    const serialized = JSON.stringify(entries)
    memoryCache.set(STORAGE_KEYS.ENTRIES, serialized)
    idbSet(STORAGE_KEYS.ENTRIES, entries)
  },
}
