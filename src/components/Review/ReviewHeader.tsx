import { type FC } from "react"
import { AlertCircle } from "lucide-react"

interface ReviewHeaderProps {
  entriesCount: number
  resolvedCount: number
  entriesWithMissingScores: number
  isFilterActive?: boolean
  onToggleMissingFilter?: () => void
}

export const ReviewHeader: FC<ReviewHeaderProps> = ({
  entriesCount,
  resolvedCount,
  entriesWithMissingScores,
  isFilterActive,
  onToggleMissingFilter,
}) => {
  return (
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">
          Review Matches
        </h2>
        <p className="font-medium text-muted-foreground">
          Verify and match imported entries with AniList database records.
        </p>
      </div>
      <div className="flex w-full flex-col items-end gap-2 md:w-auto">
        {entriesWithMissingScores > 0 && (
          <button
            onClick={onToggleMissingFilter}
            className={`flex items-center gap-2 rounded-none px-3 py-1 transition-all hover:scale-105 active:scale-95 ${
              isFilterActive
                ? "bg-destructive text-white shadow-lg shadow-destructive/40"
                : "bg-destructive/10 text-destructive hover:bg-destructive/20"
            }`}
          >
            <AlertCircle
              className={`h-3 w-3 ${isFilterActive ? "animate-pulse" : ""}`}
            />
            <span className="text-[10px] font-black tracking-widest uppercase">
              {entriesWithMissingScores} Scores Missing
            </span>
          </button>
        )}
        <div className="flex w-full items-center gap-3 rounded-none border bg-card px-3 py-3 shadow-sm sm:w-auto sm:gap-4 sm:px-6">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase sm:text-xs">
            Progress
          </span>
          <div className="h-1.5 min-w-[60px] flex-1 overflow-hidden rounded-none bg-muted sm:w-32 sm:flex-initial md:w-48">
            <div
              className="h-full bg-primary transition-all duration-700"
              style={{
                width: `${(resolvedCount / entriesCount) * 100}%`,
              }}
            />
          </div>
          <span className="font-mono text-xs font-bold sm:text-sm">
            {resolvedCount}/{entriesCount}
          </span>
        </div>
      </div>
    </div>
  )
}
