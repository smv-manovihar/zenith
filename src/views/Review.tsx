import React, { useState, useEffect, useCallback } from "react"
import { useProgress } from "@/components/ProgressProvider"
import { queryAniList, SEARCH_ANIME_QUERY } from "@/lib/anilist"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Layers,
  Star,
  Library,
  GitMerge,
  ChevronRight,
  ChevronLeft,
  Edit2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Info } from "lucide-react"
import { NumberInput } from "@/components/NumberInput"

const normalizeTitle = (title: string | null | undefined) => {
  if (!title) return ""
  return title.toLowerCase().replace(/[^a-z0-9]/g, "")
}

const getScoreStyles = (score: number) => {
  if (score >= 80)
    return {
      color: "text-emerald-500",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
      icon: <Star className="h-3 w-3 fill-emerald-500" />,
      label: "EXCELLENT",
    }
  if (score >= 65)
    return {
      color: "text-amber-500",
      border: "border-amber-500/20",
      bg: "bg-amber-500/10",
      icon: <Star className="h-3 w-3 fill-amber-500" />,
      label: "POSITIVE",
    }
  return {
    color: "text-muted-foreground",
    border: "border-muted",
    bg: "bg-muted/30",
    icon: <Star className="h-3 w-3 fill-muted-foreground" />,
    label: "AVERAGE",
  }
}

interface MediaCardProps {
  media: any
  isSelected: boolean
  onSelect: (media: any) => void
  relationType?: string
  hasRelations?: boolean
  isExpanded?: boolean
  onToggleExpand?: (id: number) => void
  rating?: number
  onUpdateRating?: (id: number, newRating: string) => void
  isMediaSelected: (id: number) => boolean
  handleToggleSelection: (media: any) => void
  getMediaRating: (id: number) => number
  updateSelectionRating: (id: number, rating: string) => void
  onViewDetails: (media: any) => void
}

const MediaCard = React.memo<MediaCardProps>(
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
          className={`relative flex gap-6 overflow-hidden rounded-3xl border p-5 transition-all ${
            isSelected
              ? "border-primary bg-primary/5 shadow-2xl ring-2 shadow-primary/10 ring-primary/20"
              : "border-muted bg-card shadow-sm hover:border-primary/50 hover:shadow-xl"
          }`}
        >
          <div
            className="h-44 w-32 shrink-0 cursor-pointer overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10"
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
                <div className="min-w-0">
                  {relationType && (
                    <Badge
                      variant="outline"
                      className="mb-1 border-primary/30 text-[9px] font-bold text-primary uppercase"
                    >
                      {relationType.replace(/_/g, " ")}
                    </Badge>
                  )}
                  <h4
                    className="line-clamp-2 cursor-pointer text-xl leading-tight font-black tracking-tight transition-colors hover:text-primary"
                    onClick={() => onSelect(media)}
                  >
                    {primaryTitle}
                  </h4>
                  {secondaryTitle && (
                    <p className="mt-0.5 line-clamp-1 text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-70">
                      {secondaryTitle}
                    </p>
                  )}
                </div>
                <Badge
                  variant={isSelected ? "default" : "secondary"}
                  className="shrink-0 px-3 py-1 text-[10px] font-black uppercase"
                >
                  {media.format}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 text-[10px] font-bold text-primary"
                >
                  {media.episodes || "?"} EPISODES
                </Badge>
                <Badge
                  variant="outline"
                  className="border-primary/20 text-[10px] font-bold text-primary uppercase"
                >
                  {media.status}
                </Badge>
                {media.averageScore && (
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1.5 border-0 px-2 py-0.5 text-[10px] font-black tracking-widest uppercase ${getScoreStyles(media.averageScore).bg} ${getScoreStyles(media.averageScore).color}`}
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
                  __html: media.description || "",
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                variant={isSelected ? "default" : "outline"}
                className={`h-11 min-w-[140px] flex-1 font-black transition-all ${isSelected ? "shadow-xl shadow-primary/30" : "hover:bg-primary hover:text-primary-foreground"}`}
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
                <div className="flex h-11 items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-[10px] font-black tracking-widest text-primary uppercase">
                    Score
                  </span>
                  <NumberInput
                    value={rating || 0}
                    onChange={(val) => onUpdateRating?.(media.id, val)}
                  />
                  <span className="text-[10px] font-black text-primary opacity-30">
                    /10
                  </span>
                </div>
              )}

              {hasRelations && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className={`h-11 w-11 shrink-0 rounded-xl transition-all ${isExpanded ? "bg-primary text-primary-foreground" : ""}`}
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
                    className="h-11 w-11 shrink-0 rounded-xl"
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

interface SidebarEntryProps {
  entry: any
  idx: number
  isActive: boolean
  onClick: () => void
  onUpdateRating: (index: number, val: string) => void
}

const SidebarEntry = React.memo<SidebarEntryProps>(
  ({ entry, idx, isActive, onClick, onUpdateRating }) => {
    return (
      <button
        onClick={onClick}
        className={`group flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all ${
          isActive
            ? "border-primary bg-primary/5 shadow-inner"
            : "border-transparent hover:bg-muted"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className={`line-clamp-2 text-sm leading-tight font-bold ${isActive ? "text-primary" : "text-foreground"}`}
          >
            {entry.name}
          </span>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span>SCORE</span>
              <NumberInput
                value={entry.rating}
                onChange={(val) => onUpdateRating(idx, val)}
              />
              <span className="opacity-40">/10</span>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          {entry.selections?.length > 0 ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
              {entry.selections.length}
            </div>
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-muted" />
          )}
        </div>
      </button>
    )
  }
)

