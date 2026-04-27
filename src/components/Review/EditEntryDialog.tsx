import { useState, useEffect, type FC } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Play,
  Clock,
  Pause,
  XCircle,
  RefreshCcw,
  CheckCircle2,
  Loader2,
  Star,
  Hash,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { NumberInput } from "@/components/NumberInput"
import { cn } from "@/lib/utils"
import { type AniListScoreFormat, getScoreConfig } from "@/lib/scoreFormat"
import { getScoreStyles } from "@/lib/utils"

export const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  CURRENT: { label: "Watching", icon: Play, color: "text-blue-500" },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-500",
  },
  PLANNING: { label: "Planning", icon: Clock, color: "text-amber-500" },
  PAUSED: { label: "Paused", icon: Pause, color: "text-orange-500" },
  DROPPED: { label: "Dropped", icon: XCircle, color: "text-rose-500" },
  REPEATING: { label: "Repeating", icon: RefreshCcw, color: "text-indigo-500" },
}

interface EditEntryDialogProps {
  isOpen: boolean
  media: any
  initialScore?: number
  initialStatus?: string
  initialProgress?: number
  listEntryId?: number | null
  scoreFormat: AniListScoreFormat
  onSave: (updates: {
    score: number
    status: string
    progress: number
  }) => Promise<void>
  onClose: () => void
}

