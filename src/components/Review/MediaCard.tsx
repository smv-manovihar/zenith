import { memo } from "react"
import {
  Star,
  Info,
  Play,
  Hash,
  SquareLibrary,
  Plus,
  Building2,
  Calendar,
  BookOpen,
  CheckCircle2,
  Circle,
  Expand,
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

export interface MediaCardProps {
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
  isMediaSelected?: (id: number) => boolean
  handleToggleSelection?: (media: any) => void
  getMediaRating?: (id: number) => number
  updateSelectionRating?: (id: number, rating: number) => void
  onViewDetails: (media: any) => void
  onStudioClick?: (studioName: string) => void
  hideSelection?: boolean
  showEditButton?: boolean
  onAdd?: (media: any) => void
}

const AniListIcon = memo(({ className }: { className?: string }) => (
  <svg
    fill="currentColor"
    viewBox="0 0 24 24"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M6.361 2.943 0 21.056h4.942l1.077-3.133H11.4l1.052 3.133H22.9c.71 0 1.1-.392 1.1-1.101V17.53c0-.71-.39-1.101-1.1-1.101h-6.483V4.045c0-.71-.392-1.102-1.101-1.102h-2.422c-.71 0-1.101.392-1.101 1.102v1.064l-.758-2.166zm2.324 5.948 1.688 5.018H7.144z" />
  </svg>
))

interface MediaMetaInfoProps {
  animationStudio?: any
  season?: string
  seasonYear?: number
  source?: string
  onStudioClick?: (studioName: string) => void
  className?: string
}

const MediaMetaInfo = memo<MediaMetaInfoProps>(
  ({
    animationStudio,
    season,
    seasonYear,
    source,
    onStudioClick,
    className,
  }) => {
    if (!animationStudio && !season && !source) return null

    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-bold tracking-tight text-muted-foreground/70 uppercase",
          className
        )}
      >
        {animationStudio && (
          <span
            className="flex cursor-pointer items-center gap-1 text-primary/80 transition-colors hover:text-primary"
            onClick={(e) => {
              e.stopPropagation()
              if (onStudioClick) onStudioClick(animationStudio.name)
            }}
            title={`Studio: ${animationStudio.name}`}
          >
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-30 sm:max-w-none">
              {animationStudio.name}
            </span>
          </span>
        )}
        {season && (
          <span className="flex items-center gap-1" title="Release Season">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>
              {season.charAt(0) + season.slice(1).toLowerCase()}{" "}
              {seasonYear}
            </span>
          </span>
        )}
        {source && (
          <span className="flex items-center gap-1" title="Source Material">
            <BookOpen className="h-3 w-3 shrink-0" />
            <span>{source.replace(/_/g, " ")}</span>
          </span>
        )}
      </div>
    )
  }
)
MediaMetaInfo.displayName = "MediaMetaInfo"

interface MediaCoverProps {
  coverImage?: { large?: string; medium?: string }
  title: string
  onViewDetails: () => void
  className?: string
}

