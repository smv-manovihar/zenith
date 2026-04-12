import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react"
import { queryAniList, GET_VIEWER_QUERY } from "@/lib/anilist"
import { toast } from "sonner"

export type EntryStatus =
  | "pending"
  | "resolving"
  | "resolved"
  | "syncing"
  | "completed"
  | "error"

export type AniListStatus =
  | "CURRENT"
  | "PLANNING"
  | "COMPLETED"
  | "REPEATING"
  | "PAUSED"
  | "DROPPED"

export interface Selection {
  id: number
  title: string
  image: string
  rating: number
  status: "pending" | "syncing" | "completed" | "error"
  anilistStatus: AniListStatus
  progress: number
  totalEpisodes: number | null
  error?: string
}

export interface UserData {
  name: string
  avatar: string
}

export interface AnimeEntry {
  originalLine: string
  name: string
  rating: number
  selections: Selection[]
  status: EntryStatus
  isManual?: boolean
  error?: string
}

interface ProgressContextType {
  entries: AnimeEntry[]
  setEntries: (entries: AnimeEntry[]) => void
  updateEntry: (index: number, updates: Partial<AnimeEntry>) => void
  updateSelection: (
    entryIndex: number,
    selectionIndex: number,
    updates: Partial<Selection>
  ) => void
  token: string | null
  setToken: (token: string | null) => void
  lastVisitedIndex: number
  setLastVisitedIndex: (index: number) => void
  user: UserData | null
  clientId: string
}

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined
)

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [entries, setEntriesState] = useState<AnimeEntry[]>(() => {
    const saved = localStorage.getItem("anilist_updator_entries")
    if (!saved) return []

    try {
      const parsed = JSON.parse(saved)
      return parsed.map((entry: any) => {
        const selections = (entry.selections || []).map((s: any) => ({
          ...s,
          anilistStatus: s.anilistStatus || "COMPLETED",
          progress: s.progress ?? 0,
          totalEpisodes: s.totalEpisodes ?? null,
        }))

        // Migration logic for old single-selection format
        if (!entry.selections && entry.selectedMediaId) {
          selections.push({
            id: entry.selectedMediaId,
            title: entry.selectedMediaTitle || entry.name,
            image: entry.selectedMediaImage || "",
            rating: entry.rating || 0,
            status: entry.status === "completed" ? "completed" : "pending",
            anilistStatus: "COMPLETED",
            progress: 0,
            totalEpisodes: null,
          })
        }

        return {
          ...entry,
          selections,
          status: entry.status || "pending",
        }
      })
    } catch (e) {
      console.error("Failed to parse entries from localStorage", e)
      return []
    }
  })

  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem("anilist_updator_token")
  )
  const [user, setUser] = useState<UserData | null>(() => {
    const saved = localStorage.getItem("anilist_updator_user")
    return saved ? JSON.parse(saved) : null
  })
  const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID || ""

  const [lastVisitedIndex, setLastVisitedIndexState] = useState<number>(() => {
    const saved = localStorage.getItem("anilist_updator_last_index")
    return saved ? parseInt(saved, 10) : 0
  })

  useEffect(() => {
    if (token && !user) {
      const controller = new AbortController()
      const fetchUser = async () => {
        try {
          const response = await queryAniList(
            GET_VIEWER_QUERY,
            {},
            token,
            3,
            controller.signal
          )
          if (response.data?.Viewer) {
            const userData = {
              name: response.data.Viewer.name,
              avatar: response.data.Viewer.avatar.large,
            }
            setUser(userData)
            localStorage.setItem(
              "anilist_updator_user",
              JSON.stringify(userData)
            )
          }
        } catch (error: any) {
          if (error.name === "AbortError" || error.message === "canceled")
            return
          console.error("Failed to fetch user data:", error)
          toast.error("Failed to fetch AniList profile")
        }
      }
      fetchUser()
      return () => controller.abort()
    }
  }, [token, user])

  useEffect(() => {
    localStorage.setItem(
      "anilist_updator_last_index",
      lastVisitedIndex.toString()
    )
  }, [lastVisitedIndex])

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("anilist_updator_entries", JSON.stringify(entries))
    }, 1000) // Debounce for 1 second

    return () => clearTimeout(handler)
  }, [entries])

  useEffect(() => {
    if (token) localStorage.setItem("anilist_updator_token", token)
    else {
      localStorage.removeItem("anilist_updator_token")
      localStorage.removeItem("anilist_updator_user")
      setUser(null)
    }
  }, [token])

  const setEntries = useCallback((newEntries: AnimeEntry[]) => {
    // Ensure new entries have the selections array
    const initializedEntries = newEntries.map((e) => ({
      ...e,
      selections: e.selections || [],
      isManual: e.isManual ?? false,
    }))
    setEntriesState(initializedEntries)
    setLastVisitedIndexState(0)
  }, [])

  const setLastVisitedIndex = useCallback((index: number) => {
    setLastVisitedIndexState(index)
  }, [])

  const updateEntry = useCallback(
    (index: number, updates: Partial<AnimeEntry>) => {
      setEntriesState((prev) =>
        prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry))
      )
    },
    []
  )

  const updateSelection = useCallback(
    (
      entryIndex: number,
      selectionIndex: number,
      updates: Partial<Selection>
    ) => {
      setEntriesState((prev) =>
        prev.map((entry, i) => {
          if (i !== entryIndex) return entry
          const newSelections = entry.selections.map((sel, j) =>
            j === selectionIndex ? { ...sel, ...updates } : sel
          )
          return { ...entry, selections: newSelections }
        })
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
      updateSelection,
      token,
      setToken,
      lastVisitedIndex,
      setLastVisitedIndex,
      user,
      clientId,
    }),
    [
      entries,
      setEntries,
      updateEntry,
      updateSelection,
      token,
      setToken,
      lastVisitedIndex,
      setLastVisitedIndex,
      user,
      clientId,
    ]
  )

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  )
}

export const useProgress = () => {
  const context = useContext(ProgressContext)
  if (!context)
    throw new Error("useProgress must be used within a ProgressProvider")
  return context
}
