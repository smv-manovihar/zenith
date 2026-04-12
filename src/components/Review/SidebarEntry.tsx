import { memo, type CSSProperties } from "react"
import { Star } from "lucide-react"
import { NumberInput } from "@/components/NumberInput"

interface SidebarEntryProps {
  entry: any
  idx: number
  isActive: boolean
  onClick: () => void
  onUpdateRating?: (index: number, val: number) => void
  style?: CSSProperties
}

export const SidebarEntry = memo<SidebarEntryProps>(
  ({ entry, idx, isActive, onClick, onUpdateRating, style }) => {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick()
          }
        }}
        style={style}
        className={`group flex w-full cursor-pointer items-center justify-between gap-4 rounded-none border p-4 text-left transition-all outline-none ${
          isActive
            ? "border-primary/50 bg-primary/10 shadow-inner"
            : "border-transparent hover:bg-white/5"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={`line-clamp-2 text-sm leading-tight font-black tracking-tight ${isActive ? "text-primary" : "text-foreground"}`}
          >
            {entry.name}
          </span>
          <div className="mt-2 flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-none px-2 py-1 text-[10px] font-bold transition-all ${
                entry.rating === 0
                  ? "animate-pulse bg-destructive/10 text-destructive ring-1 ring-destructive/40"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <Star
                className={`h-3 w-3 ${entry.rating === 0 ? "fill-destructive" : "fill-primary"}`}
              />
              <span>{entry.rating === 0 ? "MISSING SCORE" : "SCORE"}</span>
              <NumberInput
                value={entry.rating}
                onChange={(val) => onUpdateRating?.(idx, val)}
              />
              <span className="opacity-40">/10</span>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          {entry.selections?.length > 0 ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-none bg-primary text-[10px] font-black text-white">
              {entry.selections.length}
            </div>
          ) : (
            <div className="h-5 w-5 rounded-none border-2 border-white/10" />
          )}
        </div>
      </div>
    )
  }
)
