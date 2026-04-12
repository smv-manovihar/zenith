/**
 * Centralized Storage Utility for Zenith
 * Handles localStorage keys, migration, and type-safe access.
 */

const PREFIX = "zenith_"
const OLD_PREFIX = "anilist_updator_"

export const STORAGE_KEYS = {
  ENTRIES: `${PREFIX}entries`,
  TOKEN: `${PREFIX}token`,
  USER: `${PREFIX}user`,
  LAST_INDEX: `${PREFIX}last_index`,
  PREFERRED_FORMATS: `${PREFIX}preferred_formats`,
}

const OLD_STORAGE_KEYS = {
  ENTRIES: `${OLD_PREFIX}entries`,
  TOKEN: `${OLD_PREFIX}token`,
  USER: `${OLD_PREFIX}user`,
  LAST_INDEX: `${OLD_PREFIX}last_index`,
  PREFERRED_FORMATS: `${OLD_PREFIX}preferred_formats`,
}

/**
 * Migration helper to move data from old prefix to new prefix
 */
export const getMigratedItem = (key: string, oldKey: string): string | null => {
  if (typeof window === "undefined") return null
  
  const item = localStorage.getItem(key)
  if (item !== null) return item

  const oldItem = localStorage.getItem(oldKey)
  if (oldItem !== null) {
    // Standard migration: copy to new key, keep old for backward compatibility (per user request)
    localStorage.setItem(key, oldItem)
    return oldItem
  }
  
  return null
}

export const Storage = {
  getEntries: () => getMigratedItem(STORAGE_KEYS.ENTRIES, OLD_STORAGE_KEYS.ENTRIES),
  setEntries: (entries: any[]) => localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries)),
  
  getToken: () => getMigratedItem(STORAGE_KEYS.TOKEN, OLD_STORAGE_KEYS.TOKEN),
  setToken: (token: string) => localStorage.setItem(STORAGE_KEYS.TOKEN, token),
  removeToken: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  },

  getUser: () => getMigratedItem(STORAGE_KEYS.USER, OLD_STORAGE_KEYS.USER),
  setUser: (user: any) => localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),

  getLastIndex: () => getMigratedItem(STORAGE_KEYS.LAST_INDEX, OLD_STORAGE_KEYS.LAST_INDEX),
  setLastIndex: (index: number) => localStorage.setItem(STORAGE_KEYS.LAST_INDEX, index.toString()),

  getPreferredFormats: () => getMigratedItem(STORAGE_KEYS.PREFERRED_FORMATS, OLD_STORAGE_KEYS.PREFERRED_FORMATS),
  setPreferredFormats: (formats: string[]) => localStorage.setItem(STORAGE_KEYS.PREFERRED_FORMATS, JSON.stringify(formats)),
}
