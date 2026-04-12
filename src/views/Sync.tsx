import { useState, useMemo, type FC } from "react"
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
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NumberInput } from "@/components/NumberInput"
import { List, type RowComponentProps } from "react-window"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type AniListStatus } from "@/components/ProgressProvider"

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
  updateEntry: (index: number, updates: Partial<AnimeEntry>) => void
}

const SyncRowComponent = ({
  index,
  style,
  items,
  updateEntry,
}: RowComponentProps<SyncRowProps>) => {
  const item = items[index]
  if (!item) return null

  if (item.type === "header") {
    return (
      <div style={style} className="px-1 sm:px-2">
        <div className="flex h-[40px] items-center justify-between border-b bg-muted/30 px-2 sm:px-3">
          <span className="truncate text-[10px] font-black tracking-widest text-muted-foreground uppercase sm:text-xs">
            {item.entry.name}
          </span>
          <Badge
            variant="outline"
            className="shrink-0 text-[8px] sm:text-[10px]"
          >
            {item.entry.selections.length} Items
          </Badge>
        </div>
      </div>
    )
  }

  const { selection, entryIndex, selectionIndex, entry } = item
  const showProgress = ["CURRENT", "REPEATING", "PAUSED", "DROPPED"].includes(
    selection.anilistStatus
  )

  const handleStatusChange = (val: AniListStatus) => {
    const newSelections = entry.selections.map((s, i) => {
      if (i !== selectionIndex) return s
      const updates: Partial<Selection> = { anilistStatus: val }
      if (val === "COMPLETED" && selection.totalEpisodes) {
        updates.progress = selection.totalEpisodes
      }
      return { ...s, ...updates }
    })
    updateEntry(entryIndex, { selections: newSelections })
  }

  const handleProgressChange = (val: number) => {
    const newSelections = entry.selections.map((s, i) =>
      i === selectionIndex ? { ...s, progress: val } : s
    )
    updateEntry(entryIndex, { selections: newSelections })
  }

  const handleRatingChange = (val: number) => {
    const newSelections = entry.selections.map((s, i) =>
      i === selectionIndex ? { ...s, rating: val } : s
    )
    updateEntry(entryIndex, { selections: newSelections })
  }

  return (
    <div style={style} className="px-1 sm:px-2">
      <div className="flex h-[72px] items-center justify-between border-b bg-card/50 p-2 pl-4 last:border-0 sm:p-3 sm:pl-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="h-10 w-8 shrink-0 overflow-hidden rounded-none bg-muted sm:h-12 sm:w-10">
            {selection.image && (
              <img
                src={selection.image}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <span className="truncate text-[10px] font-bold sm:text-xs">
              {selection.title}
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Status Select */}
              <Select
                value={selection.anilistStatus}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="h-6 w-fit border-none bg-primary/10 px-1.5 py-0 text-[9px] font-black text-primary shadow-none hover:bg-primary/20 sm:h-7 sm:px-2 sm:text-[10px]">
                  <div className="flex items-center gap-1">
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
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Watching</SelectItem>
                  <SelectItem value="PLANNING">Plan to Watch</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REPEATING">Rewatching</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="DROPPED">Dropped</SelectItem>
                </SelectContent>
              </Select>

              {/* Progress Input */}
              {showProgress && (
                <div className="flex items-center gap-1 rounded-none bg-muted/50 px-1.5 py-0 text-[9px] font-bold text-muted-foreground sm:px-2 sm:text-[10px]">
                  <Hash className="h-2.5 w-2.5 opacity-50 sm:h-3 sm:w-3" />
                  <span className="xs:inline hidden uppercase">Ep</span>
                  <NumberInput
                    value={selection.progress}
                    onChange={handleProgressChange}
                  />
                  {selection.totalEpisodes && (
                    <span className="opacity-40">
                      / {selection.totalEpisodes}
                    </span>
                  )}
                </div>
              )}

              {/* Score Input */}
              <div className="flex items-center gap-1 rounded-none bg-primary/10 px-1.5 py-0 text-[9px] font-bold text-primary sm:px-2 sm:text-[10px]">
                <Star className="h-2.5 w-2.5 fill-primary text-primary sm:h-3 sm:w-3" />
                <span className="xs:inline hidden uppercase">Score</span>
                <NumberInput
                  value={selection.rating}
                  onChange={handleRatingChange}
                />
                <span className="opacity-60">/10</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ml-2 shrink-0">
          {selection.status === "completed" && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 sm:h-5 sm:w-5" />
          )}
          {selection.status === "syncing" && (
            <Loader2 className="h-4 w-4 animate-spin text-primary sm:h-5 sm:w-5" />
          )}
          {selection.status === "error" && (
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
              </TooltipTrigger>
              <TooltipContent>{selection.error}</TooltipContent>
            </Tooltip>
          )}
          {selection.status === "pending" && (
            <div className="h-4 w-4 rounded-full border-2 border-primary/20 sm:h-5 sm:w-5" />
          )}
        </div>
      </div>
    </div>
  )
}

