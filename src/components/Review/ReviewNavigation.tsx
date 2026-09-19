import { type FC } from "react"
import { motion } from "framer-motion"
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

export const ReviewNavigation: FC<ReviewNavigationProps> = ({
  currentIndex,
  entriesCount,
  currentEntrySelectionsCount,
  onNext,
  onPrev,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 200,
        opacity: { duration: 0.8 },
      }}
      className="fixed bottom-3 right-3 left-3 z-50 flex items-center justify-between gap-1.5 rounded-none border border-primary/20 bg-card/60 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:right-4 sm:bottom-8 sm:left-4 sm:mx-auto sm:w-full sm:max-w-2xl sm:gap-6 sm:p-3"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="h-8 rounded-none px-2.5 text-[9px] font-black tracking-wider uppercase hover:bg-muted sm:h-11 sm:px-6 sm:text-xs sm:tracking-widest"
          >
            <ChevronLeft className="mr-0.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="xs:inline hidden">Back</span>
            <span className="xs:hidden">Prev</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Go to previous entry</TooltipContent>
      </Tooltip>

      <div className="flex flex-col items-center">
        <p className="text-[7px] font-black tracking-[0.25em] text-muted-foreground uppercase opacity-40 sm:text-[10px] sm:tracking-[0.4em]">
          #{currentIndex + 1}
        </p>
        <div className="mt-0.5 flex gap-1 sm:mt-1 sm:gap-1.5">
          {Array.from({ length: Math.min(entriesCount, 5) }).map((_, i) => (
            <div
              key={i}
              className={`h-0.5 rounded-full transition-all sm:h-1 ${
                (entriesCount > 5
                  ? i + Math.max(0, currentIndex - 2)
                  : i) === currentIndex
                  ? "w-2.5 bg-primary sm:w-4"
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
            className="h-8 rounded-none bg-primary px-3 text-[9px] font-black tracking-wider uppercase shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 sm:h-11 sm:px-10 sm:text-xs sm:tracking-widest"
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
            <ChevronRight className="ml-0.5 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {currentIndex === entriesCount - 1
            ? "Commit selections and sync"
            : "Proceed to next entry"}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  )
}