export const EditEntryDialog: FC<EditEntryDialogProps> = ({
  isOpen,
  media,
  initialScore = 0,
  initialStatus = "PLANNING",
  initialProgress = 0,
  scoreFormat,
  onSave,
  onClose,
}) => {
  const config = getScoreConfig(scoreFormat)
  const [score, setScore] = useState(initialScore)
  const [status, setStatus] = useState(initialStatus)
  const [progress, setProgress] = useState(initialProgress)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setScore(initialScore)
      setStatus(initialStatus)
      setProgress(initialProgress)
    }
  }, [isOpen, initialScore, initialStatus, initialProgress])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ score, status, progress })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!media) return null

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      {/* Changed to `w-[calc(100%-1.5rem)]` to perfectly respect mobile boundaries. 
        Removed `overflow-hidden` from the outer container and moved scrolling inside 
        so the Radix dialog sizing behaves predictably.
      */}
      <DialogContent className="flex w-[96vw] flex-col overflow-hidden border-primary/10 p-0 sm:max-w-lg md:max-w-2xl">
        <div className="flex h-full max-h-[85vh] w-full flex-col overflow-x-hidden overflow-y-auto">
          {/* Banner */}
          <div className="relative h-20 w-full shrink-0 overflow-hidden bg-muted sm:h-32">
            {media.bannerImage ? (
              <img
                src={media.bannerImage}
                className="h-full w-full object-cover opacity-60 transition-opacity duration-500"
                alt=""
              />
            ) : (
              <div className="h-full w-full bg-linear-to-br from-primary/20 to-background" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-background to-transparent" />
          </div>

          <div className="relative px-4 pb-5 sm:px-5">
            {/* Cover Image Overlay */}
            <div className="absolute -top-10 left-4 sm:-top-12 sm:left-5">
              <div className="h-20 w-14 overflow-hidden rounded-none border-2 border-background bg-muted shadow-xl sm:h-32 sm:w-22">
                <img
                  src={media.coverImage?.large || media.coverImage?.medium}
                  className="h-full w-full object-cover"
                  alt=""
                />
              </div>
            </div>

            {/* Title Block - Added aggressive word breaking */}
            <div className="mb-5 pr-1 pl-20 sm:mb-6 sm:pr-2 sm:pl-28">
              <DialogTitle className="line-clamp-2 text-sm font-black tracking-tight wrap-break-word uppercase sm:text-base">
                {media.title?.english ?? media.title?.romaji}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Edit entry for {media.title?.english ?? media.title?.romaji}
              </DialogDescription>
              {media.title?.romaji &&
                media.title?.english &&
                media.title?.romaji !== media.title?.english && (
                  <p className="mt-0.5 line-clamp-1 text-[9px] font-bold wrap-break-word text-muted-foreground/60 sm:text-[10px]">
                    {media.title.romaji}
                  </p>
                )}
            </div>

            <div className="w-full space-y-5 pt-1 sm:space-y-6 md:pt-5">
              {/* Status Selection */}
              <div className="w-full space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-70">
                  Update Status
                </label>
                <div className="grid w-full grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    const isActive = status === key
                    return (
                      <button
                        key={key}
                        onClick={() => setStatus(key)}
                        className={cn(
                          "group flex min-w-0 items-center gap-1.5 border px-2 py-2 transition-all duration-300 sm:gap-2 sm:px-3 sm:py-2.5",
                          isActive
                            ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5"
                            : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30 hover:bg-muted/40"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110",
                            isActive ? cfg.color : "opacity-40"
                          )}
                        />
                        <span className="truncate text-[9px] font-black tracking-wider uppercase sm:text-[10px] sm:tracking-widest">
                          {cfg.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid w-full gap-5 sm:grid-cols-2 sm:gap-6">
                {/* Score */}
                <div className="w-full space-y-2">
                  <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-70">
                    Your Score
                  </label>
                  <div
                    className={cn(
                      "flex h-10 w-full items-center justify-between gap-1.5 rounded-none border px-2 transition-all sm:px-3",
                      getScoreStyles(score, scoreFormat).border,
                      getScoreStyles(score, scoreFormat).bg
                    )}
                  >
                    <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
                      <Star
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 fill-current transition-colors",
                          getScoreStyles(score, scoreFormat).color
                        )}
                      />
                      <span
                        className={cn(
                          "truncate text-[9px] font-black tracking-wider uppercase sm:text-[10px] sm:tracking-widest",
                          getScoreStyles(score, scoreFormat).color
                        )}
                      >
                        Score
                      </span>
                    </div>
                    {/* Fixed constraint here: removed restrictive width to allow buttons to show */}
                    <div className="flex shrink-0 items-center gap-1 text-right">
                      <NumberInput
                        value={score}
                        onChange={setScore}
                        scoreFormat={scoreFormat}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        className={cn(
                          "text-right",
                          getScoreStyles(score, scoreFormat).color
                        )}
                      />
                      <span
                        className={cn(
                          "shrink-0 text-[9px] font-black opacity-40 sm:text-[10px]",
                          getScoreStyles(score, scoreFormat).color
                        )}
                      >
                        {getScoreConfig(scoreFormat).suffix}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="w-full space-y-2">
                  {(() => {
                    const isCompleted = progress === (media.episodes ?? -1)
                    const progressColor = isCompleted
                      ? "text-emerald-500"
                      : progress > 0
                        ? "text-blue-500"
                        : "text-muted-foreground"
                    const progressBorder = isCompleted
                      ? "border-emerald-500/20"
                      : progress > 0
                        ? "border-blue-500/20"
                        : "border-border"
                    const progressBg = isCompleted
                      ? "bg-emerald-500/5"
                      : progress > 0
                        ? "bg-blue-500/5"
                        : "bg-muted/20"

                    return (
                      <>
                        <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-70">
                          Episodes
                        </label>
                        <div
                          className={cn(
                            "flex h-10 w-full items-center justify-between gap-1.5 rounded-none border px-2 transition-all sm:px-3",
                            progressBorder,
                            progressBg
                          )}
                        >
                          <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
                            <Hash
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 opacity-50 transition-colors",
                                progressColor
                              )}
                            />
                            <span
                              className={cn(
                                "truncate text-[9px] font-black tracking-wider uppercase sm:text-[10px] sm:tracking-widest",
                                progressColor
                              )}
                            >
                              Progress
                            </span>
                          </div>
                          {/* Fixed constraint here: removed restrictive width */}
                          <div className="flex shrink-0 items-center gap-1 text-right">
                            <NumberInput
                              value={progress}
                              onChange={setProgress}
                              min={0}
                              max={media.episodes ?? 9999}
                              step={1}
                              className={cn(
                                progressColor
                              )}
                            />
                            {media.episodes && (
                              <span
                                className={cn(
                                  "shrink-0 text-[9px] font-black opacity-40 sm:text-[10px]",
                                  progressColor
                                )}
                              >
                                /{media.episodes}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>

            <div className="mt-6 flex w-full gap-2 sm:mt-8 sm:gap-3">
              <Button
                variant="outline"
                size="lg"
                className="h-11 flex-1 rounded-none border-border/50 text-[9px] font-black tracking-wider uppercase transition-all hover:bg-muted sm:text-[10px] sm:tracking-widest"
                onClick={onClose}
              >
                Discard
              </Button>
              <Button
                size="lg"
                className="h-11 flex-2 rounded-none bg-primary text-[9px] font-black tracking-wider uppercase shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] sm:text-[10px] sm:tracking-widest"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-1 h-4 w-4 shrink-0 animate-spin sm:mr-2" />
                ) : (
                  <CheckCircle2 className="mr-1 h-4 w-4 shrink-0 sm:mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
