import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const MediaCardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="glass-card relative flex flex-col gap-4 overflow-hidden rounded-none border border-white/5 p-3 sm:flex-row sm:gap-6 sm:p-5">
        {/* Cover Image Skeleton */}
        <Skeleton className="h-48 w-full shrink-0 rounded-none bg-muted/20 sm:h-44 sm:w-32" />

        {/* Content Skeleton */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4 bg-muted/20" />
                <Skeleton className="h-3.5 w-1/4 bg-muted/10" />
              </div>
              <Skeleton className="h-5 w-16 bg-muted/20" />
            </div>

            <div className="flex flex-wrap gap-1.5 md:gap-2">
              <Skeleton className="h-5 w-24 bg-muted/20" />
              <Skeleton className="h-5 w-20 bg-muted/20" />
              <Skeleton className="h-5 w-28 bg-muted/20" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-3 w-full bg-muted/10 opacity-70" />
              <Skeleton className="h-3 w-5/6 bg-muted/10 opacity-70" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {/* Main Button Skeleton */}
            <Skeleton className="h-11 w-full bg-muted/20" />

            {/* Bottom Actions Skeleton */}
            <div className="mt-1 flex items-center justify-end border-t border-dashed border-border/50 pt-3">
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 bg-muted/20" />
                <Skeleton className="h-9 w-9 bg-muted/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