const Review: React.FC = () => {
  const { entries, updateEntry, token } = useProgress()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditingSearch, setIsEditingSearch] = useState(false)
  const [expandedMediaIds, setExpandedMediaIds] = useState<Set<number>>(
    new Set()
  )
  const [selectedDetailsMedia, setSelectedDetailsMedia] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate("/")
    }
  }, [token, navigate])

  const currentEntry = entries[currentIndex]

  useEffect(() => {
    if (currentEntry) {
      setSearchQuery(currentEntry.name)
      setIsEditingSearch(false)
    }
  }, [currentIndex, currentEntry?.name])

  const { data, isLoading } = useQuery({
    queryKey: ["animeSearch", searchQuery],
    queryFn: () => queryAniList(SEARCH_ANIME_QUERY, { search: searchQuery }),
    enabled: !!searchQuery,
  })

  const searchResults = data?.data?.Page?.media || []

  // Auto-selection logic
  useEffect(() => {
    if (
      searchResults.length > 0 &&
      !isLoading &&
      currentEntry &&
      currentEntry.selections.length === 0 &&
      normalizeTitle(searchQuery) === normalizeTitle(currentEntry.name)
    ) {
      const normalizedQuery = normalizeTitle(searchQuery)
      const lowerQuery = searchQuery.toLowerCase().trim()

      const perfectMatches = searchResults.filter((media: any) => {
        const titles = [
          media.title.romaji,
          media.title.english,
          media.title.native,
        ].filter(Boolean)

        return titles.some((t) => {
          const lowerT = t.toLowerCase().trim()
          const normT = normalizeTitle(t)
          return (
            lowerT === lowerQuery ||
            normT === normalizedQuery ||
            normT.includes(normalizedQuery)
          )
        })
      })

      if (perfectMatches.length > 0) {
        updateEntry(currentIndex, {
          selections: perfectMatches.map((match: any) => ({
            id: match.id,
            title: match.title.romaji || match.title.english || "No Title",
            image: match.coverImage?.large || "",
            rating: currentEntry.rating,
            status: "pending",
          })),
          status: "resolved",
        })
      }
    }
  }, [searchResults, currentIndex, currentEntry, searchQuery, updateEntry])

  const handleToggleSelection = useCallback(
    (media: any) => {
      const isSelected = currentEntry.selections.some((s) => s.id === media.id)
      let newSelections = [...currentEntry.selections]

      if (isSelected) {
        newSelections = newSelections.filter((s) => s.id !== media.id)
      } else {
        newSelections.push({
          id: media.id,
          title: media.title.english || media.title.romaji || "No Title",
          image: media.coverImage?.large || "",
          rating: currentEntry.rating,
          status: "pending",
        })
      }

      updateEntry(currentIndex, {
        selections: newSelections,
        status: newSelections.length > 0 ? "resolved" : "pending",
      })
    },
    [currentEntry, currentIndex, updateEntry]
  )

  const updateSelectionRating = useCallback(
    (mediaId: number, newRating: string) => {
      const val = parseFloat(newRating) || 0
      const newSelections = currentEntry.selections.map((s) =>
        s.id === mediaId ? { ...s, rating: val } : s
      )
      updateEntry(currentIndex, { selections: newSelections })
    },
    [currentEntry.selections, currentIndex, updateEntry]
  )

  const toggleExpand = useCallback((mediaId: number) => {
    setExpandedMediaIds((prev) => {
      const next = new Set(prev)
      if (next.has(mediaId)) {
        next.delete(mediaId)
      } else {
        next.add(mediaId)
      }
      return next
    })
  }, [])

  const isMediaSelected = useCallback(
    (mediaId: number) => {
      return currentEntry.selections.some((s) => s.id === mediaId)
    },
    [currentEntry.selections]
  )

  const getMediaRating = useCallback(
    (mediaId: number) => {
      const selection = currentEntry.selections.find((s) => s.id === mediaId)
      return selection ? selection.rating : currentEntry.rating
    },
    [currentEntry.selections, currentEntry.rating]
  )

  const updateRating = useCallback(
    (index: number, newRating: string) => {
      const val = parseFloat(newRating)
      if (!isNaN(val)) {
        updateEntry(index, { rating: val })
      }
    },
    [updateEntry]
  )

  const handleNext = () => {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      navigate("/sync")
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="font-heading text-xl font-medium tracking-tight">
          No entries to review.
        </p>
        <Button onClick={() => navigate("/import")}>Go to Import</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl animate-in space-y-10 pb-32 duration-700 fade-in">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">
            Review Matches
          </h2>
          <p className="font-medium text-muted-foreground">
            Precision alignment for your Zenith workspace.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border bg-card px-6 py-3 shadow-sm">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Progress
          </span>
          <div className="h-1.5 w-32 rounded-full bg-muted md:w-48">
            <div
              className="h-full bg-primary transition-all duration-700"
              style={{
                width: `${(entries.filter((e) => e.selections.length > 0).length / entries.length) * 100}%`,
              }}
            />
          </div>
          <span className="font-mono text-sm font-bold">
            {entries.filter((e) => e.selections.length > 0).length}/
            {entries.length}
          </span>
        </div>
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-12">
        {/* Left Side: Navigation List */}
        <div className="space-y-4 lg:col-span-4">
          <Card className="border shadow-lg">
            <CardHeader className="border-b pb-4">
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
                  <Library className="h-4 w-4" />
                  Sequence
                </TooltipTrigger>
                <TooltipContent>
                  The list of anime from your import
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] p-2">
                <div className="space-y-1">
                  {entries.map((entry, idx) => (
                    <SidebarEntry
                      key={idx}
                      entry={entry}
                      idx={idx}
                      isActive={idx === currentIndex}
                      onClick={() => setCurrentIndex(idx)}
                      onUpdateRating={updateRating}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Media Selection Workspace */}
        <div className="space-y-6 lg:col-span-8">
          <Card className="overflow-hidden border shadow-2xl">
            <div className="space-y-6 border-b p-8">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    {isEditingSearch ? (
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 text-lg font-bold"
                        autoFocus
                        onBlur={() => setIsEditingSearch(false)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setIsEditingSearch(false)
                        }
                      />
                    ) : (
                      <div className="group flex items-center gap-3">
                        <h3 className="truncate text-3xl leading-none font-black tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">
                          {currentEntry.name}
                        </h3>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => setIsEditingSearch(true)}
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit search query</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                  <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase opacity-60">
                    Source: {currentEntry.originalLine}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-xs font-black tracking-widest text-primary uppercase">
                      Score
                    </span>
                    <NumberInput
                      value={currentEntry.rating}
                      onChange={(val) => updateRating(currentIndex, val)}
                    />
                    <span className="text-sm font-black opacity-30">/10</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 pb-24">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                  <Layers className="h-12 w-12 animate-pulse text-primary" />
                  <p className="text-xs font-black tracking-[0.3em] text-muted-foreground uppercase">
                    Searching AniList...
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {searchResults.map((media: any) => (
                    <MediaCard
                      key={media.id}
                      media={media}
                      isSelected={isMediaSelected(media.id)}
                      onSelect={handleToggleSelection}
                      hasRelations={media.relations?.edges?.length > 0}
                      isExpanded={expandedMediaIds.has(media.id)}
                      onToggleExpand={toggleExpand}
                      rating={getMediaRating(media.id)}
                      onUpdateRating={updateSelectionRating}
                      isMediaSelected={isMediaSelected}
                      handleToggleSelection={handleToggleSelection}
                      getMediaRating={getMediaRating}
                      updateSelectionRating={updateSelectionRating}
                      onViewDetails={setSelectedDetailsMedia}
                    />
                  ))}

                  {searchResults.length === 0 && (
                    <div className="space-y-8 rounded-[3rem] border-2 border-dashed bg-muted/5 py-24 text-center">
                      <div className="relative inline-block">
                        <Layers className="mx-auto h-20 w-20 text-muted/30" />
                        <AlertCircle className="absolute -right-1 -bottom-1 h-8 w-8 text-destructive" />
                      </div>
                      <div className="space-y-4">
                        <p className="text-3xl font-black tracking-tighter uppercase italic opacity-50">
                          Empty Sequence Detected
                        </p>
                        <p className="mx-auto max-w-xs text-sm font-medium text-muted-foreground">
                          No records found. Refine your query to re-initialize
                          search.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-14 rounded-2xl border-primary/20 px-10 font-black hover:bg-primary/5"
                        onClick={() => setIsEditingSearch(true)}
                      >
                        Refine Search
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 animate-in items-center justify-between gap-6 rounded-[2rem] border border-primary/20 bg-card/60 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-all duration-500 fade-in slide-in-from-bottom-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="h-11 rounded-xl px-6 text-xs font-black tracking-widest uppercase hover:bg-muted"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </TooltipTrigger>
          <TooltipContent>Go to previous entry</TooltipContent>
        </Tooltip>

        <div className="hidden flex-col items-center md:flex">
          <p className="text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase opacity-40">
            Index #{currentIndex + 1}
          </p>
          <div className="mt-1 flex gap-1.5">
            {Array.from({ length: Math.min(entries.length, 5) }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  (entries.length > 5
                    ? i + Math.max(0, currentIndex - 2)
                    : i) === currentIndex
                    ? "w-4 bg-primary"
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
              onClick={handleNext}
              className="h-11 rounded-xl bg-primary px-10 text-xs font-black tracking-widest uppercase shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
              {currentEntry.selections.length === 0
                ? "Skip"
                : currentIndex === entries.length - 1
                  ? "Finalize"
                  : "Next"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {currentIndex === entries.length - 1
              ? "Commit selections and sync"
              : "Proceed to next entry"}
          </TooltipContent>
        </Tooltip>
      </div>

      <Dialog
        open={!!selectedDetailsMedia}
        onOpenChange={(open) => !open && setSelectedDetailsMedia(null)}
      >
        <DialogContent
          // Removed sm:h-auto to let max-h-[85vh] be the absolute authority
          className="flex max-h-[85vh] flex-col overflow-hidden border-primary/10 p-0 shadow-2xl transition-all duration-300 sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
        >
          {selectedDetailsMedia && (
            <>
              {/* Main Content Area - Native Scroll with min-h-0 */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {/* Banner Section */}
                {selectedDetailsMedia.bannerImage && (
                  <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-48">
                    <img
                      src={selectedDetailsMedia.bannerImage}
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
                        src={selectedDetailsMedia.coverImage?.large}
                        className={`relative h-48 w-32 rounded-xl object-cover shadow-2xl ring-4 ring-background sm:h-56 sm:w-40 ${
                          selectedDetailsMedia.bannerImage ? "sm:-mt-20" : ""
                        }`}
                        alt="cover"
                      />

                      <div className="flex-1 space-y-3 text-center sm:text-left">
                        <DialogTitle className="text-2xl leading-tight font-black tracking-tight uppercase sm:text-3xl">
                          {selectedDetailsMedia.title.english ||
                            selectedDetailsMedia.title.romaji}
                        </DialogTitle>

                        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                          <Badge
                            variant="secondary"
                            className="rounded-lg bg-primary/10 px-3 py-1 text-[10px] font-black tracking-widest text-primary uppercase"
                          >
                            {selectedDetailsMedia.format}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-2 rounded-lg border-0 px-3 py-1 text-[10px] font-black tracking-widest uppercase ${getScoreStyles(selectedDetailsMedia.averageScore).bg} ${getScoreStyles(selectedDetailsMedia.averageScore).color}`}
                          >
                            {
                              getScoreStyles(selectedDetailsMedia.averageScore)
                                .icon
                            }
                            {selectedDetailsMedia.averageScore}% SCORE
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="rounded-lg px-3 py-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase"
                          >
                            {selectedDetailsMedia.status}
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
                        __html:
                          selectedDetailsMedia.description ||
                          "No description available.",
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Review