const Sync: FC = () => {
  const { entries, updateEntry, updateSelection, token } = useProgress()
  const [isSyncing, setIsSyncing] = useState(false)
  const [remainingRequests, setRemainingRequests] = useState<number | null>(
    null
  )
  const navigate = useNavigate()

  const totalToSync = entries.reduce((acc, e) => acc + e.selections.length, 0)
  const totalCompleted = entries.reduce(
    (acc, e) =>
      acc + e.selections.filter((s) => s.status === "completed").length,
    0
  )
  const syncProgress =
    totalToSync > 0 ? Math.round((totalCompleted / totalToSync) * 100) : 0

  const handleSync = async () => {
    if (!token || isSyncing) {
      if (!token) toast.error("You must be logged in to sync.")
      return
    }

    setIsSyncing(true)

    const tasks: {
      entryIndex: number
      selectionIndex: number
      selection: any
    }[] = []
    entries.forEach((entry, entryIndex) => {
      entry.selections.forEach((selection, selectionIndex) => {
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
      while (tasks.length > 0) {
        const task = tasks.shift()
        if (!task) break

        const { entryIndex, selectionIndex, selection } = task

        updateSelection(entryIndex, selectionIndex, { status: "syncing" })
        updateEntry(entryIndex, { status: "syncing" })

        try {
          const result = await queryAniList(
            SAVE_MEDIA_LIST_ENTRY,
            {
              mediaId: selection.id,
              status: selection.anilistStatus,
              score: selection.rating,
              progress: selection.progress,
            },
            token
          )

          updateSelection(entryIndex, selectionIndex, { status: "completed" })

          if (result.headers["x-ratelimit-remaining"]) {
            setRemainingRequests(
              parseInt(result.headers["x-ratelimit-remaining"])
            )
          }
        } catch (err: any) {
          console.error(err)
          updateSelection(entryIndex, selectionIndex, {
            status: "error",
            error: err.message || "Failed to update",
          })
          toast.error(`Failed to update ${selection.title}`)
        }

        const remaining = rateLimiter.remaining
        let stagger = 200

        if (remaining <= 15) stagger = 2000
        if (remaining <= 5) stagger = rateLimiter.waitTime || 5000

        await new Promise((r) => setTimeout(r, stagger))
      }
    }

    const workerCount = Math.min(5, tasks.length)
    const workers = Array(workerCount)
      .fill(null)
      .map(() => runWorker())

    await Promise.all(workers)

    entries.forEach((entry, idx) => {
      const allDone = entry.selections.every((s) => s.status === "completed")
      if (allDone && entry.status !== "completed") {
        updateEntry(idx, { status: "completed" })
      }
    })

    setIsSyncing(false)
    toast.success("Sync process finished!")
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

  const rowHeight = (index: number) => {
    return flattenedItems[index].type === "header" ? 40 : 72
  }

  const rowProps = useMemo(
    () => ({
      items: flattenedItems,
      updateEntry,
    }),
    [flattenedItems, updateEntry]
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
    <div className="mx-auto w-full max-w-4xl animate-in space-y-8 px-2 pb-24 duration-500 zoom-in-95 fade-in sm:px-4">
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h2 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">
          Commit to AniList
        </h2>
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">
          Push your reviewed selections and ratings directly to your AniList
          account.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="order-2 rounded-none border-primary/10 shadow-xl md:order-1 md:col-span-2">
          <CardHeader className="p-3 pb-0! sm:p-5">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm sm:text-base">Sync Progress</span>
              <Badge
                variant="secondary"
                className="font-mono text-[9px] sm:text-[10px]"
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

            <div className="space-y-2">
              <h4 className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase sm:text-[10px]">
                Status List
              </h4>
              <div className="h-[400px] overflow-hidden rounded-none border bg-muted/20">
                <List
                  style={{ height: 400, width: "100%" }}
                  rowCount={flattenedItems.length}
                  rowHeight={rowHeight}
                  rowProps={rowProps}
                  rowComponent={SyncRowComponent}
                  className="scrollbar-thin scrollbar-thumb-primary/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="order-1 space-y-6 md:order-2">
          <Card className="rounded-none border-primary/20 bg-primary/5">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex justify-between text-[11px] sm:text-xs">
                <span className="text-muted-foreground">
                  Successfully updated
                </span>
                <span className="font-bold text-emerald-500">
                  {selectionsCompleted}
                </span>
              </div>
              <div className="flex justify-between text-[11px] sm:text-xs">
                <span className="text-muted-foreground">Errors</span>
                <span className="font-bold text-destructive">{errorCount}</span>
              </div>
              <div className="flex justify-between text-[11px] sm:text-xs">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-bold">
                  {selectionsCount - selectionsCompleted}
                </span>
              </div>

              {remainingRequests !== null && (
                <div className="flex justify-between border-t border-primary/10 pt-4 text-[11px] sm:text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Info className="h-3 w-3" />
                    API Budget
                  </span>
                  <Badge
                    variant={
                      remainingRequests < 10 ? "destructive" : "secondary"
                    }
                    className="font-mono text-[9px] font-bold sm:text-[10px]"
                  >
                    {remainingRequests} / 30
                  </Badge>
                </div>
              )}

              {hasMissingScores && (
                <div className="flex animate-in items-center gap-2 rounded-none bg-destructive/10 p-3 text-destructive slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-[9px] leading-tight font-bold uppercase">
                    Missing scores detected. Please return to review.
                  </p>
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

              <Button
                variant="outline"
                className="h-10 w-full gap-2 text-xs sm:text-sm"
                onClick={() => navigate("/review")}
                disabled={isSyncing}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
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
