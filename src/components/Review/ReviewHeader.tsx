import React from "react"
import { AlertCircle } from "lucide-react"

interface ReviewHeaderProps {
  entriesCount: number
  resolvedCount: number
  entriesWithMissingScores: number
}

export const ReviewHeader: React.FC<ReviewHeaderProps> = ({
  entriesCount,
  resolvedCount,
  entriesWithMissingScores,
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
          <div className="flex items-center gap-2 rounded-none bg-destructive/10 px-3 py-1 text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span className="text-[10px] font-black tracking-widest uppercase">
              {entriesWithMissingScores} Scores Missing
            </span>
          </div>
        )}
        <div className="flex w-full items-center gap-3 rounded-none border bg-card px-3 py-3 shadow-sm sm:w-auto sm:gap-4 sm:px-6">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase sm:text-xs">
            Progress
          </span>
          <div className="h-1.5 flex-1 min-w-[60px] overflow-hidden rounded-none bg-muted sm:w-32 md:w-48 sm:flex-initial">
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
