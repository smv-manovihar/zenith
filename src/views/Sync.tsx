import { useState, useMemo, useCallback, useEffect, type FC, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  useProgress,
  type AnimeEntry,
  type Selection,
} from "@/components/ProgressProvider"
import {
  queryAniList,
  SAVE_MEDIA_LIST_ENTRY,
  GET_MEDIA_LIST_COLLECTION,
  rateLimiter,
} from "@/lib/anilist"
import { Storage, type SyncSessionRecord } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RefreshCcw,
  Star,
  Info,
  Pause,
  Clock,
  XCircle,
  Hash,
  Square,
  CheckSquare,
  ListChecks,
  Download,
  ExternalLink,
  Zap,
  Gauge,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  History,
  Sparkles,
  PlusCircle,
} from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { HelpBullets, HelpSteps } from "@/components/PageHelp"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { List, type RowComponentProps, type ListImperativeAPI } from "react-window"
import { cn } from "@/lib/utils"
import { type AniListScoreFormat, formatScoreDisplay } from "@/lib/scoreFormat"
import { generateMalXml, downloadFile } from "@/lib/exportUtils"
import { MyAnimeListLogo } from "@/components/MyAnimeListLogo"
import { DiffPreviewDialog } from "@/components/Sync/DiffPreviewDialog"
import { SyncHistoryDrawer } from "@/components/Sync/SyncHistoryDrawer"
import { computeAnimeDiff, type DiffSummary } from "@/lib/diffUtils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type SyncSpeed = "fast" | "normal" | "safe"

export function getSpeedConfig(limit: number): Record<
  SyncSpeed,
  { label: string; delay: number; description: string }
> {
  const safeLimit = Math.max(10, limit || 30)
  const baseInterval = 60000 / safeLimit // e.g. 2000ms for 30/min, 667ms for 90/min

  const fastDelay = Math.max(400, Math.round(baseInterval * 0.7))
  const normalDelay = Math.round(baseInterval * 1.05)
  const safeDelay = Math.max(1500, Math.round(baseInterval * 1.8))

  return {
    fast: {
      label: "Fast",
      delay: fastDelay,
      description: `${(fastDelay / 1000).toFixed(1)}s delay. Aggressive burst mode for ${safeLimit} req/min limit`,
    },
    normal: {
      label: "Normal",
      delay: normalDelay,
      description: `${(normalDelay / 1000).toFixed(1)}s delay. Balanced sustainable pacing for ${safeLimit} req/min limit`,
    },
    safe: {
      label: "Safe",
      delay: safeDelay,
      description: `${(safeDelay / 1000).toFixed(1)}s delay. Extra conservative pacing for ${safeLimit} req/min limit`,
    },
  }
}

type SyncRowItem =
  | { type: "header"; entry: AnimeEntry; index: number }
  | {
      type: "selection"
      selection: Selection
      entryIndex: number
      selectionIndex: number
      entry: AnimeEntry
    }

interface SyncRowProps {
  items: SyncRowItem[]
  isSyncing: boolean
  scoreFormat: AniListScoreFormat
  selectedKeys: Set<string>
  onToggleSelect: (key: string) => void
  onToggleEntryHeader: (entryIndex: number) => void
  onRetrySingle?: (entryIndex: number, selectionIndex: number) => void
}

