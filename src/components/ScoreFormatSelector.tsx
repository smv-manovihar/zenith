import { useCallback, useEffect, useState } from "react"
import { ChevronDown, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { useProgress } from "@/components/ProgressProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { queryAniList, UPDATE_USER_SETTINGS } from "@/lib/anilist"
import {
  type AniListScoreFormat,
  SCORE_FORMAT_OPTIONS,
} from "@/lib/scoreFormat"
import { cn } from "@/lib/utils"

/**
 * Shared score-format state, initialized from the user's AniList
 * preference and kept in sync if it loads after mount.
 */
export function useScoreFormat() {
  const { token, user, setUser } = useProgress()
  const serverValue =
    (user?.scoreFormat as AniListScoreFormat) ?? "POINT_10_DECIMAL"
  const [value, setValue] = useState<AniListScoreFormat>(serverValue)
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    if (user?.scoreFormat) {
      setValue(user.scoreFormat as AniListScoreFormat)
    }
  }, [user?.scoreFormat])

  const apply = useCallback(async () => {
    if (!token || !user || value === user.scoreFormat) return
    setIsApplying(true)
    try {
      await queryAniList(UPDATE_USER_SETTINGS, { scoreFormat: value }, token)
      toast.success(`Score format updated to ${value} on AniList`)
      setUser({
        ...user,
        scoreFormat: value,
        mediaListOptions: {
          ...user.mediaListOptions,
          scoreFormat: value,
        },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error("Failed to update AniList settings: " + message)
    } finally {
      setIsApplying(false)
    }
  }, [token, user, value, setUser])

  return { value, setValue, serverValue, isApplying, apply }
}

interface ScoreFormatSelectorProps {
  value: AniListScoreFormat
  onChange: (format: AniListScoreFormat) => void
  /** The user's current AniList setting. Shows the save affordance when different. */
  serverValue?: AniListScoreFormat | string | null
  onApply?: () => void
  isApplying?: boolean
  /** Dropdown alignment. Defaults to "end" (previous My List behavior). */
  align?: "start" | "end"
}

/**
 * Consistent score-format picker, restored from the pre-refactor styling:
 * primary-tinted trigger with a "Format:" prefix and short label, plus an
 * emerald square "apply" affordance when the local value diverges from
 * the AniList account setting. Full-width trigger on mobile, auto on sm+.
 */
export function ScoreFormatSelector({
  value,
  onChange,
  serverValue,
  onApply,
  isApplying = false,
  align = "end",
}: ScoreFormatSelectorProps) {
  const showApply = !!serverValue && !!onApply && serverValue !== value
  const fullLabel =
    SCORE_FORMAT_OPTIONS.find((o) => o.value === value)?.label ?? value
  const shortLabel = fullLabel.split(" (")[0]

  return (
    <div className="flex w-full flex-nowrap items-center gap-1.5 sm:w-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isApplying}>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 min-w-0 flex-1 justify-between gap-2 rounded-none border-primary/20 bg-primary/5 text-[10px] font-black tracking-widest text-primary uppercase transition-all hover:border-primary/40 hover:bg-primary/10 sm:w-auto sm:flex-none",
              isApplying && "cursor-not-allowed opacity-50"
            )}
          >
            <span className="text-[8px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
              Format:
            </span>
            {isApplying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <span className="truncate">{shortLabel}</span>
            )}
            <ChevronDown className="h-3 w-3 shrink-0 opacity-40" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          sideOffset={4}
          className="max-w-[calc(100vw-2rem)] rounded-none"
        >
          <div className="px-2 py-1.5 text-[9px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
            AniList Score Format
          </div>
          {SCORE_FORMAT_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "cursor-pointer text-[11px] font-bold",
                opt.value === value && "text-primary"
              )}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {showApply && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              className="h-8 w-8 shrink-0 animate-in rounded-none bg-emerald-500 p-0 text-white shadow-lg shadow-emerald-500/20 zoom-in-95 fade-in hover:bg-emerald-600 hover:text-white sm:h-7 sm:w-7"
              onClick={onApply}
              disabled={isApplying}
              aria-label="Save score format to AniList"
            >
              {isApplying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Save score format to AniList</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
