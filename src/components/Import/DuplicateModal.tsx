import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowUpCircle, Copy, SkipForward } from "lucide-react"

export type DuplicateResolution = "highest" | "overwrite" | "skip"

export interface DuplicateItem {
  title: string
  existingRating: number
  newRating: number
}

interface DuplicateModalProps {
  open: boolean
  duplicates: DuplicateItem[]
  onResolve: (resolution: DuplicateResolution) => void
  onCancel: () => void
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({
  open,
  duplicates,
  onResolve,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
      <DialogContent className="max-w-lg rounded-none border-primary/20 bg-background p-4 sm:p-6">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <DialogTitle className="text-lg font-black tracking-tight uppercase sm:text-xl">
              Duplicates Detected ({duplicates.length})
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Some anime in your import already exist in your review queue. How would you like to handle them?
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin max-h-52 space-y-2 overflow-y-auto pr-1">
          {duplicates.map((dup, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border border-border/60 bg-card/40 p-2.5 text-xs"
            >
              <span className="truncate font-bold uppercase text-foreground pr-2">
                {dup.title}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="rounded-none text-xs">
                  Queue: {dup.existingRating}
                </Badge>
                <Badge variant="secondary" className="rounded-none text-xs font-bold text-primary">
                  New: {dup.newRating}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-3 border-t border-border">
          <Button
            variant="outline"
            className="h-10 gap-1.5 rounded-none text-xs font-bold uppercase hover:border-primary hover:text-primary"
            onClick={() => onResolve("highest")}
          >
            <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />
            Keep Highest
          </Button>
          <Button
            variant="outline"
            className="h-10 gap-1.5 rounded-none text-xs font-bold uppercase hover:border-primary hover:text-primary"
            onClick={() => onResolve("overwrite")}
          >
            <Copy className="h-3.5 w-3.5 text-primary" />
            Overwrite
          </Button>
          <Button
            variant="secondary"
            className="h-10 gap-1.5 rounded-none text-xs font-bold uppercase"
            onClick={() => onResolve("skip")}
          >
            <SkipForward className="h-3.5 w-3.5 opacity-70" />
            Skip New
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
