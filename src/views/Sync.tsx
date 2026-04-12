import { useState, useMemo, type FC, useRef } from "react"
import { motion } from "framer-motion"
import {
  useProgress,
  type AnimeEntry,
  type Selection,
} from "@/components/ProgressProvider"
import { queryAniList, SAVE_MEDIA_LIST_ENTRY, rateLimiter } from "@/lib/anilist"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RefreshCcw,
  ExternalLink,
  Star,
  Info,
  Pause,
  Clock,
  XCircle,
  Hash,
  Square,
  ArrowLeft,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { List, type RowComponentProps } from "react-window"
import { cn } from "@/lib/utils"

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
}

const SyncRowComponent = ({
  index,
  style,
  items,
  isSyncing,
}: RowComponentProps<SyncRowProps>) => {
  const item = items[index]
  if (!item) return null

  if (item.type === "header") {
    return (
      <div style={style} className="px-1 sm:px-2">
        <div className="flex min-h-[32px] items-center justify-between border-b border-primary/10 bg-muted/20 px-2 py-1 sm:px-3">
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

  const { selection } = item
  const showProgress = ["CURRENT", "REPEATING", "PAUSED", "DROPPED"].includes(
    selection.anilistStatus
  )

  return (
    <div style={style} className="px-1 sm:px-2">
      <div
        className={cn(
          "group flex h-[60px] items-center justify-between border-b border-primary/5 bg-card/40 p-2 transition-all duration-300 last:border-0 hover:bg-card/60 sm:h-[72px] sm:gap-4 sm:p-2.5",
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
                Score {selection.rating}
              </div>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end sm:ml-4">
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
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-7 w-7 items-center justify-center rounded-none bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="rounded-none border-destructive/20 bg-destructive/10 text-[10px] font-black tracking-widest text-destructive uppercase">
                {selection.error}
              </TooltipContent>
            </Tooltip>
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
  const { entries, updateEntry, updateSelection, token } = useProgress()
  const [isSyncing, setIsSyncing] = useState(false)
  const [apiBudget, setApiBudget] = useState<{
    remaining: number
    limit: number
  } | null>(null)
  const navigate = useNavigate()
  const listRef = useRef<any>(null)
  const isCancelled = useRef(false)

  const totalToSync = entries.reduce((acc, e) => acc + e.selections.length, 0)
  const totalCompleted = entries.reduce(
    (acc, e) =>
      acc + e.selections.filter((s) => s.status === "completed").length,
    0
  )
  const syncProgress =
    totalToSync > 0 ? Math.round((totalCompleted / totalToSync) * 100) : 0

  const abortRef = useRef<AbortController | null>(null)

  const handleSync = async () => {
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
      selection: any
    }[] = []

    entries.forEach((entry, entryIndex) => {
      entry.selections.forEach((selection, selectionIndex) => {
        // Retry pending OR previously errored items
        if (selection.status !== "completed") {
          tasks.push({ entryIndex, selectionIndex, selection })
        }
      })
    })

    if (tasks.length === 0) {
      setIsSyncing(false)
      toast.info("No items left to sync.")
      return
    }

    const runWorker = async () => {
      while (tasks.length > 0 && !isCancelled.current) {
        const task = tasks.shift()
        if (!task) break

        const { entryIndex, selectionIndex, selection } = task

        // Auto-scroll logic
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
            3, // 3 retries for transient errors
            controller.signal
          )

          updateSelection(entryIndex, selectionIndex, {
            status: "completed",
            error: undefined,
          })

          if (result.headers) {
            setApiBudget({
              remaining: parseInt(result.headers["x-ratelimit-remaining"] || "0"),
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

        // Safe stagger for 30 req/min degraded API limit.
        // 30/min = 0.5/sec. Spacing by 2100ms keeps us safely under the threshold.
        const remaining = rateLimiter.remaining
        let stagger = 2100 

        if (remaining <= 10) stagger = 4000 // Slow down when getting close
        if (remaining <= 3) stagger = 8000  // Extreme slowdown to prevent 429 errors

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

    // Run a single worker to strictly control sequential rate limiting
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

    setIsSyncing(false)
    if (!isCancelled.current) {
      toast.success("Sync process finished!")
    }
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
    }),
    [flattenedItems, isSyncing]
  )

  const selectionsCount = entries.reduce(
    (acc, e) => acc + e.selections.length,
    0
  )
  const selectionsCompleted = entries.reduce(
    (acc, e) =>
      acc + e.selections.filter((s) => s.status === "completed").length,
    0
  )
  const hasMissingScores = entries.some(
    (e) => e.selections.length > 0 && e.selections.some((s) => s.rating === 0)
  )
  const errorCount = entries.reduce(
    (acc, e) => acc + e.selections.filter((s) => s.status === "error").length,
    0
  )

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-1 pb-24 sm:px-4">
      <div className="max-w-lg space-y-3 text-left">
        <h2 className="bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-black tracking-tighter text-transparent uppercase sm:text-4xl">
          Commit to AniList
        </h2>
        <p className="max-w-md text-xs font-bold text-muted-foreground/60 sm:text-sm">
          Push your reviewed selections and ratings directly to your AniList
          account with premium precision and focus.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="order-2 overflow-hidden rounded-none border-primary/10 bg-card/30 shadow-2xl backdrop-blur-xl md:order-1 md:col-span-2">
          <CardHeader className="p-3 pb-0! sm:p-5">
            <CardTitle className="flex items-center justify-between">
              <span className="text-xs font-black tracking-widest text-muted-foreground uppercase sm:text-sm">
                Sync Progress
              </span>
              <Badge
                variant="secondary"
                className="rounded-none border-primary/20 bg-primary/10 font-mono text-[9px] font-black sm:text-[10px]"
              >
                {syncProgress}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-3 sm:p-5">
            <div className="relative">
              <Progress value={syncProgress} className="h-3 overflow-hidden" />
              {isSyncing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    x: ["-100%", "100%"],
                  }}
                  className="absolute inset-0 bg-linear-to-r from-transparent via-primary/20 to-transparent"
                  style={{ width: "100%" }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-primary" />
                <h4 className="text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase sm:text-[10px]">
                  Status List
                </h4>
              </div>
              <div className="h-[400px] overflow-hidden rounded-none border border-primary/10 bg-black/20 sm:h-[500px]">
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
            </div>
          </CardContent>
        </Card>

        <div className="order-1 space-y-6 md:order-2">
          <Card className="rounded-none border-primary/20 bg-primary/5 backdrop-blur-md">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex justify-between text-[10px] font-black tracking-widest uppercase sm:text-[11px]">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-emerald-500">{selectionsCompleted}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black tracking-widest uppercase sm:text-[11px]">
                <span className="text-muted-foreground">Errors</span>
                <span className="text-destructive">{errorCount}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black tracking-widest uppercase sm:text-[11px]">
                <span className="text-muted-foreground">Remaining</span>
                <span className="text-primary">
                  {selectionsCount - selectionsCompleted}
                </span>
              </div>

              {apiBudget !== null && (
                <div className="flex justify-between border-t border-primary/10 pt-4 text-[11px] sm:text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Info className="h-3 w-3" />
                    API Budget
                  </span>
                  <Badge
                    variant={apiBudget.remaining < 10 ? "destructive" : "secondary"}
                    className="font-mono text-[9px] font-bold sm:text-[10px]"
                  >
                    {apiBudget.remaining} / {apiBudget.limit}
                  </Badge>
                </div>
              )}

              {hasMissingScores && (
                <div className="flex animate-in flex-col gap-3 rounded-none bg-destructive/10 p-4 text-destructive slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p className="text-[10px] leading-tight font-black tracking-widest uppercase">
                      Missing scores detected
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 w-full rounded-none text-[10px] font-black tracking-tighter uppercase shadow-lg shadow-destructive/20"
                    onClick={() => navigate("/review?filter=missing")}
                  >
                    Review & Fix Missing Scores
                  </Button>
                </div>
              )}

              <Button
                className="group h-11 w-full gap-2 rounded-none text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] sm:text-base"
                onClick={handleSync}
                disabled={
                  isSyncing ||
                  selectionsCompleted === selectionsCount ||
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
                  className="h-11 w-full animate-in gap-2 rounded-none text-sm font-bold fade-in slide-in-from-bottom-2"
                  onClick={() => {
                    isCancelled.current = true
                    abortRef.current?.abort()
                    toast.info("Synchronization stopped.")
                  }}
                >
                  <Square className="h-4 w-4 fill-current" />
                  Stop Synchronization
                </Button>
              )}

              <Button
                variant="outline"
                className="h-10 w-full gap-2 text-xs sm:text-sm"
                onClick={() => navigate("/review")}
                disabled={isSyncing}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Review
              </Button>
            </CardContent>
          </Card>

          <Button
            variant="ghost"
            className="w-full gap-2 text-xs text-muted-foreground"
            asChild
          >
            <a
              href="https://anilist.co/home"
              target="_blank"
              rel="noopener noreferrer"
            >
              View My AniList Profile
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Sync
