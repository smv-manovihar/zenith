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
import { getScoreStyles, sanitizeHtml, cn } from "@/lib/utils"
import {
  ChevronDown,
  ChevronUp,
  Play,
  Calendar,
  Clock,
  Users,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MediaDetailsDialogProps {
  media: any | null
  onClose: () => void
}

function formatDate(d?: { year?: number; month?: number; day?: number }) {
  if (!d?.year) return null
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
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

const MyAnimeListLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M8.273 7.247v8.423l-2.103-.003v-5.216l-2.03 2.404l-1.989-2.458l-.02 5.285H.001L0 7.247h2.203l1.865 2.545l2.015-2.546l2.19.001zm8.628 2.069l.025 6.335h-2.365l-.008-2.871h-2.8c.07.499.21 1.266.417 1.779c.155.381.298.751.583 1.128l-1.705 1.125c-.349-.636-.622-1.337-.878-2.082a9.296 9.296 0 0 1-.507-2.179c-.085-.75-.097-1.471.107-2.212a3.908 3.908 0 0 1 1.161-1.866c.313-.293.749-.5 1.1-.687c.351-.187.743-.264 1.107-.359a7.405 7.405 0 0 1 1.191-.183c.398-.034 1.107-.066 2.39-.028l.545 1.749H14.51c-.593.008-.878.001-1.341.209a2.236 2.236 0 0 0-1.278 1.92l2.663.033l.038-1.81h2.309zm3.992-2.099v6.627l3.107.032l-.43 1.775h-4.807V7.187l2.13.03z" />
  </svg>
)

const AniListLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M6.361 2.943 0 21.056h4.942l1.077-3.133H11.4l1.052 3.133H22.9c.71 0 1.1-.392 1.1-1.101V17.53c0-.71-.39-1.101-1.1-1.101h-6.483V4.045c0-.71-.392-1.102-1.101-1.102h-2.422c-.71 0-1.101.392-1.101 1.102v1.064l-.758-2.166zm2.324 5.948 1.688 5.018H7.144z" />
  </svg>
)

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
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden border-primary/10 p-0 shadow-2xl sm:max-w-2xl md:max-w-3xl">
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
                        Details for{" "}
                        {media.title?.english || media.title?.romaji}
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
                <TooltipProvider>
                  <div className="flex flex-wrap gap-2">
                    {media.siteUrl && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 sm:w-auto sm:gap-1.5 sm:px-3"
                            asChild
                          >
                            <a
                              href={media.siteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <AniListLogo className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline text-xs">AniList</span>
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="sm:hidden">AniList</TooltipContent>
                      </Tooltip>
                    )}
                    {media.idMal && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 sm:w-auto sm:gap-1.5 sm:px-3"
                            asChild
                          >
                            <a
                              href={`https://myanimelist.net/anime/${media.idMal}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MyAnimeListLogo className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline text-xs">MyAnimeList</span>
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="sm:hidden">MyAnimeList</TooltipContent>
                      </Tooltip>
                    )}
                    {getTrailerUrl(media.trailer) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 sm:w-auto sm:gap-1.5 sm:px-3"
                            asChild
                          >
                            <a
                              href={getTrailerUrl(media.trailer)!}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Play className="h-3 w-3" />
                              <span className="hidden sm:inline text-xs">Trailer</span>
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="sm:hidden">Watch Trailer</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>

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

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
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
                    <InfoCell
                      label="Aired"
                      value={formatDate(media.startDate)!}
                    />
                  )}
                  {media.endDate && formatDate(media.endDate) && (
                    <InfoCell
                      label="Ended"
                      value={formatDate(media.endDate)!}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-60">
                      Synopsis
                    </h4>
                    <button
                      className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-primary uppercase transition-colors hover:text-primary/70"
                      onClick={() => setShowMore((p) => !p)}
                    >
                      {showMore ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      {showMore ? "Less" : "More"}
                    </button>
                  </div>
                  <div
                    className={cn(
                      "text-sm leading-relaxed whitespace-pre-line text-muted-foreground/90 transition-all duration-500",
                      !showMore && "line-clamp-4"
                    )}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        media.description || "No description available."
                      ),
                    }}
                  />
                </div>

                {/* Relations */}
                {media.relations?.edges?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-60">
                      Relations
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {media.relations.edges
                        .filter(
                          (edge: any) =>
                            edge.node.type === "ANIME" ||
                            edge.relationType === "SOURCE"
                        )
                        .map((edge: any) => (
                          <RelationCard key={edge.node.id} edge={edge} />
                        ))}
                    </div>
                  </div>
                )}
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

function RelationCard({ edge }: { edge: any }) {
  const { node, relationType } = edge
  return (
    <div className="group relative flex flex-col gap-2 overflow-hidden border border-border/50 bg-muted/20 p-2 transition-all hover:border-primary/30 hover:bg-muted/40">
      <div className="aspect-2/3 w-full overflow-hidden bg-muted">
        <img
          src={node.coverImage.large}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          alt={node.title.romaji}
        />
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className="rounded-none bg-background/80 px-1.5 py-0 text-[8px] font-black uppercase backdrop-blur-xs"
          >
            {node.format}
          </Badge>
        </div>
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-[9px] font-black tracking-widest text-primary uppercase opacity-70">
          {relationType.replace(/_/g, " ")}
        </p>
        <p className="truncate text-[10px] font-bold leading-tight">
          {node.title.english || node.title.romaji}
        </p>
      </div>
      {node.siteUrl && (
        <a
          href={node.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10"
        />
      )}
    </div>
  )
}
