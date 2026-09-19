import React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type AniListStatus } from "@/components/ProgressProvider"
import {
  Layers,
  ChevronDown,
  CheckCircle2,
  Play,
  Clock,
  Pause,
  XCircle,
  Plus,
  Minus,
} from "lucide-react"

interface BatchActionBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onBulkSetStatus: (status: AniListStatus) => void
  onBulkScoreOffset: (delta: number) => void
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkSetStatus,
  onBulkScoreOffset,
}) => {
  if (totalCount === 0) return null

  return (
    <div className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-2 border border-primary/20 bg-background/95 p-3 backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase text-primary">
          <Layers className="h-4 w-4" />
          <span>
            {selectedCount} / {totalCount} Selected
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-none px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
            onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
          >
            {selectedCount === totalCount ? "Deselect All" : "Select All"}
          </Button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 rounded-none text-xs font-bold uppercase"
              >
                Set Status
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-none border-border"
            >
              <DropdownMenuItem
                className="gap-2 text-xs font-bold uppercase"
                onClick={() => onBulkSetStatus("COMPLETED")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-xs font-bold uppercase"
                onClick={() => onBulkSetStatus("CURRENT")}
              >
                <Play className="h-3.5 w-3.5 fill-primary text-primary" />
                Watching
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-xs font-bold uppercase"
                onClick={() => onBulkSetStatus("PLANNING")}
              >
                <Clock className="h-3.5 w-3.5 text-sky-400" />
                Planning
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-xs font-bold uppercase"
                onClick={() => onBulkSetStatus("PAUSED")}
              >
                <Pause className="h-3.5 w-3.5 text-amber-500" />
                Paused
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-xs font-bold uppercase"
                onClick={() => onBulkSetStatus("DROPPED")}
              >
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                Dropped
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Score Offsets */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-none px-2 text-xs font-bold uppercase"
            onClick={() => onBulkScoreOffset(0.5)}
            title="Increase score of selected by +0.5"
          >
            <Plus className="h-3 w-3" />
            0.5
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 rounded-none px-2 text-xs font-bold uppercase"
            onClick={() => onBulkScoreOffset(-0.5)}
            title="Decrease score of selected by -0.5"
          >
            <Minus className="h-3 w-3" />
            0.5
          </Button>
        </div>
      )}
    </div>
  )
}