const SyncRowComponent = ({
  index,
  style,
  items,
  isSyncing,
  scoreFormat,
  selectedKeys,
  onToggleSelect,
  onToggleEntryHeader,
  onRetrySingle,
}: RowComponentProps<SyncRowProps>) => {
  const item = items[index]
  if (!item) return null

  if (item.type === "header") {
    const isAllHeaderSelected =
      item.entry.selections.length > 0 &&
      item.entry.selections.every((_, sIdx) =>
        selectedKeys.has(`${item.index}-${sIdx}`)
      )
    const isSomeHeaderSelected =
      !isAllHeaderSelected &&
      item.entry.selections.some((_, sIdx) =>
        selectedKeys.has(`${item.index}-${sIdx}`)
      )
    const isAllCompleted =
      item.entry.selections.length > 0 &&
      item.entry.selections.every((s: any) => s.status === "completed")

    return (
      <div style={style} className="px-1 sm:px-2 py-0.5">
        <div className="flex h-full items-center justify-between border-b border-primary/10 bg-muted/40 px-2.5 py-1 sm:px-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center">
              {isAllCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Checkbox
                  checked={
                    isAllHeaderSelected
                      ? true
                      : isSomeHeaderSelected
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={() => onToggleEntryHeader(item.index)}
                  disabled={isSyncing || item.entry.selections.length === 0}
                  aria-label={`Select all for ${item.entry.name}`}
                />
              )}
            </div>
            <span className="truncate text-xs font-black tracking-wider text-muted-foreground uppercase">
              {item.entry.name}
            </span>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 rounded-none border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] sm:text-xs font-black tracking-wider text-primary uppercase"
          >
            {item.entry.selections.length} Items
          </Badge>
        </div>
      </div>
    )
  }

  const { selection, entryIndex, selectionIndex } = item
  const itemKey = `${entryIndex}-${selectionIndex}`
  const isSelected = selectedKeys.has(itemKey)
  const showProgress = ["CURRENT", "REPEATING", "PAUSED", "DROPPED"].includes(
    selection.anilistStatus
  )

  return (
    <div style={style} className="px-1 sm:px-2 py-0.5">
      <div
        className={cn(
          "group flex h-full items-center justify-between border-b border-primary/5 bg-card/40 px-2 py-1.5 transition-all duration-300 last:border-0 hover:bg-card/60 sm:gap-4 sm:px-3 sm:py-2",
          isSyncing &&
            selection.status === "pending" &&
            "opacity-40 grayscale-[0.5]",
          !isSelected && !isSyncing && "opacity-60"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {/* Checkbox for Selective Sync */}
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center">
            {selection.status === "completed" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(itemKey)}
                disabled={isSyncing || (!isSelected && isSyncing)}
                aria-label={`Select ${selection.title}`}
              />
            )}
          </div>

          <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded-none bg-muted shadow-sm ring-1 ring-primary/20 sm:h-12 sm:w-9.5">
            {selection.image ? (
              <img
                src={selection.image}
                className="h-full w-full object-cover grayscale-25 transition-all duration-500 group-hover:grayscale-0"
                alt=""
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-muted/60" />
            )}
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/60 backdrop-blur-xs" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 sm:gap-1.5">
            <span className="truncate text-xs font-black tracking-tight text-foreground uppercase sm:text-sm">
              {selection.title}
            </span>
            <div className="flex items-center gap-1.5 overflow-hidden text-[11px] sm:gap-2 sm:text-xs">
              <div className="inline-flex shrink-0 items-center gap-1 bg-primary/10 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-primary uppercase sm:text-[11px]">
                {selection.anilistStatus === "CURRENT" && (
                  <Play className="h-2.5 w-2.5 fill-primary" />
                )}
                {selection.anilistStatus === "PLANNING" && (
                  <Clock className="h-2.5 w-2.5" />
                )}
                {selection.anilistStatus === "COMPLETED" && (
                  <CheckCircle2 className="h-2.5 w-2.5" />
                )}
                {selection.anilistStatus === "REPEATING" && (
                  <RefreshCcw className="h-2.5 w-2.5" />
                )}
                {selection.anilistStatus === "PAUSED" && (
                  <Pause className="h-2.5 w-2.5 fill-primary" />
                )}
                {selection.anilistStatus === "DROPPED" && (
                  <XCircle className="h-2.5 w-2.5" />
                )}
                <span>
                  {selection.anilistStatus === "CURRENT"
                    ? "Watching"
                    : selection.anilistStatus === "PLANNING"
                      ? "Planned"
                      : selection.anilistStatus}
                </span>
              </div>

              {showProgress && (
                <div className="inline-flex shrink-0 items-center gap-0.5 font-bold text-muted-foreground/80 uppercase text-[10px] sm:text-[11px]">
                  <Hash className="h-2.5 w-2.5 opacity-40" />
                  <span>EP {selection.progress}</span>
                  {selection.totalEpisodes && (
                    <span className="opacity-50">/{selection.totalEpisodes}</span>
                  )}
                </div>
              )}

              <div
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 px-1.5 py-0.5 text-[10px] font-black uppercase sm:text-[11px]",
                  selection.rating === 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/10 text-amber-500 dark:text-amber-400"
                )}
              >
                <Star className="h-2.5 w-2.5 fill-current shrink-0" />
                <span>{formatScoreDisplay(selection.rating, scoreFormat)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 pl-1.5 sm:pl-3">
          {selection.status === "completed" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-none bg-emerald-500/10 text-emerald-500"
            >
              <CheckCircle2 className="h-4 w-4" />
            </motion.div>
          )}
          {selection.status === "syncing" && (
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          {selection.status === "error" && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-none bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-none border-destructive/20 bg-destructive/10 text-xs font-black tracking-wider text-destructive uppercase">
                  {selection.error || "Sync failed"}
                </TooltipContent>
              </Tooltip>
              {onRetrySingle && !isSyncing && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 sm:h-7 sm:w-7 rounded-none border border-destructive/20 hover:bg-destructive/10"
                  onClick={() => onRetrySingle(entryIndex, selectionIndex)}
                  title="Retry this item"
                >
                  <RotateCcw className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          )}
          {selection.status === "pending" && (
            <div
              className={cn(
                "h-5 w-5 rounded-none border transition-colors sm:h-6 sm:w-6",
                isSyncing ? "border-primary/10 bg-muted/10" : "border-primary/20 bg-muted/30"
              )}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const Sync: FC = () => {
  const { entries, updateEntry, updateSelection, token, user } = useProgress()
  const scoreFormat =
    (user?.scoreFormat as AniListScoreFormat) ?? "POINT_10_DECIMAL"
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasSyncStarted, setHasSyncStarted] = useState(false)
  const [syncSpeed, setSyncSpeed] = useState<SyncSpeed>("normal")
  const [showErrorPanel, setShowErrorPanel] = useState(true)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [diffSummary, setDiffSummary] = useState<DiffSummary | null>(null)
  const [isDiffLoading, setIsDiffLoading] = useState(false)
  const [isDiffChecking, setIsDiffChecking] = useState(false)
  // Diff cache key: while this is unchanged the stored summary is fresh and
  // reopening the dialog must not fire a new AniList request.
  const entriesSignature = useMemo(
    () =>
      entries
        .map((e) =>
          e.selections
            .map(
              (s) =>
                `${s.id}:${s.rating}:${s.anilistStatus}:${s.progress}:${s.status}`
            )
            .join(",")
        )
        .join("|"),
    [entries]
  )
  const diffKey = `${user?.id ?? ""}|${entriesSignature}`
  const diffKeyRef = useRef("")
  const isDiffFetchingRef = useRef(false)

  const [apiBudget, setApiBudget] = useState<{
    remaining: number
    limit: number
  }>(() => ({
    remaining: rateLimiter.remaining,
    limit: rateLimiter.limit,
  }))

  useEffect(() => {
    const unsubscribe = rateLimiter.subscribe((info) => {
      setApiBudget({
        remaining: info.remaining,
        limit: info.limit,
      })
    })
    return unsubscribe
  }, [])

  const navigate = useNavigate()
  const listRef = useRef<ListImperativeAPI | null>(null)
  const isCancelled = useRef(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // Selective sync keys set
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    const set = new Set<string>()
    entries.forEach((e, eIdx) => {
      e.selections.forEach((s, sIdx) => {
        if (s.status !== "completed") {
          set.add(`${eIdx}-${sIdx}`)
        }
      })
    })
    return set
  })

  // Synchronize default selected keys when new entries arrive
  useEffect(() => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      entries.forEach((e, eIdx) => {
        e.selections.forEach((s, sIdx) => {
          const key = `${eIdx}-${sIdx}`
          if (s.status !== "completed" && !prev.has(key)) {
            next.add(key)
          }
        })
      })
      return next
    })
  }, [entries])

  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleEntryHeader = useCallback(
    (entryIndex: number) => {
      const targetEntry = entries[entryIndex]
      if (!targetEntry) return

      setSelectedKeys((prev) => {
        const next = new Set(prev)
        const isAllSelected = targetEntry.selections.every((_, sIdx) =>
          prev.has(`${entryIndex}-${sIdx}`)
        )

        targetEntry.selections.forEach((_, sIdx) => {
          const key = `${entryIndex}-${sIdx}`
          if (isAllSelected) next.delete(key)
          else next.add(key)
        })
        return next
      })
    },
    [entries]
  )

  const selectAll = useCallback(() => {
    const set = new Set<string>()
    entries.forEach((e, eIdx) => {
      e.selections.forEach((s, sIdx) => {
        if (s.status !== "completed") set.add(`${eIdx}-${sIdx}`)
      })
    })
    setSelectedKeys(set)
  }, [entries])

  const selectPendingOnly = useCallback(() => {
    const set = new Set<string>()
    entries.forEach((e, eIdx) => {
      e.selections.forEach((s, sIdx) => {
        if (s.status === "pending") set.add(`${eIdx}-${sIdx}`)
      })
    })
    setSelectedKeys(set)
  }, [entries])

  const selectFailedOnly = useCallback(() => {
    const set = new Set<string>()
    entries.forEach((e, eIdx) => {
      e.selections.forEach((s, sIdx) => {
        if (s.status === "error") set.add(`${eIdx}-${sIdx}`)
      })
    })
    setSelectedKeys(set)
  }, [entries])

  // Keys of selections that are new on AniList (from the cached diff).
  const newKeys = useMemo(() => {
    if (!diffSummary || diffSummary.newCount === 0) return null
    const set = new Set<string>()
    diffSummary.items.forEach((item) => {
      if (item.category === "new") {
        set.add(`${item.entryIndex}-${item.selectionIndex}`)
      }
    })
    return set
  }, [diffSummary])

  const selectNewOnly = useCallback(() => {
    if (!newKeys) return
    setSelectedKeys(new Set(newKeys))
  }, [newKeys])

  const selectNone = useCallback(() => {
    setSelectedKeys(new Set())
  }, [])

  // Single source of truth for counts
  const totalToSync = useMemo(
    () => entries.reduce((acc, e) => acc + e.selections.length, 0),
    [entries]
  )
  const totalCompleted = useMemo(
    () =>
      entries.reduce(
        (acc, e) =>
          acc + e.selections.filter((s) => s.status === "completed").length,
        0
      ),
    [entries]
  )
  const totalErrors = useMemo(
    () =>
      entries.reduce(
        (acc, e) =>
          acc + e.selections.filter((s) => s.status === "error").length,
        0
      ),
    [entries]
  )
  const totalPending = useMemo(
    () =>
      entries.reduce(
        (acc, e) =>
          acc + e.selections.filter((s) => s.status === "pending").length,
        0
      ),
    [entries]
  )
  const totalActionable = useMemo(
    () =>
      entries.reduce(
        (acc, e) =>
          acc + e.selections.filter((s) => s.status !== "completed").length,
        0
      ),
    [entries]
  )
  const selectedCount = selectedKeys.size
  const syncProgress =
    totalToSync > 0 ? Math.round((totalCompleted / totalToSync) * 100) : 0

  const activeSelectionMode = useMemo<
    "all" | "pending" | "failed" | "new" | "none" | "custom"
  >(() => {
    if (selectedKeys.size === 0) return "none"

    let countPendingSelected = 0
    let countFailedSelected = 0
    let countOtherSelected = 0

    entries.forEach((e, eIdx) => {
      e.selections.forEach((s, sIdx) => {
        const key = `${eIdx}-${sIdx}`
        if (selectedKeys.has(key)) {
          if (s.status === "pending") countPendingSelected++
          else if (s.status === "error") countFailedSelected++
          else countOtherSelected++
        }
      })
    })

    if (
      totalActionable > 0 &&
      selectedKeys.size === totalActionable &&
      countOtherSelected === 0
    ) {
      return "all"
    }

    if (
      totalPending > 0 &&
      selectedKeys.size === totalPending &&
      countPendingSelected === totalPending &&
      countFailedSelected === 0 &&
      countOtherSelected === 0
    ) {
      return "pending"
    }

    if (
      totalErrors > 0 &&
      selectedKeys.size === totalErrors &&
      countFailedSelected === totalErrors &&
      countPendingSelected === 0 &&
      countOtherSelected === 0
    ) {
      return "failed"
    }

    if (
      newKeys &&
      selectedKeys.size === newKeys.size &&
      [...selectedKeys].every((key) => newKeys.has(key))
    ) {
      return "new"
    }

    return "custom"
  }, [entries, selectedKeys, totalActionable, totalPending, totalErrors, newKeys])

  const hasMissingScores = entries.some(
    (e) => e.selections.length > 0 && e.selections.some((s) => s.rating === 0)
  )

  const abortRef = useRef<AbortController | null>(null)

  // Failed selections for Error Recovery Panel
  const failedSelections = useMemo(() => {
    const list: {
      entryName: string
      entryIndex: number
      selectionIndex: number
      selection: Selection
    }[] = []
    entries.forEach((entry, entryIndex) => {
      entry.selections.forEach((selection, selectionIndex) => {
        if (selection.status === "error") {
          list.push({ entryName: entry.name, entryIndex, selectionIndex, selection })
        }
      })
    })
    return list
  }, [entries])

  const speedConfig = useMemo(
    () => getSpeedConfig(apiBudget.limit),
    [apiBudget.limit]
  )

  // Estimated Time Remaining calculation based on dynamic limit throttle
  const estimatedTime = useMemo(() => {
    if (!isSyncing || selectedCount <= 0) return null
    const msPerItem = speedConfig[syncSpeed].delay
    const totalSecs = Math.ceil((selectedCount * msPerItem) / 1000)
    if (totalSecs < 60) return `${totalSecs}s`
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}m ${secs > 0 ? `${secs}s` : ""}`
  }, [isSyncing, selectedCount, syncSpeed, speedConfig])

  const handleRetrySingle = useCallback(
    (entryIndex: number, selectionIndex: number) => {
      updateSelection(entryIndex, selectionIndex, {
        status: "pending",
        error: undefined,
      })
      setSelectedKeys((prev) => new Set(prev).add(`${entryIndex}-${selectionIndex}`))
      toast.info("Item reset to pending. Press Sync to commit.")
    },
    [updateSelection]
  )

  // Single fetch for the AniList comparison. Records the cache key so repeat
  // callers can reuse the stored summary instead of firing new requests.
  const fetchDiff = useCallback(async () => {
    if (!user?.id || !token) return null
    const res = await queryAniList(
      GET_MEDIA_LIST_COLLECTION,
      { userId: user.id, type: "ANIME" },
      token
    )
    const rawLists = res.data?.MediaListCollection?.lists ?? []
    const diff = computeAnimeDiff(entries, rawLists)
    setDiffSummary(diff)
    diffKeyRef.current = diffKey
    return diff
  }, [user?.id, token, entries, diffKey])

  const refreshDiff = useCallback(async () => {
    if (isDiffFetchingRef.current) return null
    if (!user?.id || !token) {
      toast.error("User session missing.")
      return null
    }
    isDiffFetchingRef.current = true
    setIsDiffLoading(true)
    try {
      return await fetchDiff()
    } catch (e: any) {
      toast.error(
        "Failed to load AniList comparison: " + (e.message || "Unknown error")
      )
      return null
    } finally {
      setIsDiffLoading(false)
      isDiffFetchingRef.current = false
    }
  }, [fetchDiff, user?.id, token])

  const handleOpenDiffPreview = useCallback(async () => {
    setShowDiffModal(true)
    // Cache hit: render the stored summary, no new request.
    if (diffSummary && diffKeyRef.current === diffKey) return
    await refreshDiff()
  }, [diffSummary, diffKey, refreshDiff])

  const handleSkipUnchanged = useCallback(() => {
    if (!diffSummary) return
    const newKeys = new Set<string>()
    diffSummary.items.forEach((item) => {
      if (item.category !== "unchanged") {
        newKeys.add(`${item.entryIndex}-${item.selectionIndex}`)
      }
    })
    setSelectedKeys(newKeys)
    toast.success(`Selected ${newKeys.size} changed items. Unchanged items skipped.`)
  }, [diffSummary])

  // Auto dry-run on mount: compare with AniList first so duplicates are
  // excluded and new entries are pre-selected. Re-runs only when the cache
  // key (user + entry contents) changes.
  useEffect(() => {
    if (!token || !user?.id || entries.length === 0) return
    if (diffKeyRef.current === diffKey || isDiffFetchingRef.current) return

    const runAutoDiff = async () => {
      setIsDiffChecking(true)
      try {
        const diff = await refreshDiff()
        if (!diff) return
        const targetKeys = new Set<string>()
        const fallbackKeys = new Set<string>()
        diff.items.forEach((item) => {
          const key = `${item.entryIndex}-${item.selectionIndex}`
          if (item.category === "new") targetKeys.add(key)
          if (item.category !== "unchanged") fallbackKeys.add(key)
        })
        // Default selection is new entries; fall back to all changed items
        // when nothing is new so updates are still queued.
        const selected =
          targetKeys.size > 0 ? targetKeys : fallbackKeys
        if (diff.newCount > 0) {
          setSelectedKeys(selected)
          toast.success(
            `Selected ${selected.size} new ${selected.size === 1 ? "entry" : "entries"}. Use presets to include updates.`
          )
        } else if (diff.unchangedCount > 0) {
          setSelectedKeys(selected)
          toast.success(
            `Skipped ${diff.unchangedCount} up-to-date ${diff.unchangedCount === 1 ? "entry" : "entries"}. ${selected.size} to sync.`
          )
        }
      } catch {
        // Keep the default selection if the comparison fails
      } finally {
        setIsDiffChecking(false)
      }
    }

    runAutoDiff()
  }, [token, user?.id, entries.length, diffKey, refreshDiff])

  const handleSync = async () => {
    if (!token || isSyncing) {
      if (!token) toast.error("You must be logged in to sync.")
      return
    }

    if (selectedKeys.size === 0) {
      toast.info("No items selected to sync. Please select at least one item.")
      return
    }

    setIsSyncing(true)
    setHasSyncStarted(true)
    isCancelled.current = false
    const controller = new AbortController()
    abortRef.current = controller

    const tasks: {
      entryIndex: number
      selectionIndex: number
      selection: Selection
    }[] = []

    entries.forEach((entry, entryIndex) => {
      entry.selections.forEach((selection, selectionIndex) => {
        const key = `${entryIndex}-${selectionIndex}`
        if (selectedKeys.has(key) && selection.status !== "completed") {
          tasks.push({ entryIndex, selectionIndex, selection })
        }
      })
    })

    if (tasks.length === 0) {
      setIsSyncing(false)
      toast.info("No selected items left to sync.")
      return
    }

    let successCount = 0
    let errorCount = 0
    const errorLogs: { title: string; message: string }[] = []

    const runWorker = async () => {
      while (tasks.length > 0 && !isCancelled.current) {
        const task = tasks.shift()
        if (!task) break

        const { entryIndex, selectionIndex, selection } = task

        // Auto-scroll logic with properly typed scrollToRow
        if (listRef.current) {
          const flatIndex = flattenedItems.findIndex(
            (item) =>
              item.type === "selection" &&
              item.entryIndex === entryIndex &&
              item.selectionIndex === selectionIndex
          )
          if (flatIndex !== -1) {
            listRef.current.scrollToRow({
              index: flatIndex,
              align: "center",
              behavior: "auto",
            })
          }
        }

        updateSelection(entryIndex, selectionIndex, { status: "syncing" })
        updateEntry(entryIndex, { status: "syncing" })

        try {
          // Pre-emptive wait if we are out of API budget
          if (rateLimiter.isRateLimited) {
            const waitTime = rateLimiter.waitTime
            toast.info(
              `Rate limit reached. Pausing for ${Math.round(waitTime / 1000)}s...`
            )
            await new Promise((r) => setTimeout(r, waitTime))
          }

          const result = await queryAniList(
            SAVE_MEDIA_LIST_ENTRY,
            {
              mediaId: selection.id,
              status: selection.anilistStatus,
              score: selection.rating || 0,
              progress: Math.floor(selection.progress || 0),
            },
            token,
            3,
            controller.signal
          )

          updateSelection(entryIndex, selectionIndex, {
            status: "completed",
            error: undefined,
          })
          successCount++

          if (result.headers) {
            setApiBudget({
              remaining: parseInt(
                result.headers["x-ratelimit-remaining"] || "0"
              ),
              limit: parseInt(result.headers["x-ratelimit-limit"] || "30"),
            })
          }
        } catch (err: any) {
          if (
            err.name === "CanceledError" ||
            err.name === "AbortError" ||
            isCancelled.current
          ) {
            updateSelection(entryIndex, selectionIndex, { status: "pending" })
            break
          }

          console.error("Sync Error for:", selection.title, err)
          errorCount++
          const errMsg = err.message || "Failed to update"
          errorLogs.push({ title: selection.title, message: errMsg })
          const statusCode = err.response?.status

          // Fatal Error: Authentication failure
          if (statusCode === 401 || statusCode === 403) {
            isCancelled.current = true
            controller.abort()
            updateSelection(entryIndex, selectionIndex, {
              status: "error",
              error: "Authentication failed. Please log in again.",
            })
            toast.error(
              "Sync halted: Authentication failed. Token may be expired.",
              { duration: 5000 }
            )
            break
          }

          // Non-Fatal Error: Mark this specific item as failed, but CONTINUE syncing the rest
          updateSelection(entryIndex, selectionIndex, {
            status: "error",
            error: errMsg,
          })

          toast.error(`Failed to sync ${selection.title}. Continuing...`)
        }

        if (isCancelled.current) break

        // Dynamic stagger adaptively calculated based on user speed, live rate limit, remaining quota, and time to reset
        const currentSpeedConfig = getSpeedConfig(rateLimiter.limit)
        const baseDelay = currentSpeedConfig[syncSpeed].delay
        const stagger = rateLimiter.getDynamicDelay(baseDelay)

        try {
          await new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, stagger)
            controller.signal.addEventListener("abort", () => {
              clearTimeout(timer)
              reject(new Error("Aborted"))
            })
          })
        } catch (e) {
          break
        }
      }
    }

    await runWorker()

    entries.forEach((entry, idx) => {
      const allDone = entry.selections.every((s) => s.status === "completed")
      const anyErrors = entry.selections.some((s) => s.status === "error")

      if (allDone && entry.status !== "completed") {
        updateEntry(idx, { status: "completed" })
      } else if (anyErrors) {
        updateEntry(idx, { status: "error" })
      }
    })

    // Record sync history in IndexedDB
    const sessionRecord: SyncSessionRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      successCount,
      errorCount,
      totalCount: tasks.length,
      errors: errorLogs.length > 0 ? errorLogs : undefined,
    }
    await Storage.addSyncSessionRecord(sessionRecord)

    setIsSyncing(false)
    if (!isCancelled.current) {
      if (errorCount > 0) {
        toast.warning(`Sync finished: ${successCount} synced, ${errorCount} failed.`)
      } else {
        toast.success(`All ${successCount} selected entries synced successfully!`)
      }
    }
  }

  const handleDownloadXml = () => {
    const resolved: { name: string; selection: Selection }[] = []
    entries.forEach((entry) => {
      entry.selections.forEach((sel) => {
        if (sel.status === "completed" || sel.rating > 0) {
          resolved.push({ name: entry.name, selection: sel })
        }
      })
    })

    if (resolved.length === 0) {
      toast.error("No reviewed entries with valid ratings to export.")
      return
    }

    const xml = generateMalXml(resolved, scoreFormat)
    downloadFile(xml, "zenith-anilist-sync.xml", "application/xml")
    setShowImportDialog(true)
  }

  const flattenedItems = useMemo(() => {
    const items: SyncRowItem[] = []
    entries.forEach((entry, eIdx) => {
      items.push({ type: "header", entry, index: eIdx })
      entry.selections.forEach((selection, sIdx) => {
        items.push({
          type: "selection",
          selection,
          entryIndex: eIdx,
          selectionIndex: sIdx,
          entry,
        })
      })
    })
    return items
  }, [entries])

  const getRowHeight = (index: number, { items }: SyncRowProps) => {
    const item = items[index]
    if (item?.type === "header") return 36
    return 68
  }

  const rowProps = useMemo(
    () => ({
      items: flattenedItems,
      isSyncing,
      scoreFormat,
      selectedKeys,
      onToggleSelect: toggleSelect,
      onToggleEntryHeader: toggleEntryHeader,
      onRetrySingle: handleRetrySingle,
    }),
    [
      flattenedItems,
      isSyncing,
      scoreFormat,
      selectedKeys,
      toggleSelect,
      toggleEntryHeader,
      handleRetrySingle,
    ]
  )

  return (
    <div className="mx-auto w-full max-w-4xl animate-in space-y-6 px-1 pb-24 duration-700 fade-in slide-in-from-bottom-4 sm:px-4 sm:space-y-8">
      <PageHeader
        title="Commit to AniList"
        description="Push your reviewed selections and ratings directly to your AniList account."
        backTo="/review"
        helpSections={[
          {
            title: "About",
            content: (
              <p>
                Sync pushes your reviewed selections to AniList, one entry at
                a time. It first compares your work against your live AniList
                collection so already up to date entries are skipped
                automatically.
              </p>
            ),
          },
          {
            title: "What to do",
            content: (
              <HelpSteps>
                <li>Wait for the automatic AniList comparison to finish.</li>
                <li>
                  New entries are pre-selected. Use the All, Pending, New,
                  or Failed presets to change the scope.
                </li>
                <li>
                  Open Dry Run and Diff to confirm what is new, updated, or
                  unchanged.
                </li>
                <li>Pick a speed, then press Sync and watch the progress bar.</li>
                <li>
                  Reset and retry anything that fails, or download the MAL XML.
                </li>
              </HelpSteps>
            ),
          },
          {
            title: "Tips",
            content: (
              <HelpBullets>
                <li>
                  Completed items stay ticked off and are skipped next time.
                </li>
                <li>
                  Sync respects AniList rate limits and pauses when the quota
                  runs low.
                </li>
                <li>
                  Zero score entries block sync. Fix them back on the Review
                  page.
                </li>
                <li>Past sync sessions are kept under History.</li>
              </HelpBullets>
            ),
          },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-none text-xs font-bold uppercase"
              onClick={handleOpenDiffPreview}
              disabled={isSyncing}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Dry Run & Diff
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-none text-xs font-bold uppercase"
              onClick={() => setShowHistoryModal(true)}
            >
              <History className="h-3.5 w-3.5 text-primary" />
              History
            </Button>
          </>
        }
      />
      {(isDiffChecking || diffSummary) && (
        <div
          aria-live="polite"
          className="flex flex-col gap-3 rounded-none border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-primary/10 text-primary">
              {isDiffChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black tracking-wider uppercase">
                {isDiffChecking
                  ? "Comparing with AniList…"
                  : "AniList comparison ready"}
              </p>
              {isDiffChecking ? (
                <p className="mt-0.5 text-[11px] font-bold text-muted-foreground uppercase">
                  Skipping duplicates…
                </p>
              ) : (
                diffSummary && (
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-bold uppercase">
                    <span className="text-emerald-500">
                      {diffSummary.newCount} new
                    </span>
                    <span aria-hidden="true" className="text-muted-foreground/40">
                      ·
                    </span>
                    <span className="text-primary">
                      {diffSummary.updatedCount} updates
                    </span>
                    {diffSummary.unchangedCount > 0 && (
                      <>
                        <span
                          aria-hidden="true"
                          className="text-muted-foreground/40"
                        >
                          ·
                        </span>
                        <span className="text-muted-foreground">
                          {diffSummary.unchangedCount} skipped
                        </span>
                      </>
                    )}
                  </p>
                )
              )}
            </div>
          </div>
          {diffSummary && !isDiffChecking && (
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-none border-border/60 bg-background/60 text-foreground hover:border-primary/40 hover:text-primary"
                    onClick={() => void refreshDiff()}
                    disabled={isDiffLoading}
                    aria-label="Refresh AniList comparison"
                  >
                    <RefreshCcw
                      className={cn("h-3.5 w-3.5", isDiffLoading && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-none text-[11px] font-bold uppercase">
                  Refresh AniList comparison
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-none border-border/60 bg-background/60 px-2 text-xs font-bold text-foreground uppercase hover:border-primary/40 hover:text-primary"
                    onClick={() => void handleOpenDiffPreview()}
                  >
                    View details
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-none text-[11px] font-bold uppercase">
                  Open the dry-run diff dialog
                </TooltipContent>
              </Tooltip>
              {diffSummary.unchangedCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-none border-border/60 bg-background/60 px-2 text-xs font-bold text-foreground uppercase hover:border-primary/40 hover:text-primary"
                      onClick={selectAll}
                      disabled={isSyncing}
                    >
                      Include skipped
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-none text-[11px] font-bold uppercase">
                    Re-select everything, including up-to-date items
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Virtualized Sync List (Primary) */}
        <div className="order-2 space-y-4 lg:order-1 lg:col-span-2 sm:space-y-6">
          {/* Progress Overview Card */}
          <Card className="rounded-none border-primary/20 bg-card/40 backdrop-blur-md">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                    Overall Progress
                  </CardTitle>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-black text-foreground sm:text-2xl">
                      {syncProgress}%
                    </p>
                    {estimatedTime && (
                      <span className="text-xs font-bold text-primary/90 uppercase">
                        ETA: ~{estimatedTime}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black tracking-wider text-primary uppercase">
                    {totalCompleted} / {totalToSync} Total
                  </p>
                  {selectedCount > 0 && (
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      {selectedCount} Selected
                    </p>
                  )}
                  {totalErrors > 0 && (
                    <p className="text-xs font-black tracking-wider text-destructive uppercase">
                      {totalErrors} Failed
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 p-4 pt-0">
              <div className="relative">
                <Progress
                  value={syncProgress}
                  className="h-2 overflow-hidden rounded-none"
                />
                {isSyncing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, x: ["-100%", "100%"] }}
                    className="absolute inset-0 bg-linear-to-r from-transparent via-primary/30 to-transparent"
                    style={{ width: "100%" }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
              </div>
              {(isSyncing || hasSyncStarted) && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-black tracking-wider text-muted-foreground uppercase">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    API Budget
                  </span>
                  <Badge
                    variant={
                      apiBudget.remaining <= Math.max(3, apiBudget.limit * 0.15)
                        ? "destructive"
                        : "secondary"
                    }
                    className="rounded-none font-mono text-xs font-black"
                  >
                    {apiBudget.remaining} / {apiBudget.limit} available
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selective Sync Batch Controls Bar */}
          <div className="flex flex-col gap-2.5 border border-primary/20 bg-card/60 p-2.5 backdrop-blur-md sm:gap-3 sm:p-3">
            {/* Top Row: Context Title + Live Ready Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black tracking-wider text-muted-foreground uppercase">
                <ListChecks className="h-3.5 w-3.5 text-primary" />
                <span>Select Items</span>
              </div>
              <div className="flex items-center gap-1.5">
                {activeSelectionMode === "custom" && (
                  <span className="text-[10px] font-bold text-muted-foreground/70 uppercase">
                    Custom
                  </span>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-none font-mono text-xs font-black tracking-wider uppercase transition-colors",
                    selectedCount > 0
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/60 bg-muted/30 text-muted-foreground"
                  )}
                >
                  <CheckCircle2 className="mr-1 h-3 w-3 shrink-0" />
                  {selectedCount} Ready
                </Badge>
              </div>
            </div>

            {/* Segmented Preset Buttons Track */}
            <div
              className={cn(
                "grid grid-cols-2 gap-1 rounded-none border border-border/60 bg-muted/30 p-1",
                totalErrors > 0 ? "sm:grid-cols-5" : "sm:grid-cols-4"
              )}
            >
              {/* New Button */}
              <button
                type="button"
                onClick={selectNewOnly}
                disabled={isSyncing || !diffSummary || diffSummary.newCount === 0}
                title={
                  diffSummary
                    ? "Select only entries not yet on AniList"
                    : "Waiting for AniList comparison…"
                }
                className={cn(
                  "flex h-9 min-w-0 items-center justify-center gap-1 rounded-none px-1 text-[11px] font-black uppercase transition-all select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:gap-1.5 sm:px-2 sm:text-xs",
                  activeSelectionMode === "new"
                    ? "border border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                    : "border border-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground"
                )}
              >
                <PlusCircle className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate">New</span>
                {diffSummary && diffSummary.newCount > 0 && (
                  <span
                    className={cn(
                      "shrink-0 rounded-none px-1 text-[10px] font-bold",
                      activeSelectionMode === "new"
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {diffSummary.newCount}
                  </span>
                )}
              </button>

              {/* All Button */}
              <button
                type="button"
                onClick={selectAll}
                disabled={isSyncing || totalActionable === 0}
                className={cn(
                  "flex h-9 min-w-0 items-center justify-center gap-1 rounded-none px-1 text-[11px] font-black uppercase transition-all select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:gap-1.5 sm:px-2 sm:text-xs",
                  activeSelectionMode === "all"
                    ? "border border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "border border-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground"
                )}
              >
                <CheckSquare className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate">All</span>
                {totalActionable > 0 && (
                  <span
                    className={cn(
                      "shrink-0 rounded-none px-1 text-[10px] font-bold",
                      activeSelectionMode === "all"
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {totalActionable}
                  </span>
                )}
              </button>

              {/* Pending Button */}
              <button
                type="button"
                onClick={selectPendingOnly}
                disabled={isSyncing || totalPending === 0}
                className={cn(
                  "flex h-9 min-w-0 items-center justify-center gap-1 rounded-none px-1 text-[11px] font-black uppercase transition-all select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:gap-1.5 sm:px-2 sm:text-xs",
                  activeSelectionMode === "pending"
                    ? "border border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "border border-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground"
                )}
              >
                <Clock className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate">Pending</span>
                {totalPending > 0 && (
                  <span
                    className={cn(
                      "shrink-0 rounded-none px-1 text-[10px] font-bold",
                      activeSelectionMode === "pending"
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {totalPending}
                  </span>
                )}
              </button>

              {/* Failed Button (if any errors exist) */}
              {totalErrors > 0 && (
                <button
                  type="button"
                  onClick={selectFailedOnly}
                  disabled={isSyncing}
                  className={cn(
                    "flex h-9 min-w-0 items-center justify-center gap-1 rounded-none px-1 text-[11px] font-black uppercase transition-all select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:gap-1.5 sm:px-2 sm:text-xs",
                    activeSelectionMode === "failed"
                      ? "border border-destructive bg-destructive text-destructive-foreground shadow-sm shadow-destructive/20"
                      : "border border-transparent text-destructive hover:bg-destructive/10"
                  )}
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span className="min-w-0 truncate">Failed</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-none px-1 text-[10px] font-bold",
                      activeSelectionMode === "failed"
                        ? "bg-destructive-foreground/20 text-destructive-foreground"
                        : "bg-destructive/15 text-destructive"
                    )}
                  >
                    {totalErrors}
                  </span>
                </button>
              )}

              {/* None Button */}
              <button
                type="button"
                onClick={selectNone}
                disabled={isSyncing || selectedCount === 0}
                className={cn(
                  totalErrors > 0 && "col-span-2 sm:col-span-1",
                  "flex h-9 min-w-0 items-center justify-center gap-1 rounded-none px-1 text-[11px] font-black uppercase transition-all select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 sm:h-8 sm:gap-1.5 sm:px-2 sm:text-xs",
                  activeSelectionMode === "none"
                    ? "border border-foreground/30 bg-card text-foreground shadow-xs font-black"
                    : "border border-transparent text-muted-foreground hover:bg-background/80 hover:text-foreground"
                )}
              >
                <Square className="h-3 w-3 opacity-60 shrink-0" />
                <span className="min-w-0 truncate">None</span>
              </button>
            </div>
          </div>

          {/* Error Recovery Panel */}
          <AnimatePresence>
            {failedSelections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="rounded-none border-destructive/30 bg-destructive/5">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <CardTitle className="text-xs font-black tracking-wider uppercase">
                          Sync Errors ({failedSelections.length})
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 gap-1.5 rounded-none text-xs font-black tracking-wider uppercase"
                          onClick={() => {
                            selectFailedOnly()
                            handleSync()
                          }}
                          disabled={isSyncing}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Retry Failed
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 rounded-none text-muted-foreground"
                          onClick={() => setShowErrorPanel(!showErrorPanel)}
                        >
                          {showErrorPanel ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {showErrorPanel && (
                    <CardContent className="space-y-2 p-4 pt-2">
                      <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                        {failedSelections.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between border border-destructive/10 bg-background/50 p-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold text-foreground">
                                {item.selection.title}
                              </p>
                              <p className="truncate text-xs text-destructive">
                                {item.selection.error || "Unknown error"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 gap-1 rounded-none px-2 text-xs font-bold text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                handleRetrySingle(
                                  item.entryIndex,
                                  item.selectionIndex
                                )
                              }
                              disabled={isSyncing}
                            >
                              <RotateCcw className="h-2.5 w-2.5" />
                              Reset
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Virtualized Sync List */}
          <Card className="rounded-none border-primary/20 bg-card/20">
            <CardContent className="p-0 sm:p-0">
              <div className="h-125 overflow-hidden rounded-none border-t border-primary/10 bg-black/20 sm:h-150">
                <List
                  listRef={listRef}
                  style={{ height: "100%", width: "100%" }}
                  rowCount={flattenedItems.length}
                  rowHeight={getRowHeight}
                  rowProps={rowProps}
                  rowComponent={SyncRowComponent}
                  className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Actions, Throttle, and Telemetry */}
        <div className="order-1 space-y-4 lg:order-2 sm:space-y-6">
          {/* Primary Action Card */}
          <Card className="rounded-none border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5">
            <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
              <div className="space-y-1">
                <h3 className="text-sm font-black tracking-widest text-primary uppercase">
                  Ready to Sync
                </h3>
                <p className="text-xs text-muted-foreground uppercase">
                  Push your reviewed ratings directly to AniList.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="group h-12 w-full gap-2 rounded-none bg-primary text-xs font-black tracking-widest uppercase shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] sm:text-sm"
                  onClick={handleSync}
                  disabled={
                    isSyncing ||
                    selectedCount === 0 ||
                    hasMissingScores
                  }
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                  {isSyncing
                    ? "Syncing..."
                    : selectedCount > 0
                      ? `Sync ${selectedCount} Selected`
                      : "Select Items to Sync"}
                </Button>
                {isSyncing && (
                  <Button
                    variant="destructive"
                    className="h-11 w-full gap-2 rounded-none text-xs font-bold uppercase transition-all"
                    onClick={() => {
                      isCancelled.current = true
                      abortRef.current?.abort()
                      toast.info("Sync halted.")
                    }}
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                    Stop Synchronization
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sync Speed Control */}
          <Card className="rounded-none border-primary/10 bg-card/40">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
                <Gauge className="h-3.5 w-3.5 text-primary" />
                Sync Throttle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-1">
              <div className="grid grid-cols-3 gap-1.5">
                {(["fast", "normal", "safe"] as SyncSpeed[]).map((speed) => {
                  const config = speedConfig[speed]
                  return (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => setSyncSpeed(speed)}
                      disabled={isSyncing}
                      className={cn(
                        "flex flex-col items-center justify-center border py-2 text-xs font-black uppercase transition-all",
                        syncSpeed === speed
                          ? "border-primary bg-primary/15 text-primary shadow-sm"
                          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        isSyncing && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {speed === "fast" && <Zap className="h-3 w-3" />}
                        {config.label}
                      </span>
                      <span className="text-xs font-medium opacity-75">
                        {(config.delay / 1000).toFixed(1)}s
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {speedConfig[syncSpeed].description}
              </p>
            </CardContent>
          </Card>

          {/* XML Export Backup */}
          <Card className="rounded-none border-primary/10 bg-muted/20 opacity-90 transition-opacity hover:opacity-100">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <MyAnimeListLogo className="h-4 w-4 text-primary" />
                <div className="space-y-0.5">
                  <p className="text-xs font-black tracking-wider text-muted-foreground uppercase">
                    XML Export Alternative
                  </p>
                  <p className="text-xs text-muted-foreground/70 uppercase">
                    Skip rate limits by importing manually.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full gap-2 rounded-none border-primary/10 bg-background text-xs font-black tracking-wider uppercase hover:border-primary hover:text-primary"
                onClick={handleDownloadXml}
                disabled={isSyncing}
              >
                <Download className="h-3.5 w-3.5" />
                Get MAL XML
              </Button>
            </CardContent>
          </Card>

          {/* Missing scores warning */}
          {hasMissingScores && (
            <div className="flex animate-in flex-col gap-3 rounded-none bg-destructive/10 p-4 text-destructive slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-xs font-black tracking-wider uppercase">
                  Missing scores detected
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 w-full rounded-none text-xs font-black uppercase"
                onClick={() => navigate("/review?filter=missing")}
              >
                Go Fix Scores
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Diff Dry Run Dialog */}
      <DiffPreviewDialog
        open={showDiffModal}
        onOpenChange={setShowDiffModal}
        diff={diffSummary}
        isLoading={isDiffLoading}
        scoreFormat={scoreFormat}
        onSkipUnchanged={handleSkipUnchanged}
        onRefresh={() => void refreshDiff()}
      />

      {/* Sync History Drawer */}
      <SyncHistoryDrawer
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        onResumeErrors={() => {
          selectFailedOnly()
          toast.info("Failed items queued. Press Sync to start.")
        }}
      />

      {/* XML Complete Alert Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent className="max-w-md rounded-none border-primary/20 bg-background p-4 sm:p-8">
          <AlertDialogHeader className="pb-4">
            <AlertDialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight uppercase sm:text-2xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              XML Ready
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-muted-foreground/70 uppercase">
              Your MAL-compatible XML has been downloaded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <p className="text-xs leading-relaxed font-medium text-foreground/80">
              You can now import this file directly into AniList to update your
              entire collection instantly, bypassing all rate limits.
            </p>
          </div>
          <AlertDialogFooter className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <AlertDialogCancel className="mt-0 h-11 rounded-none border-primary/10 bg-transparent text-xs font-black tracking-wider text-muted-foreground uppercase transition-colors hover:bg-white/5 hover:text-foreground sm:h-10 sm:px-6">
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 w-full gap-2 rounded-none bg-primary text-xs font-black tracking-wider uppercase shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] sm:h-10 sm:w-auto sm:px-8"
              asChild
            >
              <a
                href="https://anilist.co/settings/import"
                target="_blank"
                rel="noopener noreferrer"
              >
                AniList Import Page
                <ExternalLink className="h-4 w-4" />
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Sync
