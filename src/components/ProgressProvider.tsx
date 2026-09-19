import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react"
import { queryAniList, GET_VIEWER_QUERY } from "@/lib/anilist"
import { Storage, initAndMigrateStorage } from "@/lib/storage"
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
  idMal?: number | null
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
  id: number
  name: string
  avatar: string
  siteUrl?: string
  scoreFormat: string
  mediaListOptions: {
    scoreFormat: string
  }
}

export interface AnimeEntry {
  id: string
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
  setUser: (user: UserData | null) => void
  clientId: string
}

const ProgressContext = createContext<ProgressContextType | undefined>(
  undefined
)

const normalizeAnimeEntries = (raw: any): AnimeEntry[] => {
  if (!raw) return []
  const array = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
    ? (() => {
        try {
          return JSON.parse(raw)
        } catch {
          return []
        }
      })()
    : []

  if (!Array.isArray(array)) return []

  return array.map((entry: any) => {
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
      id: entry.id || crypto.randomUUID(),
      selections,
      status: entry.status || "pending",
    }
  })
}

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [entries, setEntriesState] = useState<AnimeEntry[]>(() => {
    const saved = Storage.getEntries()
    return normalizeAnimeEntries(saved)
  })
  const [isStorageReady, setIsStorageReady] = useState(false)

  const [token, setTokenState] = useState<string | null>(() =>
    Storage.getToken()
  )
  const [user, setUser] = useState<UserData | null>(() => {
    const saved = Storage.getUser()
    return saved ? JSON.parse(saved) : null
  })
  const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID || ""

  const [lastVisitedIndex, setLastVisitedIndexState] = useState<number>(() => {
    const saved = Storage.getLastIndex()
    return saved ? parseInt(saved, 10) : 0
  })

  const entriesRef = useRef(entries)
  useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  // Run IndexedDB storage initialization & migration once on mount
  useEffect(() => {
    let isMounted = true
    initAndMigrateStorage()
      .then((result) => {
        if (!isMounted) return
        if (result?.entries && Array.isArray(result.entries) && result.entries.length > 0) {
          setEntriesState(normalizeAnimeEntries(result.entries))
        }
        setIsStorageReady(true)
      })
      .catch((e) => {
        console.warn("Storage initialization failed:", e)
        if (isMounted) setIsStorageReady(true)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Flush entries immediately on tab close or page reload to prevent race conditions
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isStorageReady) {
        Storage.flushEntriesNow(entriesRef.current)
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isStorageReady])

  // Validate token and fetch user on load or when token changes
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const fetchUser = async () => {
      try {
        const response = await queryAniList(
          GET_VIEWER_QUERY,
          {},
          token,
          1,
          controller.signal
        )
        if (response.data?.Viewer) {
          const userData: UserData = {
            id: response.data.Viewer.id,
            name: response.data.Viewer.name,
            avatar: response.data.Viewer.avatar?.large || "",
            siteUrl: response.data.Viewer.siteUrl,
            scoreFormat: response.data.Viewer.mediaListOptions?.scoreFormat || "POINT_10_DECIMAL",
            mediaListOptions: {
              scoreFormat: response.data.Viewer.mediaListOptions?.scoreFormat || "POINT_10_DECIMAL",
            },
          }
          setUser(userData)
          Storage.setUser(userData)
        }
      } catch (error: any) {
        if (error.name === "AbortError" || error.message === "canceled") return

        const status = error.response?.status
        const isAuthError =
          status === 400 ||
          status === 401 ||
          error.message?.toLowerCase().includes("unauthorized") ||
          error.message?.toLowerCase().includes("invalid token")

        if (isAuthError) {
          console.warn("AniList session invalid or expired:", error)
          Storage.removeToken()
          setTokenState(null)
          setUser(null)
          toast.error("Your AniList session has expired. Please log in again.")
        } else {
          console.error("Failed to fetch user data:", error)
          toast.error("Failed to fetch AniList profile. Check your connection.")
        }
      }
    }

    // Only fetch if user profile isn't loaded or user is empty
    if (!user || !user.id) {
      fetchUser()
    }

    return () => controller.abort()
  }, [token, user])

  useEffect(() => {
    Storage.setLastIndex(lastVisitedIndex)
  }, [lastVisitedIndex])

  // Debounced non-blocking write to storage
  useEffect(() => {
    if (!isStorageReady) return

    const handler = setTimeout(() => {
      Storage.setEntries(entries)
    }, 1000)

    return () => clearTimeout(handler)
  }, [entries, isStorageReady])

  const setEntries = useCallback((newEntries: AnimeEntry[]) => {
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

  const setToken = useCallback((t: string | null) => {
    setTokenState(t)
    if (t) {
      Storage.setToken(t)
    } else {
      Storage.removeToken()
      setUser(null)
    }
  }, [])

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
      setUser: (u: UserData | null) => {
        setUser(u)
        if (u) Storage.setUser(u)
      },
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
