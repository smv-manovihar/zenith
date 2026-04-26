import { memo } from "react"
import {
  Star,
  Info,
  CheckCircle2,
  Play,
  Hash,
  Circle,
  ExternalLink,
  SquareLibrary,
  Plus,
  Building2,
  Calendar,
  BookOpen,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NumberInput } from "@/components/NumberInput"
import { getScoreStyles, getStatusStyles, cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type AniListStatus } from "@/components/ProgressProvider"

const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, "")

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
  hideSelection?: boolean
  showEditButton?: boolean
  onAdd?: (media: any) => void
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
    hideSelection,
    showEditButton,
    onAdd,
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
          className={cn(
            "glass-card relative flex flex-col gap-4 overflow-hidden rounded-none border p-3 transition-all sm:flex-row sm:gap-6 sm:p-5",
            isSelected
              ? "border-primary bg-primary/[0.07] shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)] ring-1 ring-primary/40"
              : "border-white/5 hover:border-primary/40 hover:bg-white/5"
          )}
        >
          {/* Cover Image */}
          <div
            className="h-48 w-full shrink-0 cursor-pointer overflow-hidden rounded-none shadow-2xl ring-1 ring-white/10 sm:h-44 sm:w-32"
            onClick={() =>
              media.siteUrl && window.open(media.siteUrl, "_blank")
            }
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
                    className="group line-clamp-2 cursor-pointer text-lg leading-tight font-black tracking-tight transition-colors hover:text-primary sm:text-xl"
                    onClick={() =>
                      media.siteUrl && window.open(media.siteUrl, "_blank")
                    }
                  >
                    {primaryTitle}
                    <ExternalLink className="ml-2 inline-block h-3 w-3 shrink-0 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 sm:h-3.5 sm:w-3.5" />
                  </h4>
                  {secondaryTitle && (
                    <p className="mt-0.5 line-clamp-1 text-[9px] font-bold tracking-widest text-muted-foreground uppercase opacity-70">
                      {secondaryTitle}
                    </p>
                  )}

                  {/* Studio, Season, and Source Info */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold tracking-tight text-muted-foreground/50 uppercase">
                    {media.studios?.nodes?.find(
                      (n: any) => n.isAnimationStudio
                    ) && (
                      <span className="flex items-center gap-1 text-primary/70">
                        <Building2 className="h-2.5 w-2.5" />
                        {
                          media.studios.nodes.find(
                            (n: any) => n.isAnimationStudio
                          ).name
                        }
                      </span>
                    )}
                    {media.season && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {media.season.charAt(0) +
                          media.season.slice(1).toLowerCase()}{" "}
                        {media.seasonYear}
                      </span>
                    )}
                    {media.source && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-2.5 w-2.5" />
                        {media.source.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
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
                  className={`border px-2 py-0.5 text-[9px] font-black tracking-widest uppercase md:text-[10px] ${getStatusStyles(media.status).bg} ${getStatusStyles(media.status).text} ${getStatusStyles(media.status).border}`}
                >
                  {media.status.replace(/_/g, " ")}
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
              <p className="hidden truncate text-[11px] leading-snug text-muted-foreground/80 sm:block">
                {stripHtml(media.description || "")}
              </p>
            </div>

            {/* Actions & Controls Section */}
            <div className="mt-4 flex flex-col gap-3">
              {/* Primary Select Button: Full width on mobile */}
              {!hideSelection && (
                <Button
                  size="lg"
                  variant={isSelected ? "default" : "outline"}
                  className={`h-11 w-full font-black tracking-widest uppercase transition-all ${isSelected ? "shadow-xl shadow-primary/30" : "hover:bg-primary hover:text-primary-foreground"}`}
                  onClick={() => onSelect(media)}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Selected
                    </>
                  ) : (
                    <>
                      <Circle className="mr-2 h-4 w-4 opacity-50 transition-opacity group-hover:opacity-100" />
                      Select This
                    </>
                  )}
                </Button>
              )}

              {/* Tracking Controls Box (Only visible when selected or showEditButton is true) */}
              {(isSelected || showEditButton) && onUpdateRating && (
                <div className="flex animate-in flex-wrap items-stretch gap-1.5 rounded-none border border-primary/10 bg-primary/5 p-1.5 duration-300 fade-in slide-in-from-top-2 md:p-2 xl:gap-2">
                  {/* Status Dropdown */}
                  <div className="min-w-[140px] flex-1">
                    <Select
                      value={status}
                      onValueChange={(val: AniListStatus) =>
                        onUpdateStatus?.(media.id, val)
                      }
                    >
                      <SelectTrigger className="h-10 w-full border-primary/20 bg-background/50 px-2 font-semibold text-primary shadow-none hover:bg-background/80 sm:px-3">
                        <div className="flex items-center gap-1.5">
                          {status === "CURRENT" && (
                            <Play className="h-3 w-3 fill-primary sm:h-3.5 sm:w-3.5" />
                          )}
                          <SelectValue
                            placeholder="Status"
                            className="text-xs"
                          />
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

                  {/* Wrapper for Progress and Score */}
                  <div
                    className={cn(
                      "flex min-w-0 flex-1 flex-wrap gap-1.5 xl:gap-2",
                      showProgress ? "basis-[300px]" : "basis-[140px]"
                    )}
                  >
                    {/* Progress Input */}
                    {showProgress && (
                      <div className="flex h-10 min-w-[140px] flex-1 items-center justify-between gap-1.5 rounded-none border border-primary/20 bg-background/50 px-2 sm:px-3">
                        <div className="flex min-w-0 items-center gap-1">
                          <Hash className="h-3 w-3 shrink-0 text-primary opacity-50 sm:h-3.5 sm:w-3.5" />
                          <span className="truncate text-[9px] font-black tracking-tighter text-primary uppercase sm:text-[10px]">
                            Ep
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <NumberInput
                            value={progress || 0}
                            step={1}
                            onChange={(val) =>
                              onUpdateProgress?.(media.id, val)
                            }
                          />
                          {totalEpisodes && (
                            <span className="shrink-0 text-[10px] font-black text-primary">
                              /{totalEpisodes}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Score Input */}
                    <div
                      className={cn(
                        "flex h-10 min-w-[140px] flex-1 items-center justify-between gap-1.5 rounded-none border px-2 transition-all sm:px-3",
                        rating === 0
                          ? "animate-pulse border-destructive/40 bg-destructive/10"
                          : "border-primary/20 bg-background/50"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-1">
                        <Star
                          className={cn(
                            "h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5",
                            rating === 0
                              ? "fill-destructive text-destructive"
                              : "fill-primary text-primary"
                          )}
                        />
                        <span
                          className={cn(
                            "truncate text-[9px] font-black tracking-tighter uppercase sm:text-[10px]",
                            rating === 0 ? "text-destructive" : "text-primary"
                          )}
                        >
                          {rating === 0 ? "Score" : "Score"}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <NumberInput
                          value={rating || 0}
                          onChange={(val) => onUpdateRating?.(media.id, val)}
                        />
                        <span
                          className={cn(
                            "shrink-0 text-[10px] font-black opacity-100",
                            rating === 0 ? "text-destructive" : "text-primary"
                          )}
                        >
                          /10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Moved to Bottom */}
              <div className="mt-1 flex items-center justify-end border-t border-dashed border-border/50 pt-3">
                <div className="flex gap-2">
                  {hasRelations && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isExpanded ? "default" : "outline"}
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-none transition-all"
                          onClick={() => onToggleExpand?.(media.id)}
                        >
                          <SquareLibrary className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isExpanded
                          ? "Hide Related Shows"
                          : "Show Related Shows"}
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {onAdd && !status && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-9 rounded-none px-4 font-black tracking-widest uppercase"
                      onClick={() => onAdd(media)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add to List
                    </Button>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-none"
                        onClick={() => onViewDetails(media)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View Full Details</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Relations */}
        {isExpanded && media.relations?.edges?.length > 0 && (
          <div className="ml-0 animate-in border-l-2 border-primary/10 pl-3 duration-500 slide-in-from-top-4 sm:ml-8 sm:pl-8">
            <div className="mb-4 flex items-center gap-4">
              <span className="text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase opacity-50">
                Related Shows
              </span>
              <div className="h-px flex-1 bg-muted/50" />
            </div>
            <div className="grid grid-cols-1 gap-4">
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
                    status={status}
                    onUpdateStatus={onUpdateStatus}
                    progress={progress}
                    onUpdateProgress={onUpdateProgress}
                    totalEpisodes={edge.node.episodes}
                    isMediaSelected={isMediaSelected}
                    handleToggleSelection={handleToggleSelection}
                    getMediaRating={getMediaRating}
                    updateSelectionRating={updateSelectionRating}
                    onViewDetails={onViewDetails}
                    onToggleExpand={onToggleExpand}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)
