import { useState, useMemo, useCallback, useEffect, type FC, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  useProgress,
  type AnimeEntry,
  type Selection,
} from "@/components/ProgressProvider"
import { queryAniList, SAVE_MEDIA_LIST_ENTRY, rateLimiter } from "@/lib/anilist"
import { Storage } from "@/lib/storage"
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
  ArrowLeft,
  Download,
  ExternalLink,
  Zap,
  Gauge,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  const safeLimit = Math.max(10, limit || 90)
  const baseInterval = 60000 / safeLimit // e.g. 667ms for 90/min, 2000ms for 30/min

  const fastDelay = Math.max(400, Math.round(baseInterval * 0.7))
  const normalDelay = Math.round(baseInterval * 1.05)
  const safeDelay = Math.max(1500, Math.round(baseInterval * 1.8))

  return {
    fast: {
      label: "Fast",
      delay: fastDelay,
      description: `${(fastDelay / 1000).toFixed(1)}s delay — Aggressive burst mode for ${safeLimit} req/min limit`,
    },
    normal: {
      label: "Normal",
      delay: normalDelay,
      description: `${(normalDelay / 1000).toFixed(1)}s delay — Balanced sustainable pacing for ${safeLimit} req/min limit`,
    },
    safe: {
      label: "Safe",
      delay: safeDelay,
      description: `${(safeDelay / 1000).toFixed(1)}s delay — Extra conservative pacing for ${safeLimit} req/min limit`,
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
  onRetrySingle?: (entryIndex: number, selectionIndex: number) => void
}

const SyncRowComponent = ({
  index,
  style,
  items,
  isSyncing,
  scoreFormat,
  onRetrySingle,
}: RowComponentProps<SyncRowProps>) => {
  const item = items[index]
  if (!item) return null

  if (item.type === "header") {
    return (
      <div style={style} className="px-1 sm:px-2">
        <div className="flex min-h-8 items-center justify-between border-b border-primary/10 bg-muted/20 px-2 py-1 sm:px-3">
          <span className="truncate text-[9px] font-black tracking-[0.15em] text-muted-foreground uppercase sm:text-[10px]">
            {item.entry.name}
          </span>
          <Badge
            variant="outline"
            className="shrink-0 rounded-none border-primary/20 bg-primary/5 px-1.5 text-[7px] font-black tracking-widest text-primary uppercase sm:text-[8px]"
          >
            {item.entry.selections.length} Items
          </Badge>
        </div>
      </div>
    )
  }

  const { selection, entryIndex, selectionIndex } = item
  const showProgress = ["CURRENT", "REPEATING", "PAUSED", "DROPPED"].includes(
    selection.anilistStatus
  )

  return (
    <div style={style} className="px-1 sm:px-2">
      <div
        className={cn(
          "group flex h-15 items-center justify-between border-b border-primary/5 bg-card/40 p-2 transition-all duration-300 last:border-0 hover:bg-card/60 sm:h-18 sm:gap-4 sm:p-2.5",
          isSyncing &&
            selection.status === "pending" &&
            "opacity-40 grayscale-[0.5]"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-none bg-muted shadow-2xl ring-1 ring-primary/20 sm:h-12 sm:w-10">
            {selection.image && (
              <img
                src={selection.image}
                className="h-full w-full object-cover grayscale-25 transition-all duration-500 group-hover:grayscale-0"
                alt=""
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/60 backdrop-blur-sm" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-[11px] font-black tracking-tight text-foreground uppercase sm:text-xs">
              {selection.title}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-primary uppercase opacity-80 sm:text-[10px]">
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
                {selection.anilistStatus === "CURRENT"
                  ? "Watching"
                  : selection.anilistStatus === "PLANNING"
                    ? "Planned"
                    : selection.anilistStatus}
              </div>

              {showProgress && (
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase sm:text-[10px]">
                  <Hash className="h-2.5 w-2.5 opacity-50" />
                  EP {selection.progress}{" "}
                  {selection.totalEpisodes && `/ ${selection.totalEpisodes}`}
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[9px] font-bold text-primary sm:text-[10px]">
                <Star className="h-2.5 w-2.5 fill-primary opacity-60" />
                {formatScoreDisplay(selection.rating, scoreFormat)}
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:ml-4">
          {selection.status === "completed" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex h-7 w-7 items-center justify-center rounded-none bg-emerald-500/10"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </motion.div>
          )}
          {selection.status === "syncing" && (
            <div className="flex h-7 w-7 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
          {selection.status === "error" && (
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-7 w-7 items-center justify-center rounded-none bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-none border-destructive/20 bg-destructive/10 text-[10px] font-black tracking-widest text-destructive uppercase">
                  {selection.error || "Sync failed"}
                </TooltipContent>
              </Tooltip>
              {onRetrySingle && !isSyncing && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-none border border-destructive/20 hover:bg-destructive/10"
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
                "h-7 w-7 rounded-none border-2 transition-colors",
                isSyncing ? "border-primary/5" : "border-primary/20"
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
  const [syncSpeed, setSyncSpeed] = useState<SyncSpeed>("normal")
  const [showErrorPanel, setShowErrorPanel] = useState(true)
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
  const pendingCount = totalToSync - totalCompleted - totalErrors

  const syncProgress =
    totalToSync > 0 ? Math.round((totalCompleted / totalToSync) * 100) : 0

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
    if (!isSyncing || pendingCount <= 0) return null
    const msPerItem = speedConfig[syncSpeed].delay
    const totalSecs = Math.ceil((pendingCount * msPerItem) / 1000)
    if (totalSecs < 60) return `${totalSecs}s`
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}m ${secs > 0 ? `${secs}s` : ""}`
  }, [isSyncing, pendingCount, syncSpeed, speedConfig])

  const handleRetrySingle = useCallback((entryIndex: number, selectionIndex: number) => {
    updateSelection(entryIndex, selectionIndex, {
      status: "pending",
      error: undefined,
    })
    toast.info("Item reset to pending. Press Sync to commit.")
  }, [updateSelection])

  const handleSync = async (onlyFailed = false) => {
    if (!token || isSyncing) {
      if (!token) toast.error("You must be logged in to sync.")
      return
    }

    setIsSyncing(true)
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
        if (onlyFailed) {
          if (selection.status === "error") {
            tasks.push({ entryIndex, selectionIndex, selection })
          }
        } else if (selection.status !== "completed") {
          tasks.push({ entryIndex, selectionIndex, selection })
        }
      })
    })

    if (tasks.length === 0) {
      setIsSyncing(false)
      toast.info(onlyFailed ? "No failed items to retry." : "No items left to sync.")
      return
    }

    let successCount = 0
    let errorCount = 0

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
            error: err.message || "Failed to update",
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

    // Record sync history in storage
    Storage.setSyncHistory({
      timestamp: Date.now(),
      successCount,
      errorCount,
      totalCount: tasks.length,
    })

    setIsSyncing(false)
    if (!isCancelled.current) {
      if (errorCount > 0) {
        toast.warning(`Sync finished: ${successCount} synced, ${errorCount} failed.`)
      } else {
        toast.success(`All ${successCount} entries synced successfully!`)
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
    return 72
  }

  const rowProps = useMemo(
    () => ({
      items: flattenedItems,
      isSyncing,
      scoreFormat,
      onRetrySingle: handleRetrySingle,
    }),
    [flattenedItems, isSyncing, scoreFormat, handleRetrySingle]
  )

  if (entries.length === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center space-y-4 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="font-heading text-xl font-medium tracking-tight">
          No entries to commit.
        </p>
        <p className="text-xs text-muted-foreground">
          Your import list is empty. Import anime or an export file before committing changes.
        </p>
        <Button onClick={() => navigate("/import")} className="rounded-none">
          Go to Import
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl animate-in space-y-8 px-1 pb-24 duration-700 fade-in slide-in-from-bottom-4 sm:px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight uppercase sm:text-2xl md:text-3xl">
            Commit to AniList
          </h2>
          <p className="mt-1 max-w-lg text-xs font-medium text-muted-foreground sm:text-sm">
            Push your reviewed selections and ratings directly to your AniList
            account.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-10 w-full gap-2 rounded-none border-border/50 text-[10px] font-black tracking-widest text-muted-foreground uppercase hover:text-foreground sm:w-auto"
          onClick={() => navigate("/review")}
          disabled={isSyncing}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to Review
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Sync List (Primary) */}
        <div className="order-2 space-y-6 lg:order-1 lg:col-span-2">
          {/* Progress Overview Card */}
          <Card className="rounded-none border-primary/20 bg-card/40 backdrop-blur-md">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
                    Overall Progress
                  </CardTitle>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-black text-foreground">
                      {syncProgress}%
                    </p>
                    {estimatedTime && (
                      <span className="text-[10px] font-bold text-primary/80 uppercase">
                        ETA: ~{estimatedTime}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black tracking-widest text-primary uppercase">
                    {totalCompleted} / {totalToSync}
                  </p>
                  {totalErrors > 0 && (
                    <p className="text-[9px] font-black tracking-wider text-destructive uppercase">
                      {totalErrors} Failed
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
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
            </CardContent>
          </Card>

          {/* Error Recovery Panel (Feature 5) */}
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
                        <CardTitle className="text-xs font-black tracking-widest uppercase">
                          Sync Errors ({failedSelections.length})
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 gap-1.5 rounded-none text-[10px] font-black tracking-widest uppercase"
                          onClick={() => handleSync(true)}
                          disabled={isSyncing}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Retry All Failed
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
                              <p className="truncate text-[10px] text-destructive">
                                {item.selection.error || "Unknown error"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 gap-1 rounded-none px-2 text-[10px] font-bold text-destructive hover:bg-destructive/10"
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

        {/* Right Column: Actions, Speed Control, and Settings */}
        <div className="order-1 space-y-6 lg:order-2">
          {/* Primary Action Card */}
          <Card className="rounded-none border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5">
            <CardContent className="flex flex-col gap-4 p-4 sm:p-6">
              <div className="space-y-1">
                <h3 className="text-sm font-black tracking-widest text-primary uppercase">
                  Ready to Sync
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase">
                  Push your reviewed ratings directly to AniList.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  className="group h-12 w-full gap-2 rounded-none bg-primary text-sm font-black tracking-widest uppercase shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                  onClick={() => handleSync(false)}
                  disabled={
                    isSyncing ||
                    totalCompleted === totalToSync ||
                    hasMissingScores
                  }
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                  {isSyncing ? "Syncing..." : "Sync to AniList"}
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

          {/* Sync Speed Control (Feature 4) */}
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
                        "flex flex-col items-center justify-center border py-2 text-[10px] font-black uppercase transition-all",
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
                      <span className="text-[8px] font-medium opacity-70">
                        {(config.delay / 1000).toFixed(1)}s
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-[9px] text-muted-foreground">
                {speedConfig[syncSpeed].description}
              </p>
            </CardContent>
          </Card>

          {/* XML Export Alternative (Secondary) */}
          <Card className="rounded-none border-primary/10 bg-muted/20 opacity-90 transition-opacity hover:opacity-100">
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <MyAnimeListLogo className="h-4 w-4 text-primary" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                    XML Export Alternative
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 uppercase">
                    Skip rate limits by importing manually.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full gap-2 rounded-none border-primary/10 bg-background text-[10px] font-black tracking-widest uppercase hover:border-primary hover:text-primary"
                onClick={handleDownloadXml}
                disabled={isSyncing}
              >
                <Download className="h-3 w-3" />
                Get MAL XML
              </Button>
            </CardContent>
          </Card>

          {/* Sidebar: Budget, Warnings, and Navigation */}
          <div className="space-y-6">
            <Card className="rounded-none border-primary/10 bg-primary/5">
              <CardContent className="space-y-1.5 p-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-black tracking-widest text-muted-foreground uppercase">
                    <Info className="h-3 w-3" />
                    API Budget
                  </span>
                  <Badge
                    variant={
                      apiBudget.remaining <= Math.max(3, apiBudget.limit * 0.15)
                        ? "destructive"
                        : "secondary"
                    }
                    className="rounded-none font-mono text-[10px] font-black"
                  >
                    {apiBudget.remaining} / {apiBudget.limit} req/min
                  </Badge>
                </div>
                {apiBudget.limit <= 30 && (
                  <p className="text-[8px] font-bold text-amber-500/90 uppercase">
                    AniList Degraded Limit Active ({apiBudget.limit}/min)
                  </p>
                )}
              </CardContent>
            </Card>

            {hasMissingScores && (
              <div className="flex animate-in flex-col gap-3 rounded-none bg-destructive/10 p-4 text-destructive slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-[9px] font-black tracking-widest uppercase">
                    Missing scores detected
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 w-full rounded-none text-[10px] font-black tracking-tighter uppercase"
                  onClick={() => navigate("/review?filter=missing")}
                >
                  Go Fix Scores
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent className="max-w-md rounded-none border-primary/20 bg-background sm:p-8">
          <AlertDialogHeader className="pb-4">
            <AlertDialogTitle className="flex items-center gap-2 text-2xl font-black tracking-tight uppercase">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              XML Ready
            </AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-muted-foreground/60 uppercase">
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
            <AlertDialogCancel className="mt-0 h-11 rounded-none border-primary/10 bg-transparent text-[10px] font-black tracking-widest text-muted-foreground uppercase transition-colors hover:bg-white/5 hover:text-foreground sm:h-10 sm:px-6">
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 w-full gap-2 rounded-none bg-primary text-[11px] font-black tracking-widest uppercase shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] sm:h-10 sm:w-auto sm:px-8"
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
