import React from "react"
import { Star, GitMerge, Info, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NumberInput } from "@/components/NumberInput"
import { getScoreStyles, sanitizeHtml } from "@/lib/utils"

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
  isMediaSelected: (id: number) => boolean
  handleToggleSelection: (media: any) => void
  getMediaRating: (id: number) => number
  updateSelectionRating: (id: number, rating: number) => void
  onViewDetails: (media: any) => void
}

export const MediaCard = React.memo<MediaCardProps>(
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
    isMediaSelected,
    handleToggleSelection,
    getMediaRating,
    updateSelectionRating,
    onViewDetails,
  }) => {
    const primaryTitle = media.title.english || media.title.romaji || "No Title"
    const secondaryTitle =
      media.title.english && media.title.romaji ? media.title.romaji : null

    return (
      <div className="animate-in space-y-4 duration-300 fade-in slide-in-from-bottom-2">
        <div
          className={`glass-card relative flex flex-col gap-4 overflow-hidden rounded-none border p-4 transition-all sm:flex-row sm:gap-6 sm:p-5 ${
            isSelected
              ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(var(--primary),0.1)] ring-1 ring-primary/30"
              : "border-white/5 hover:border-primary/40 hover:bg-white/5"
          }`}
        >
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

            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                size="lg"
                variant={isSelected ? "default" : "outline"}
                className={`h-11 min-w-[120px] flex-1 font-black transition-all sm:min-w-[140px] ${isSelected ? "shadow-xl shadow-primary/30" : "hover:bg-primary hover:text-primary-foreground"}`}
                onClick={() => onSelect(media)}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Selected
                  </>
                ) : (
                  "Select Match"
                )}
              </Button>

              {isSelected && onUpdateRating && (
                <div
                  className={`flex h-11 flex-1 items-center gap-2 rounded-none border px-3 transition-all sm:flex-initial sm:px-4 ${
                    rating === 0
                      ? "animate-pulse border-destructive/40 bg-destructive/10"
                      : "border-primary/20 bg-primary/5"
                  }`}
                >
                  <Star
                    className={`h-4 w-4 ${rating === 0 ? "fill-destructive text-destructive" : "fill-primary text-primary"}`}
                  />
                  <span
                    className={`xs:inline hidden text-[10px] font-black tracking-widest uppercase ${rating === 0 ? "text-destructive" : "text-primary"}`}
                  >
                    {rating === 0 ? "Set Score" : "Score"}
                  </span>
                  <NumberInput
                    value={rating || 0}
                    onChange={(val) => onUpdateRating?.(media.id, val)}
                  />
                  <span
                    className={`text-[10px] font-black opacity-30 ${rating === 0 ? "text-destructive" : "text-primary"}`}
                  >
                    /10
                  </span>
                </div>
              )}

              <div className="flex gap-2">
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
                      {isExpanded ? "Hide Related Shows" : "Show Related Shows"}
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
