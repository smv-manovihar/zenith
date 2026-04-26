import { useState, type FC } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getScoreStyles, sanitizeHtml } from "@/lib/utils"
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Calendar,
  Clock,
  Users,
} from "lucide-react"

interface MediaDetailsDialogProps {
  media: any | null
  onClose: () => void
}

function formatDate(d?: { year?: number; month?: number; day?: number }) {
  if (!d?.year) return null
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ]
  const parts = [d.day, d.month ? months[d.month - 1] : null, d.year].filter(
    Boolean
  )
  return parts.join(" ")
}

function getTrailerUrl(trailer?: { id?: string; site?: string }) {
  if (!trailer?.id || !trailer?.site) return null
  if (trailer.site === "youtube") return `https://youtu.be/${trailer.id}`
  if (trailer.site === "dailymotion")
    return `https://www.dailymotion.com/video/${trailer.id}`
  return null
}

export const MediaDetailsDialog: FC<MediaDetailsDialogProps> = ({
  media,
  onClose,
}) => {
  const [showMore, setShowMore] = useState(false)

  return (
    <Dialog
      open={!!media}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setShowMore(false)
        }
      }}
    >
      <DialogContent
        className="flex max-h-[85vh] flex-col overflow-hidden border-primary/10 p-0 shadow-2xl sm:max-w-2xl md:max-w-3xl"
      >
        {media && (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Banner */}
              {media.bannerImage && (
                <div className="relative h-36 w-full shrink-0 overflow-hidden sm:h-44">
                  <img
                    src={media.bannerImage}
                    className="h-full w-full object-cover"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-background to-transparent opacity-70" />
                </div>
              )}

              <div className="space-y-5 p-5 sm:p-6">
                <DialogHeader>
                  <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                    {/* Cover */}
                    <img
                      src={media.coverImage?.large}
                      className={`relative h-40 w-28 shrink-0 rounded-lg object-cover shadow-xl ring-2 ring-background sm:h-48 sm:w-36 ${
                        media.bannerImage ? "sm:-mt-16" : ""
                      }`}
                      alt=""
                    />

                    <div className="flex-1 space-y-2.5 text-center sm:text-left">
                      <DialogTitle className="text-xl leading-tight font-black tracking-tight uppercase sm:text-2xl">
                        {media.title?.english || media.title?.romaji}
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        Details for {media.title?.english || media.title?.romaji}
                      </DialogDescription>
                      {media.title?.romaji &&
                        media.title?.english &&
                        media.title.romaji !== media.title.english && (
                          <p className="text-xs text-muted-foreground">
                            {media.title.romaji}
                          </p>
                        )}

                      {/* Primary badges */}
                      <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
                        {media.format && (
                          <Badge
                            variant="secondary"
                            className="rounded-none bg-primary/10 px-2 py-0.5 text-[10px] font-black tracking-widest text-primary uppercase"
                          >
                            {media.format}
                          </Badge>
                        )}
                        {media.averageScore > 0 && (
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1 rounded-none border-0 px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${getScoreStyles(media.averageScore).bg} ${getScoreStyles(media.averageScore).color}`}
                          >
                            {getScoreStyles(media.averageScore).icon}
                            {media.averageScore}%
                          </Badge>
                        )}
                        {media.status && (
                          <Badge
                            variant="secondary"
                            className="rounded-none px-2 py-0.5 text-[10px] font-black tracking-widest text-muted-foreground uppercase"
                          >
                            {media.status.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>

                      {/* Quick stats row — always visible */}
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:justify-start">
                        {(media.season || media.seasonYear) && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                            <Calendar className="h-3 w-3" />
                            {[media.season, media.seasonYear]
                              .filter(Boolean)
                              .join(" ")}
                          </span>
                        )}
                        {media.episodes && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                            <Play className="h-3 w-3" />
                            {media.episodes} eps
                          </span>
                        )}
                        {media.duration && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                            <Clock className="h-3 w-3" />
                            {media.duration} min
                          </span>
                        )}
                        {media.popularity > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                            <Users className="h-3 w-3" />
                            {media.popularity.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                {/* External Links */}
                <div className="flex flex-wrap gap-2">
                  {media.siteUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-none text-xs"
                      asChild
                    >
                      <a
                        href={media.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        AniList
                      </a>
                    </Button>
                  )}
                  {media.idMal && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-none text-xs"
                      asChild
                    >
                      <a
                        href={`https://myanimelist.net/anime/${media.idMal}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        MyAnimeList
                      </a>
                    </Button>
                  )}
                  {getTrailerUrl(media.trailer) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-none text-xs"
                      asChild
                    >
                      <a
                        href={getTrailerUrl(media.trailer)!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Play className="h-3 w-3" />
                        Trailer
                      </a>
                    </Button>
                  )}
                </div>

                {/* Genres */}
                {media.genres?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {media.genres.slice(0, 6).map((g: string) => (
                      <span
                        key={g}
                        className="rounded-none border border-primary/10 bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary/80"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-60">
                    Synopsis
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

                {/* More Info — collapsible on mobile, always shown on md+ */}
                <div>
                  <button
                    className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-muted-foreground uppercase transition-colors hover:text-primary md:hidden"
                    onClick={() => setShowMore((p) => !p)}
                  >
                    {showMore ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {showMore ? "Less info" : "More info"}
                  </button>

                  <div
                    className={`mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 ${
                      showMore ? "block" : "hidden md:grid"
                    }`}
                  >
                    {media.studios?.nodes?.find(
                      (n: any) => n.isAnimationStudio
                    ) && (
                      <InfoCell
                        label="Studio"
                        value={
                          media.studios.nodes.find(
                            (n: any) => n.isAnimationStudio
                          ).name
                        }
                      />
                    )}
                    {media.source && (
                      <InfoCell
                        label="Source"
                        value={media.source.replace(/_/g, " ")}
                      />
                    )}
                    {formatDate(media.startDate) && (
                      <InfoCell label="Aired" value={formatDate(media.startDate)!} />
                    )}
                    {formatDate(media.endDate) && (
                      <InfoCell label="Ended" value={formatDate(media.endDate)!} />
                    )}
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-black tracking-[0.15em] text-muted-foreground uppercase opacity-60">
        {label}
      </p>
      <p className="text-[11px] font-semibold text-foreground capitalize">
        {value}
      </p>
    </div>
  )
}
