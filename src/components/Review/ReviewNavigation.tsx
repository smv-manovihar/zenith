import React from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ReviewNavigationProps {
  currentIndex: number
  entriesCount: number
  currentEntrySelectionsCount: number
  onNext: () => void
  onPrev: () => void
}

export const ReviewNavigation: React.FC<ReviewNavigationProps> = ({
  currentIndex,
  entriesCount,
  currentEntrySelectionsCount,
  onNext,
  onPrev,
}) => {
  return (
    <div className="fixed right-4 bottom-6 left-4 z-50 flex animate-in items-center justify-between gap-2 rounded-none border border-primary/20 bg-card/60 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-all duration-500 fade-in slide-in-from-bottom-8 sm:right-auto sm:bottom-8 sm:left-1/2 sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:gap-6 sm:rounded-none sm:p-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="h-10 rounded-none px-4 text-[10px] font-black tracking-widest uppercase hover:bg-muted sm:h-11 sm:px-6 sm:text-xs"
          >
            <ChevronLeft className="mr-1 h-4 w-4 sm:mr-2" />
            <span className="xs:inline hidden">Back</span>
            <span className="xs:hidden">Prev</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Go to previous entry</TooltipContent>
      </Tooltip>

      <div className="flex flex-col items-center">
        <p className="text-[8px] font-black tracking-[0.4em] text-muted-foreground uppercase opacity-40 sm:text-[10px]">
          #{currentIndex + 1}
        </p>
        <div className="mt-1 flex gap-1 sm:gap-1.5">
          {Array.from({ length: Math.min(entriesCount, 5) }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                (entriesCount > 5
                  ? i + Math.max(0, currentIndex - 2)
                  : i) === currentIndex
                  ? "w-3 bg-primary sm:w-4"
                  : "w-1 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="lg"
            onClick={onNext}
            className="h-10 rounded-none bg-primary px-4 text-[10px] font-black tracking-widest uppercase shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 sm:h-11 sm:px-10 sm:text-xs"
          >
            <span className="xs:inline hidden">
              {currentEntrySelectionsCount === 0
                ? "Skip"
                : currentIndex === entriesCount - 1
                  ? "Finalize"
                  : "Next"}
            </span>
            <span className="xs:hidden">
              {currentIndex === entriesCount - 1 ? "End" : "Next"}
            </span>
            <ChevronRight className="ml-1 h-4 w-4 sm:ml-2" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {currentIndex === entriesCount - 1
            ? "Commit selections and sync"
            : "Proceed to next entry"}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
