import React, { useState, useEffect, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Layers,
  Edit2,
  Star,
  AlertCircle,
  Sparkles,
  CheckSquare,
  RefreshCcw,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { NumberInput } from "@/components/NumberInput"
import { queryAniList, SEARCH_ANIME_QUERY } from "@/lib/anilist"
import { MediaCard } from "./MediaCard"
import { normalizeTitle } from "@/lib/utils"
import { ReviewSidebar } from "./ReviewSidebar"
import { MediaCardSkeleton } from "./MediaCardSkeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MediaSelectionAreaProps {
  currentEntry: any
  currentIndex: number
  updateEntry: (index: number, updates: any) => void
  onViewDetails: (media: any) => void
  entries: any[]
  onSelectEntry: (index: number) => void
}

export const MediaSelectionArea: React.FC<MediaSelectionAreaProps> = ({
  currentEntry,
  currentIndex,
  updateEntry,
  onViewDetails,
  entries,
  onSelectEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditingSearch, setIsEditingSearch] = useState(false)
  const [expandedMediaIds, setExpandedMediaIds] = useState<Set<number>>(
    new Set()
  )

  // Update local search query when entry changes
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
      !currentEntry.isManual &&
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

        return titles.some((t: string) => {
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
            anilistStatus: "COMPLETED",
            progress: match.episodes || 0,
            totalEpisodes: match.episodes || null,
          })),
          status: "resolved",
        })
      }
    }
  }, [
    searchResults,
    currentIndex,
    currentEntry,
    searchQuery,
    updateEntry,
    isLoading,
  ])

  const handleToggleSelection = useCallback(
    (media: any) => {
      const isSelected = currentEntry.selections.some(
        (s: any) => s.id === media.id
      )
      let newSelections = [...currentEntry.selections]

      if (isSelected) {
        newSelections = newSelections.filter((s: any) => s.id !== media.id)
      } else {
        newSelections.push({
          id: media.id,
          title: media.title.english || media.title.romaji || "No Title",
          image: media.coverImage?.large || "",
          rating: currentEntry.rating,
          status: "pending",
          anilistStatus: "COMPLETED",
          progress: media.episodes || 0,
          totalEpisodes: media.episodes || null,
        })
      }

      updateEntry(currentIndex, {
        selections: newSelections,
        status: newSelections.length > 0 ? "resolved" : "pending",
        isManual: true,
      })
    },
    [currentEntry, currentIndex, updateEntry]
  )

  const handleAutoSelect = useCallback(() => {
    if (!searchResults.length || !currentEntry) return

    const normalizedQuery = normalizeTitle(searchQuery)
    const lowerQuery = searchQuery.toLowerCase().trim()

    const perfectMatches = searchResults.filter((media: any) => {
      const titles = [
        media.title.romaji,
        media.title.english,
        media.title.native,
      ].filter(Boolean)

      return titles.some((t: string) => {
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
          anilistStatus: "COMPLETED",
          progress: match.episodes || 0,
          totalEpisodes: match.episodes || null,
        })),
        status: "resolved",
        isManual: true,
      })
    }
  }, [searchResults, currentEntry, searchQuery, currentIndex, updateEntry])

  const handleSelectAll = useCallback(() => {
    if (!searchResults.length || !currentEntry) return

    const newSelections = searchResults.map((media: any) => ({
      id: media.id,
      title: media.title.english || media.title.romaji || "No Title",
      image: media.coverImage?.large || "",
      rating: currentEntry.rating,
      status: "pending",
      anilistStatus: "COMPLETED",
      progress: media.episodes || 0,
      totalEpisodes: media.episodes || null,
    }))

    updateEntry(currentIndex, {
      selections: newSelections,
      status: "resolved",
      isManual: true,
    })
  }, [searchResults, currentEntry, currentIndex, updateEntry])

  const handleClearAll = useCallback(() => {
    updateEntry(currentIndex, {
      selections: [],
      status: "pending",
      isManual: true,
    })
  }, [currentIndex, updateEntry])

  const updateSelectionRating = useCallback(
    (mediaId: number, val: number) => {
      const newSelections = currentEntry.selections.map((s: any) =>
        s.id === mediaId ? { ...s, rating: val } : s
      )
      updateEntry(currentIndex, {
        selections: newSelections,
        isManual: true,
      })
    },
    [currentEntry.selections, currentIndex, updateEntry]
  )

  const updateSelectionStatus = useCallback(
    (mediaId: number, val: any) => {
      const newSelections = currentEntry.selections.map((s: any) => {
        if (s.id !== mediaId) return s
        const updates: any = { anilistStatus: val }
        if (val === "COMPLETED" && s.totalEpisodes) {
          updates.progress = s.totalEpisodes
        }
        return { ...s, ...updates }
      })
      updateEntry(currentIndex, {
        selections: newSelections,
        isManual: true,
      })
    },
    [currentEntry.selections, currentIndex, updateEntry]
  )

  const updateSelectionProgress = useCallback(
    (mediaId: number, val: number) => {
      const newSelections = currentEntry.selections.map((s: any) =>
        s.id === mediaId ? { ...s, progress: val } : s
      )
      updateEntry(currentIndex, {
        selections: newSelections,
        isManual: true,
      })
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
      return currentEntry.selections.some((s: any) => s.id === mediaId)
    },
    [currentEntry.selections]
  )

  const getMediaRating = useCallback(
    (mediaId: number) => {
      const selection = currentEntry.selections.find(
        (s: any) => s.id === mediaId
      )
      return selection ? selection.rating : currentEntry.rating
    },
    [currentEntry.selections, currentEntry.rating]
  )

  const getMediaStatus = useCallback(
    (mediaId: number) => {
      const selection = currentEntry.selections.find(
        (s: any) => s.id === mediaId
      )
      return selection ? selection.anilistStatus : "COMPLETED"
    },
    [currentEntry.selections]
  )

  const getMediaProgress = useCallback(
    (mediaId: number) => {
      const selection = currentEntry.selections.find(
        (s: any) => s.id === mediaId
      )
      return selection ? selection.progress : 0
    },
    [currentEntry.selections]
  )

  const getMediaTotalEpisodes = useCallback(
    (mediaId: number) => {
      const selection = currentEntry.selections.find(
        (s: any) => s.id === mediaId
      )
      return selection ? selection.totalEpisodes : null
    },
    [currentEntry.selections]
  )

  return (
    <Card className="overflow-hidden rounded-none border shadow-2xl">
      <div className="space-y-6 border-b p-3 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <ReviewSidebar
                  entries={entries}
                  currentIndex={currentIndex}
                  onSelectEntry={onSelectEntry}
                  onUpdateRating={(idx, val) =>
                    updateEntry(idx, { rating: val })
                  }
                  isMobile
                />
              </div>

              {isEditingSearch ? (
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 text-base font-bold sm:h-12 sm:text-lg"
                  autoFocus
                  onBlur={() => setIsEditingSearch(false)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setIsEditingSearch(false)
                  }
                />
              ) : (
                <div className="group flex min-w-0 items-center gap-3">
                  <h3 className="truncate text-xl leading-none font-black tracking-tighter uppercase underline decoration-primary/30 underline-offset-8 sm:text-3xl">
                    {currentEntry.name}
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 sm:h-10 sm:w-10"
                        onClick={() => setIsEditingSearch(true)}
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Search</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
            <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase sm:text-[10px]">
              Source: {currentEntry.originalLine}
            </p>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
            <div className="flex items-center gap-2 rounded-none border border-primary/20 bg-primary/10 px-3 py-1.5 sm:px-4 sm:py-2">
              <Star className="h-3.5 w-3.5 fill-primary text-primary sm:h-4 sm:w-4" />
              <span className="text-[10px] font-black tracking-widest text-primary uppercase sm:text-xs">
                Score
              </span>
              <NumberInput
                value={currentEntry.rating}
                onChange={(val: number) =>
                  updateEntry(currentIndex, { rating: val, isManual: true })
                }
              />
              <span className="text-xs font-black opacity-70 sm:text-sm">/ 10</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-none border-primary/20 font-black tracking-tighter uppercase sm:h-10 sm:px-4"
            onClick={handleAutoSelect}
            disabled={isLoading || searchResults.length === 0}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-[10px] sm:text-xs">Auto Select</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-none border-primary/20 font-black tracking-tighter uppercase sm:h-10 sm:px-4"
            onClick={handleSelectAll}
            disabled={isLoading || searchResults.length === 0}
          >
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-[10px] sm:text-xs">Select All</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="col-span-2 h-9 gap-2 rounded-none border-destructive/20 font-black tracking-tighter uppercase hover:bg-destructive/10 sm:col-auto sm:h-10 sm:px-4"
            onClick={handleClearAll}
          >
            <RefreshCcw className="h-4 w-4 text-destructive" />
            <span className="text-[10px] sm:text-xs">Undo All</span>
          </Button>
        </div>
      </div>

      <div className="p-3 sm:p-8">
        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <MediaCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {searchResults.map((media: any, index: number) => (
                <motion.div
                  key={media.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.05,
                    ease: "easeOut" 
                  }}
                >
                  <MediaCard
                    media={media}
                    isSelected={isMediaSelected(media.id)}
                    onSelect={handleToggleSelection}
                    hasRelations={media.relations?.edges?.length > 0}
                    isExpanded={expandedMediaIds.has(media.id)}
                    onToggleExpand={toggleExpand}
                    rating={getMediaRating(media.id)}
                    onUpdateRating={updateSelectionRating}
                    status={getMediaStatus(media.id)}
                    onUpdateStatus={updateSelectionStatus}
                    progress={getMediaProgress(media.id)}
                    onUpdateProgress={updateSelectionProgress}
                    totalEpisodes={getMediaTotalEpisodes(media.id)}
                    isMediaSelected={isMediaSelected}
                    handleToggleSelection={handleToggleSelection}
                    getMediaRating={getMediaRating}
                    updateSelectionRating={updateSelectionRating}
                    onViewDetails={onViewDetails}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {searchResults.length === 0 && (
              <div className="space-y-8 rounded-none border-2 border-dashed bg-muted/5 py-24 text-center">
                <div className="relative inline-block">
                  <Layers className="mx-auto h-20 w-20 text-muted/30" />
                  <AlertCircle className="absolute -right-1 -bottom-1 h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-4">
                  <p className="text-3xl font-black tracking-tighter uppercase italic opacity-50">
                    Empty Sequence Detected
                  </p>
                  <p className="mx-auto max-w-xs text-sm font-medium text-muted-foreground">
                    No records found. Refine your query to re-initialize search.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 rounded-none border-primary/20 px-10 font-black hover:bg-primary/5"
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
  )
}
