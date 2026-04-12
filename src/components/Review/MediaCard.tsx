import { memo } from "react"
import {
  Star,
  GitMerge,
  Info,
  CheckCircle2,
  Play,
  RefreshCcw,
  Pause,
  Clock,
  XCircle,
  Hash,
  Circle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NumberInput } from "@/components/NumberInput"
import { getScoreStyles, sanitizeHtml } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type AniListStatus } from "@/components/ProgressProvider"

interface MediaCardProps {
  media: any
  isSelected: boolean
  onSelect: (media: any) => void
  relationType?: string
  hasRelations?: boolean
  isExpanded?: boolean
  onToggleExpand?: (id: number) => void
  rating?: number
  onUpdateRating?: (id: number, rating: number) => void
  status?: AniListStatus
  onUpdateStatus?: (id: number, status: AniListStatus) => void
  progress?: number
  onUpdateProgress?: (id: number, progress: number) => void
  totalEpisodes?: number | null
  isMediaSelected: (id: number) => boolean
  handleToggleSelection: (media: any) => void
  getMediaRating: (id: number) => number
  updateSelectionRating: (id: number, rating: number) => void
  onViewDetails: (media: any) => void
}

export const MediaCard = memo<MediaCardProps>(
  ({
    media,
    isSelected,
    onSelect,
    relationType,
    hasRelations,
    isExpanded,
    onToggleExpand,
    rating,
    onUpdateRating,
    status,
    onUpdateStatus,
    progress,
    onUpdateProgress,
    totalEpisodes,
    isMediaSelected,
    handleToggleSelection,
    getMediaRating,
    updateSelectionRating,
    onViewDetails,
  }) => {
    const primaryTitle = media.title.english || media.title.romaji || "No Title"
    const secondaryTitle =
      media.title.english && media.title.romaji ? media.title.romaji : null

    // Determine if we need to show the episode progress input
    const showProgress = ["CURRENT", "REPEATING", "PAUSED", "DROPPED"].includes(
      status || ""
    )

    return (
      <div className="animate-in space-y-4 duration-300 fade-in slide-in-from-bottom-2">
        <div
          className={`glass-card relative flex flex-col gap-4 overflow-hidden rounded-none border p-4 transition-all sm:flex-row sm:gap-6 sm:p-5 ${
            isSelected
              ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(var(--primary),0.1)] ring-1 ring-primary/30"
              : "border-white/5 hover:border-primary/40 hover:bg-white/5"
          }`}
        >
          {/* Cover Image */}
          <div
            className="h-48 w-full shrink-0 cursor-pointer overflow-hidden rounded-none shadow-2xl ring-1 ring-white/10 sm:h-44 sm:w-32"
            onClick={() => onSelect(media)}
          >
            <img
              src={media.coverImage?.large}
              alt={primaryTitle}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>

          {/* Content Container */}
          <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {relationType && (
                    <Badge
                      variant="outline"
                      className="mb-1 border-primary/30 text-[9px] font-bold text-primary uppercase"
                    >
                      {relationType.replace(/_/g, " ")}
                    </Badge>
                  )}
                  <h4
                    className="line-clamp-2 cursor-pointer text-lg leading-tight font-black tracking-tight transition-colors hover:text-primary sm:text-xl"
                    onClick={() => onSelect(media)}
                  >
                    {primaryTitle}
                  </h4>
                  {secondaryTitle && (
                    <p className="mt-0.5 line-clamp-1 text-[9px] font-bold tracking-widest text-muted-foreground uppercase opacity-70">
                      {secondaryTitle}
                    </p>
                  )}
                </div>
                <Badge
                  variant={isSelected ? "default" : "secondary"}
                  className="shrink-0 px-2 py-0.5 text-[9px] font-black uppercase md:px-3 md:py-1 md:text-[10px]"
                >
                  {media.format}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 text-[9px] font-bold text-primary md:text-[10px]"
                >
                  {media.episodes || "?"} EPISODES
                </Badge>
                <Badge
                  variant="outline"
                  className="border-primary/20 text-[9px] font-bold text-primary uppercase md:text-[10px]"
                >
                  {media.status}
                </Badge>
                {media.averageScore && (
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1.5 border-0 px-2 py-0.5 text-[9px] font-black tracking-widest uppercase md:text-[10px] ${getScoreStyles(media.averageScore).bg} ${getScoreStyles(media.averageScore).color}`}
                  >
                    {getScoreStyles(media.averageScore).icon}
                    {media.averageScore}%{" "}
                    {getScoreStyles(media.averageScore).label}
                  </Badge>
                )}
              </div>
              <p
                className="line-clamp-2 text-xs leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(media.description || ""),
                }}
              />
            </div>

            {/* Actions & Controls Section */}
            <div className="mt-4 flex flex-col gap-3">
              {/* Primary Buttons Row */}
              <div className="flex w-full items-center gap-2 sm:gap-3">
                <Button
                  size="lg"
                  variant={isSelected ? "default" : "outline"}
                  className={`h-11 flex-1 font-black transition-all ${isSelected ? "shadow-xl shadow-primary/30" : "hover:bg-primary hover:text-primary-foreground"}`}
                  onClick={() => onSelect(media)}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Selected
                    </>
                  ) : (
                    <>
                      <Circle className="mr-2 h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
                      Select
                    </>
                  )}
                </Button>

                <div className="flex shrink-0 gap-2">
                  {hasRelations && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isExpanded ? "default" : "outline"}
                          size="icon"
                          className="h-11 w-11 shrink-0 rounded-none transition-all"
                          onClick={() => onToggleExpand?.(media.id)}
                        >
                          <GitMerge
                            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isExpanded
                          ? "Hide Related Shows"
                          : "Show Related Shows"}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 shrink-0 rounded-none"
                        onClick={() => onViewDetails(media)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Full Details</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Tracking Controls Box (Only visible when selected) */}
              {isSelected && onUpdateRating && (
                <div className="flex animate-in flex-col gap-2 rounded-none border border-primary/10 bg-primary/5 p-2 duration-300 fade-in slide-in-from-top-2 sm:grid sm:grid-cols-3 sm:items-center">
                  {/* Status Dropdown */}
                  <div className="min-w-0">
                    <Select
                      value={status}
                      onValueChange={(val: AniListStatus) =>
                        onUpdateStatus?.(media.id, val)
                      }
                    >
                      <SelectTrigger className="h-10 w-full border-primary/20 bg-background/50 px-3 font-semibold text-primary shadow-none hover:bg-background/80">
                        <div className="flex items-center gap-2">
                          {status === "CURRENT" && (
                            <Play className="h-3.5 w-3.5 fill-primary" />
                          )}
                          {status === "PLANNING" && (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          {status === "COMPLETED" && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          {status === "REPEATING" && (
                            <RefreshCcw className="h-3.5 w-3.5" />
                          )}
                          {status === "PAUSED" && (
                            <Pause className="h-3.5 w-3.5 fill-primary" />
                          )}
                          {status === "DROPPED" && (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          <SelectValue placeholder="Set Status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CURRENT">Watching</SelectItem>
                        <SelectItem value="PLANNING">Plan to Watch</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="REPEATING">Rewatching</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="DROPPED">Dropped</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Wrapper for Progress and Score on mobile */}
                  <div className={`col-span-2 flex flex-col gap-2 sm:flex-row`}>
                    {/* Progress Input */}
                    {showProgress && (
                      <div className="flex h-10 flex-1 items-center justify-between gap-2 rounded-none border border-primary/20 bg-background/50 px-3">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 shrink-0 text-primary opacity-50" />
                          <span className="text-[10px] font-black tracking-widest text-primary uppercase">
                            Ep
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <NumberInput
                            value={progress || 0}
                            onChange={(val) =>
                              onUpdateProgress?.(media.id, val)
                            }
                          />
                          {totalEpisodes && (
                            <span className="shrink-0 text-[10px] font-black text-primary opacity-30">
                              / {totalEpisodes}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Score Input */}
                    <div
                      className={`flex h-10 items-center justify-between gap-2 rounded-none border px-3 transition-all ${
                        rating === 0
                          ? "animate-pulse border-destructive/40 bg-destructive/10"
                          : "border-primary/20 bg-background/50"
                      } ${showProgress ? "flex-1" : "w-full"}`}
                    >
                      <div className="flex items-center gap-2">
                        <Star
                          className={`h-3.5 w-3.5 shrink-0 ${rating === 0 ? "fill-destructive text-destructive" : "fill-primary text-primary"}`}
                        />
                        <span
                          className={`text-[10px] font-black tracking-widest uppercase ${rating === 0 ? "text-destructive" : "text-primary"}`}
                        >
                          {rating === 0 ? "Set Score" : "Score"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <NumberInput
                          value={rating || 0}
                          onChange={(val) => onUpdateRating?.(media.id, val)}
                        />
                        <span
                          className={`shrink-0 text-[10px] font-black ${rating === 0 ? "text-destructive" : "text-primary"}`}
                        >
                          / 10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Relations */}
        {isExpanded && media.relations?.edges?.length > 0 && (
          <div className="ml-8 animate-in space-y-4 border-l-2 border-primary/10 pl-8 duration-500 slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase opacity-50">
                Related Shows
              </span>
              <div className="h-px flex-1 bg-muted/50" />
            </div>
            {media.relations.edges
              .filter((edge: any) => edge.node.type === "ANIME")
              .map((edge: any) => (
                <MediaCard
                  key={edge.node.id}
                  media={edge.node}
                  isSelected={isMediaSelected(edge.node.id)}
                  onSelect={handleToggleSelection}
                  relationType={edge.relationType}
                  rating={getMediaRating(edge.node.id)}
                  onUpdateRating={updateSelectionRating}
                  isMediaSelected={isMediaSelected}
                  handleToggleSelection={handleToggleSelection}
                  getMediaRating={getMediaRating}
                  updateSelectionRating={updateSelectionRating}
                  onViewDetails={onViewDetails}
                  onToggleExpand={onToggleExpand}
                />
              ))}
          </div>
        )}
      </div>
    )
  }
)
