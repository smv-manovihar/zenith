import React, { useState, useMemo, memo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  type DiffSummary,
  type DiffCategory,
  type AnimeDiffItem,
} from "@/lib/diffUtils"
import { type AniListScoreFormat, formatScoreDisplay } from "@/lib/scoreFormat"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  Filter,
} from "lucide-react"

interface DiffPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  diff: DiffSummary | null
  isLoading: boolean
  scoreFormat: AniListScoreFormat
  onSkipUnchanged?: () => void
  onRefresh?: () => void
}

export const DiffPreviewDialog: React.FC<DiffPreviewDialogProps> = memo(
  ({
    open,
    onOpenChange,
    diff,
    isLoading,
    scoreFormat,
    onSkipUnchanged,
    onRefresh,
  }) => {
    const [filter, setFilter] = useState<DiffCategory | "all">("all")

    const filteredItems = useMemo(() => {
      if (!diff) return []
      if (filter === "all") return diff.items
      return diff.items.filter((item) => item.category === filter)
    }, [diff, filter])

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92dvh] w-[calc(100%-1rem)] flex-col gap-3 overflow-hidden rounded-none border-primary/20 bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:max-h-[85dvh] sm:w-full sm:max-w-2xl sm:p-6 sm:pb-6 max-sm:top-auto max-sm:bottom-2 max-sm:translate-y-0">
          <DialogHeader className="shrink-0 space-y-1 border-b border-border pb-2.5 pr-8 text-left sm:pb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-black tracking-tight uppercase sm:text-xl">
              <Sparkles className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
              Sync Preview & Diff
            </DialogTitle>
            <DialogDescription className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
              Compare your queued changes against your current AniList library before committing.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              <p className="text-xs font-bold text-muted-foreground uppercase">
                Fetching current AniList library...
              </p>
            </div>
          ) : !diff || diff.totalCount === 0 ? (
            <div className="flex flex-1 items-center justify-center py-8 text-center text-xs font-bold text-muted-foreground uppercase">
              No entries to compare.
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 flex-col gap-3 pt-3 overflow-hidden">
              {/* Summary Cards (tap to filter) */}
              <div className="grid shrink-0 grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  aria-pressed={filter === "new"}
                  onClick={() => setFilter(filter === "new" ? "all" : "new")}
                  className={cn(
                    "flex min-h-[60px] min-w-0 flex-col items-center justify-center border px-1 py-2 text-center transition-all sm:min-h-0 sm:p-2.5",
                    filter === "new"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/40"
                      : "border-border bg-card/40 text-muted-foreground hover:border-emerald-500/40"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1 text-[10px] font-black uppercase sm:text-xs">
                    <PlusCircle className="h-3 w-3 shrink-0 text-emerald-500 sm:h-3.5 sm:w-3.5" />
                    <span className="truncate">New</span>
                  </div>
                  <span className="text-base font-black text-foreground">
                    {diff.newCount}
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={filter === "updated"}
                  onClick={() =>
                    setFilter(filter === "updated" ? "all" : "updated")
                  }
                  className={cn(
                    "flex min-h-[60px] min-w-0 flex-col items-center justify-center border px-1 py-2 text-center transition-all sm:min-h-0 sm:p-2.5",
                    filter === "updated"
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/40"
                      : "border-border bg-card/40 text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1 text-[10px] font-black uppercase sm:text-xs">
                    <RefreshCw className="h-3 w-3 shrink-0 text-primary sm:h-3.5 sm:w-3.5" />
                    <span className="truncate">Updates</span>
                  </div>
                  <span className="text-base font-black text-foreground">
                    {diff.updatedCount}
                  </span>
                </button>

                <button
                  type="button"
                  aria-pressed={filter === "unchanged"}
                  onClick={() =>
                    setFilter(filter === "unchanged" ? "all" : "unchanged")
                  }
                  className={cn(
                    "flex min-h-[60px] min-w-0 flex-col items-center justify-center border px-1 py-2 text-center transition-all sm:min-h-0 sm:p-2.5",
                    filter === "unchanged"
                      ? "border-border bg-muted text-foreground ring-1 ring-foreground/40"
                      : "border-border bg-card/40 text-muted-foreground hover:border-foreground/40"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1 text-[10px] font-black uppercase sm:text-xs">
                    <CheckCircle2 className="h-3 w-3 shrink-0 opacity-60 sm:h-3.5 sm:w-3.5" />
                    <span className="truncate">Same</span>
                  </div>
                  <span className="text-base font-black text-foreground">
                    {diff.unchangedCount}
                  </span>
                </button>
              </div>

              {filter !== "all" && (
                <p className="shrink-0 text-[11px] font-bold text-muted-foreground uppercase">
                  Showing {filteredItems.length} of {diff.totalCount} · tap the
                  active card to clear
                </p>
              )}

              {/* Scrollable Item List */}
              <div className="scrollbar-thin min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pb-1 pr-0.5 sm:space-y-2 sm:pr-1">
                {filteredItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No items in this category.
                  </div>
                ) : (
                  filteredItems.map((item, idx) => (
                    <DiffRow key={`${item.id}-${idx}`} item={item} scoreFormat={scoreFormat} />
                  ))
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex shrink-0 flex-col gap-1.5 border-t border-border pt-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:pt-3">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                  {diff.unchangedCount > 0 && onSkipUnchanged && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-full gap-1.5 rounded-none text-[11px] font-bold uppercase sm:h-9 sm:w-auto sm:text-xs"
                          onClick={() => {
                            onSkipUnchanged()
                            onOpenChange(false)
                          }}
                        >
                          <Filter className="h-3.5 w-3.5" />
                          Select Changes Only ({diff.newCount + diff.updatedCount})
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-none text-[11px] font-bold uppercase">
                        Select only new and updated entries for sync
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {onRefresh && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-full gap-1.5 rounded-none border-border/60 bg-background/60 text-foreground hover:border-primary/40 hover:text-primary sm:h-9 sm:w-auto sm:text-xs"
                          onClick={onRefresh}
                          disabled={isLoading}
                          aria-label="Refresh AniList comparison"
                        >
                          <RefreshCw
                            className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
                          />
                          Refresh
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-none text-[11px] font-bold uppercase">
                        Re-fetch the AniList comparison
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <Button
                  size="sm"
                  className="h-10 w-full rounded-none text-[11px] font-bold uppercase sm:h-9 sm:w-auto sm:text-xs"
                  onClick={() => onOpenChange(false)}
                >
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }
)

DiffPreviewDialog.displayName = "DiffPreviewDialog"

const DiffRow = memo(function DiffRow({
  item,
  scoreFormat,
}: {
  item: AnimeDiffItem
  scoreFormat: AniListScoreFormat
}) {
  return (
    <div className="flex items-center justify-between gap-2 border border-border/60 bg-card/40 p-2 transition-colors hover:bg-card/70 sm:gap-2.5 sm:p-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
        {item.image && (
          <img
            src={item.image}
            alt=""
            className="h-10 w-8 shrink-0 rounded-none bg-muted object-cover"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[11px] font-black text-foreground uppercase sm:text-xs">
            {item.title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] sm:mt-1 sm:gap-1.5 sm:text-xs">
            {item.category === "new" && (
              <Badge
                variant="outline"
                className="rounded-none border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-left text-[10px] leading-tight font-bold text-emerald-500 uppercase sm:text-xs"
              >
                New Entry · Score {formatScoreDisplay(item.localRating, scoreFormat)}
              </Badge>
            )}
            {item.category === "updated" && (
              <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold text-primary sm:text-xs">
                <span className="opacity-70">
                  {item.remoteRating !== undefined
                    ? formatScoreDisplay(item.remoteRating, scoreFormat)
                    : "No score"}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span>{formatScoreDisplay(item.localRating, scoreFormat)}</span>
              </div>
            )}
            {item.category === "unchanged" && (
              <span className="text-[11px] leading-snug text-muted-foreground/70 sm:text-xs">
                Score {formatScoreDisplay(item.localRating, scoreFormat)} (Matches AniList)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