const MediaCover = memo<MediaCoverProps>(
  ({ coverImage, title, onViewDetails, className }) => (
    <div
      className={cn(
        "group/cover relative shrink-0 cursor-pointer overflow-hidden rounded-none shadow-xl ring-1 ring-white/10",
        className
      )}
      onClick={onViewDetails}
      title="Click to view details"
    >
      <img
        src={coverImage?.large || coverImage?.medium}
        alt={title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover/cover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 backdrop-blur-[1px] opacity-0 transition-all duration-300 group-hover/cover:opacity-100">
        <Expand className="h-5 w-5 text-white drop-shadow-md transition-transform duration-300 group-hover/cover:scale-110" />
        <span className="text-[10px] font-black tracking-wider text-white uppercase drop-shadow-md">
          View Info
        </span>
      </div>
    </div>
  )
)
MediaCover.displayName = "MediaCover"

export const MediaCard = memo<MediaCardProps>(
  ({
    media,
    isSelected,
    onSelect,
    relationType,
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
    onStudioClick,
    hideSelection,
    showEditButton,
    onAdd,
  }) => {
    const primaryTitle = media.title?.english || media.title?.romaji || "No Title"
    const secondaryTitle =
      media.title?.english && media.title?.romaji ? media.title.romaji : null

    const showProgress = ["CURRENT", "REPEATING", "PAUSED", "DROPPED"].includes(
      status || ""
    )

    const animationStudio = media.studios?.nodes?.find(
      (n: any) => n.isAnimationStudio
    )

    return (
      <div className="animate-in space-y-4 duration-300 fade-in slide-in-from-bottom-2">
        <div
          className={cn(
            "glass-card relative flex flex-col gap-4 overflow-hidden rounded-none border p-3.5 transition-all sm:flex-row sm:gap-5 sm:p-5",
            isSelected
              ? "border-primary bg-primary/[0.07] shadow-xl ring-1 shadow-primary/30 ring-primary/40"
              : "border-white/5 hover:border-primary/40 hover:bg-white/5"
          )}
        >
          {/* Desktop Left Column: Cover Image */}
          <div className="hidden sm:block sm:w-32 sm:shrink-0">
            <MediaCover
              coverImage={media.coverImage}
              title={primaryTitle}
              onViewDetails={() => onViewDetails(media)}
              className="h-44 w-32"
            />
          </div>

          {/* Mobile Top Row: Cover Image + Header Summary */}
          <div className="flex gap-3.5 sm:hidden min-w-0">
            <MediaCover
              coverImage={media.coverImage}
              title={primaryTitle}
              onViewDetails={() => onViewDetails(media)}
              className="h-36 w-24"
            />

            <div className="flex flex-1 flex-col justify-between min-w-0">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {relationType && (
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-[10px] font-bold text-primary uppercase"
                    >
                      {relationType.replace(/_/g, " ")}
                    </Badge>
                  )}
                  <Badge
                    variant={isSelected ? "default" : "secondary"}
                    className="px-1.5 py-0 text-[10px] font-black uppercase"
                  >
                    {media.format || "ANIME"}
                  </Badge>
                </div>

                <h4 className="line-clamp-2 text-sm font-black leading-snug tracking-tight text-foreground">
                  <span
                    className="cursor-pointer transition-colors hover:text-primary"
                    onClick={() => onViewDetails(media)}
                    title="Click to view details"
                  >
                    {primaryTitle}
                  </span>
                </h4>

                {secondaryTitle && (
                  <p className="line-clamp-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase opacity-70">
                    {secondaryTitle}
                  </p>
                )}

                <MediaMetaInfo
                  animationStudio={animationStudio}
                  season={media.season}
                  seasonYear={media.seasonYear}
                  source={media.source}
                  onStudioClick={onStudioClick}
                  className="pt-1 text-[10px]"
                />
              </div>
            </div>
          </div>

          {/* Main Content Column */}
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="space-y-3">
              {/* Desktop Header */}
              <div className="hidden sm:flex sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  {relationType && (
                    <Badge
                      variant="outline"
                      className="mb-1 border-primary/30 text-xs font-bold text-primary uppercase"
                    >
                      {relationType.replace(/_/g, " ")}
                    </Badge>
                  )}
                  <h4 className="line-clamp-2 text-lg font-black leading-tight tracking-tight wrap-break-word text-foreground md:text-xl">
                    <span
                      className="cursor-pointer transition-colors hover:text-primary"
                      onClick={() => onViewDetails(media)}
                      title="Click to view details"
                    >
                      {primaryTitle}
                    </span>
                  </h4>
                  {secondaryTitle && (
                    <p className="mt-0.5 line-clamp-1 text-xs font-bold tracking-widest wrap-break-word text-muted-foreground uppercase opacity-70">
                      {secondaryTitle}
                    </p>
                  )}

                  <MediaMetaInfo
                    animationStudio={animationStudio}
                    season={media.season}
                    seasonYear={media.seasonYear}
                    source={media.source}
                    onStudioClick={onStudioClick}
                    className="mt-2"
                  />
                </div>

                <Badge
                  variant={isSelected ? "default" : "secondary"}
                  className="shrink-0 px-2.5 py-0.5 text-xs font-black uppercase md:px-3 md:py-1"
                >
                  {media.format || "ANIME"}
                </Badge>
              </div>

              {/* Badges Row (Episodes, Status, Score) */}
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-primary"
                >
                  {media.episodes || "?"} {media.episodes === 1 ? "EPISODE" : "EPISODES"}
                </Badge>
                {media.status && (
                  <Badge
                    className={`border px-2 py-0.5 text-[10px] sm:text-xs font-black tracking-widest uppercase ${getStatusStyles(media.status).bg} ${getStatusStyles(media.status).text} ${getStatusStyles(media.status).border}`}
                  >
                    {media.status.replace(/_/g, " ")}
                  </Badge>
                )}
                {media.averageScore && (
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1.5 border-0 px-2 py-0.5 text-[10px] sm:text-xs font-black tracking-widest uppercase ${getScoreStyles(media.averageScore).bg} ${getScoreStyles(media.averageScore).color}`}
                  >
                    {getScoreStyles(media.averageScore).icon}
                    {media.averageScore}%{" "}
                    {getScoreStyles(media.averageScore).label}
                  </Badge>
                )}
              </div>

              {/* Description */}
              {media.description && (
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/70 sm:line-clamp-3">
                  {stripHtml(media.description)}
                </p>
              )}
            </div>

            {/* Actions & Controls Section */}
            <div className="mt-4 flex flex-col gap-3">
              {/* Primary Select Button */}
              {!hideSelection && (
                <Button
                  size="lg"
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "group h-11 w-full gap-2.5 font-black tracking-widest uppercase transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30"
                      : "hover:bg-primary hover:text-primary-foreground"
                  )}
                  onClick={() => onSelect(media)}
                >
                  {isSelected ? (
                    <CheckCircle2 className="size-4 shrink-0 fill-primary-foreground/20 text-primary-foreground" />
                  ) : (
                    <Circle className="size-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-75" />
                  )}
                  <span>{isSelected ? "Selected" : "Select This"}</span>
                </Button>
              )}

              {/* Tracking Controls Box */}
              {(isSelected || showEditButton) && onUpdateRating && (
                <div className="flex animate-in flex-col items-stretch gap-1.5 rounded-none border border-primary/10 bg-primary/5 p-1.5 duration-300 fade-in slide-in-from-top-2 sm:flex-row sm:items-center sm:p-2 xl:gap-2">
                  {/* Status Dropdown */}
                  <div className="w-full sm:flex-1">
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

                  {/* Progress Input */}
                  {showProgress && (
                    <div className="w-full sm:flex-1">
                      <div className="flex h-10 min-w-0 items-center justify-between gap-1.5 rounded-none border border-primary/20 bg-background/50 px-2 sm:px-3">
                        <div className="flex min-w-0 items-center gap-1">
                          <Hash className="h-3 w-3 shrink-0 text-primary opacity-50 sm:h-3.5 sm:w-3.5" />
                          <span className="inline truncate text-xs font-black tracking-tighter text-primary uppercase">
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
                            <span className="shrink-0 text-xs font-black text-primary">
                              /{totalEpisodes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Score Input */}
                  <div className="w-full sm:flex-1">
                    <div
                      className={cn(
                        "flex h-10 min-w-0 items-center justify-between gap-1.5 rounded-none border px-2 transition-all sm:px-3",
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
                            "inline truncate text-xs font-black tracking-tighter uppercase",
                            rating === 0 ? "text-destructive" : "text-primary"
                          )}
                        >
                          Score
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <NumberInput
                          value={rating || 0}
                          onChange={(val) => onUpdateRating?.(media.id, val)}
                        />
                        <span
                          className={cn(
                            "shrink-0 text-xs font-black",
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

              {/* Action Buttons */}
              <div className="mt-1 flex items-center justify-end border-t border-dashed border-border/50 pt-2.5">
                <div className="flex items-center gap-2">
                  {onToggleExpand && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isExpanded ? "default" : "outline"}
                          size="icon"
                          className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-none transition-all"
                          onClick={() => onToggleExpand?.(media.id)}
                        >
                          <SquareLibrary className="h-4 w-4 sm:h-5 sm:w-5" />
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
                      className="h-9 sm:h-10 rounded-none px-3 sm:px-4 font-black tracking-widest uppercase text-xs"
                      onClick={() => onAdd(media)}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
                    </Button>
                  )}

                  {media.siteUrl && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-none transition-colors hover:border-primary hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(media.siteUrl, "_blank", "noopener,noreferrer")
                          }}
                          aria-label="Open on AniList"
                        >
                          <AniListIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open on AniList</TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-none"
                        onClick={() => onViewDetails(media)}
                      >
                        <Info className="h-4 w-4 sm:h-5 sm:w-5" />
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
        {isExpanded && (
          <div className="ml-0 animate-in border-l-2 border-primary/10 pl-3 duration-500 slide-in-from-top-4 sm:ml-6 sm:pl-6">
            <div className="mb-4 flex items-center gap-4">
              <span className="text-xs font-black tracking-[0.2em] text-muted-foreground uppercase opacity-60">
                Related Shows
              </span>
              <div className="h-px flex-1 bg-muted/50" />
            </div>
            {media.relations?.edges?.filter((edge: any) => edge.node?.type === "ANIME").length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {media.relations.edges
                  .filter((edge: any) => edge.node?.type === "ANIME")
                  .map((edge: any) => {
                    const relationMedia = edge.node
                    const isRelSelected = isMediaSelected
                      ? isMediaSelected(relationMedia.id)
                      : false
                    const relRating = getMediaRating
                      ? getMediaRating(relationMedia.id)
                      : 0

                    return (
                      <MediaCard
                        key={relationMedia.id}
                        media={relationMedia}
                        isSelected={isRelSelected}
                        onSelect={handleToggleSelection || onSelect}
                        relationType={edge.relationType}
                        rating={relRating}
                        onUpdateRating={updateSelectionRating || onUpdateRating}
                        status={status}
                        onUpdateStatus={onUpdateStatus}
                        progress={progress}
                        onUpdateProgress={onUpdateProgress}
                        totalEpisodes={relationMedia.episodes}
                        isMediaSelected={isMediaSelected}
                        handleToggleSelection={handleToggleSelection}
                        getMediaRating={getMediaRating}
                        updateSelectionRating={updateSelectionRating}
                        onViewDetails={onViewDetails}
                        onToggleExpand={onToggleExpand}
                      />
                    )
                  })}
              </div>
            ) : (
              <div className="rounded-none border border-dashed border-border/50 bg-muted/10 p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  No related shows found.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

MediaCard.displayName = "MediaCard"
