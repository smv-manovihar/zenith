import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { getScoreStyles, sanitizeHtml } from "@/lib/utils"

interface MediaDetailsDialogProps {
  media: any | null
  onClose: () => void
}

export const MediaDetailsDialog: React.FC<MediaDetailsDialogProps> = ({
  media,
  onClose,
}) => {
  return (
    <Dialog
      open={!!media}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="flex max-h-[85vh] flex-col overflow-hidden border-primary/10 p-0 shadow-2xl transition-all duration-300 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
      >
        {media && (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Banner Section */}
              {media.bannerImage && (
                <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-48">
                  <img
                    src={media.bannerImage}
                    className="h-full w-full object-cover"
                    alt="banner"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-background to-transparent opacity-60" />
                </div>
              )}

              <div className="space-y-6 p-6 sm:p-8">
                <DialogHeader>
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    {/* Cover Image */}
                    <img
                      src={media.coverImage?.large}
                      className={`relative h-48 w-32 rounded-xl object-cover shadow-2xl ring-4 ring-background sm:h-56 sm:w-40 ${
                        media.bannerImage ? "sm:-mt-20" : ""
                      }`}
                      alt="cover"
                    />

                    <div className="flex-1 space-y-3 text-center sm:text-left">
                      <DialogTitle className="text-2xl leading-tight font-black tracking-tight uppercase sm:text-3xl">
                        {media.title.english ||
                          media.title.romaji}
                      </DialogTitle>

                      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                        <Badge
                          variant="secondary"
                          className="rounded-lg bg-primary/10 px-3 py-1 text-[10px] font-black tracking-widest text-primary uppercase"
                        >
                          {media.format}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-2 rounded-lg border-0 px-3 py-1 text-[10px] font-black tracking-widest uppercase ${getScoreStyles(media.averageScore).bg} ${getScoreStyles(media.averageScore).color}`}
                        >
                          {
                            getScoreStyles(media.averageScore)
                              .icon
                          }
                          {media.averageScore}% SCORE
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="rounded-lg px-3 py-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase"
                        >
                          {media.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-60">
                    Description
                  </h4>
                  <div
                    className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground/90"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        media.description || "No description available."
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
