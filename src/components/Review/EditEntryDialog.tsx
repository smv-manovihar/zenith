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
import {
  type AniListScoreFormat,
  getScoreConfig,
} from "@/lib/scoreFormat"

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
  // If editing existing list entry
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

  // Reset state when media or initial values change
  useEffect(() => {
    if (isOpen) {
      setScore(initialScore)
      setStatus(initialStatus)
      setProgress(initialProgress)
    }
  }, [isOpen, initialScore, initialStatus, initialProgress])

  // We use a useEffect-like approach to reset state when media changes or dialog opens
  // But since we want to be surgical and keep it simple, we'll just use the initial props
  // and expect the parent to manage the 'key' or recreate the component if needed.
  // Actually, better to reset when initialScore/initialStatus/initialProgress changes.
  
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
      <DialogContent className="overflow-hidden border-primary/10 p-0 sm:max-w-md">
        {/* Banner */}
        <div className="relative h-24 w-full overflow-hidden bg-muted sm:h-32">
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

        <div className="relative px-5 pb-5">
          {/* Cover Image Overlay */}
          <div className="absolute -top-12 left-5">
            <div className="h-24 w-16 overflow-hidden rounded-none border-2 border-background bg-muted shadow-xl sm:h-32 sm:w-22">
              <img
                src={media.coverImage?.large || media.coverImage?.medium}
                className="h-full w-full object-cover"
                alt=""
              />
            </div>
          </div>

          {/* Title Block */}
          <div className="mb-6 pl-20 sm:pl-28">
            <DialogTitle className="line-clamp-2 text-sm font-black tracking-tight uppercase sm:text-base">
              {media.title?.english ?? media.title?.romaji}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit entry for{" "}
              {media.title?.english ?? media.title?.romaji}
            </DialogDescription>
            {media.title?.romaji &&
              media.title?.english &&
              media.title?.romaji !== media.title?.english && (
                <p className="mt-0.5 truncate text-[10px] font-bold text-muted-foreground/60">
                  {media.title.romaji}
                </p>
              )}
          </div>

          <div className="space-y-6 pt-1 md:pt-5">
            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-70">
                Update Status
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const Icon = cfg.icon
                  const isActive = status === key
                  return (
                    <button
                      key={key}
                      onClick={() => setStatus(key)}
                      className={cn(
                        "group flex items-center gap-2 border px-3 py-2.5 transition-all duration-300",
                        isActive
                          ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30 hover:bg-muted/40"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 transition-transform group-hover:scale-110",
                          isActive ? cfg.color : "opacity-40"
                        )}
                      />
                      <span className="text-[10px] font-black tracking-widest uppercase">
                        {cfg.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Score */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-70">
                  <Star className="h-3 w-3 fill-primary/50 text-primary/50" />
                  Your Score
                </label>
                <NumberInput
                  value={score}
                  onChange={setScore}
                  scoreFormat={scoreFormat}
                  min={config.min}
                  max={config.max}
                  step={config.step}
                />
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-70">
                  <Hash className="h-3 w-3 opacity-50" />
                  Episodes
                </label>
                <NumberInput
                  value={progress}
                  onChange={setProgress}
                  min={0}
                  max={media.episodes ?? 9999}
                  step={1}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-11 flex-1 rounded-none border-border/50 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-muted"
              onClick={onClose}
            >
              Discard
            </Button>
            <Button
              size="lg"
              className="h-11 flex-2 rounded-none bg-primary text-[10px] font-black tracking-widest uppercase shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
