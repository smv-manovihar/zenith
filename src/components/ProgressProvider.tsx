import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export type EntryStatus =
  | "pending"
  | "resolving"
  | "resolved"
  | "syncing"
  | "completed"
  | "error"

export interface Selection {
  id: number
  title: string
  image: string
  rating: number
  status: "pending" | "syncing" | "completed" | "error"
  error?: string
}

export interface AnimeEntry {
  originalLine: string
  name: string
  rating: number
  selections: Selection[]
  status: EntryStatus
  error?: string
}

interface ProgressContextType {
  entries: AnimeEntry[]
  setEntries: (entries: AnimeEntry[]) => void
  updateEntry: (index: number, updates: Partial<AnimeEntry>) => void
  token: string | null
  setToken: (token: string | null) => void
  clientId: string
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [entries, setEntriesState] = useState<AnimeEntry[]>(() => {
    const saved = localStorage.getItem("anilist_updator_entries")
    if (!saved) return []

    try {
      const parsed = JSON.parse(saved)
      // Migration logic for old single-selection format
      return parsed.map((entry: any) => {
        if (!entry.selections) {
          const selections: Selection[] = []
          if (entry.selectedMediaId) {
            selections.push({
              id: entry.selectedMediaId,
              title: entry.selectedMediaTitle || entry.name,
              image: entry.selectedMediaImage || "",
              rating: entry.rating || 0,
              status: entry.status === "completed" ? "completed" : "pending",
            })
          }
          return {
            originalLine: entry.originalLine || "",
            name: entry.name || "",
            rating: entry.rating || 0,
            selections,
            status: entry.status || "pending",
            error: entry.error,
          }
        }
        return entry
      })
    } catch (e) {
      console.error("Failed to parse entries from localStorage", e)
      return []
    }
  })

  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem("anilist_updator_token")
  )
  const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID || ""

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("anilist_updator_entries", JSON.stringify(entries))
    }, 1000) // Debounce for 1 second

    return () => clearTimeout(handler)
  }, [entries])

  useEffect(() => {
    if (token) localStorage.setItem("anilist_updator_token", token)
    else localStorage.removeItem("anilist_updator_token")
  }, [token])

  const setEntries = useCallback((newEntries: AnimeEntry[]) => {
    // Ensure new entries have the selections array
    const initializedEntries = newEntries.map((e) => ({
      ...e,
      selections: e.selections || [],
    }))
    setEntriesState(initializedEntries)
  }, [])

  const updateEntry = useCallback(
    (index: number, updates: Partial<AnimeEntry>) => {
      setEntriesState((prev) =>
        prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry))
      )
    },
    []
  )

  const setToken = useCallback((t: string | null) => setTokenState(t), [])

  const contextValue = useMemo(
    () => ({
      entries,
      setEntries,
      updateEntry,
      token,
      setToken,
      clientId,
    }),
    [entries, setEntries, updateEntry, token, setToken, clientId]
  )

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  )
}

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used within a ProgressProvider');
  return context;
};
