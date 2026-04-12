import { useState, useEffect, useCallback, type FC } from "react"
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
import { useDebounce } from "@/hooks/useDebounce"

interface MediaSelectionAreaProps {
  currentEntry: any
  currentIndex: number
  updateEntry: (index: number, updates: any) => void
  onViewDetails: (media: any) => void
  entries: any[]
  onSelectEntry: (index: number) => void
}

export const MediaSelectionArea: FC<MediaSelectionAreaProps> = ({
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
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (currentEntry) {
      setSearchQuery(currentEntry.name)
      setIsEditingSearch(false)
    }
  }, [currentIndex, currentEntry?.name])

  const { data, isLoading } = useQuery({
    queryKey: ["animeSearch", debouncedSearchQuery],
    queryFn: ({ signal }) =>
      queryAniList(
        SEARCH_ANIME_QUERY,
        { search: debouncedSearchQuery },
        undefined,
        3,
        signal
      ),
    enabled: !!debouncedSearchQuery,
  })

  const searchResults = data?.data?.Page?.media || []

  useEffect(() => {
    if (
      searchResults.length > 0 &&
      !isLoading &&
      currentEntry &&
      currentEntry.selections.length === 0 &&
      !currentEntry.isManual &&
      normalizeTitle(debouncedSearchQuery) === normalizeTitle(currentEntry.name)
    ) {
      const normalizedQuery = normalizeTitle(debouncedSearchQuery)
      const lowerQuery = debouncedSearchQuery.toLowerCase().trim()

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
    debouncedSearchQuery,
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
      updateEntry(currentIndex, { selections: newSelections, isManual: true })
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
      updateEntry(currentIndex, { selections: newSelections, isManual: true })
    },
    [currentEntry.selections, currentIndex, updateEntry]
  )

  const updateSelectionProgress = useCallback(
    (mediaId: number, val: number) => {
      const newSelections = currentEntry.selections.map((s: any) =>
        s.id === mediaId ? { ...s, progress: val } : s
      )
      updateEntry(currentIndex, { selections: newSelections, isManual: true })
    },
    [currentEntry.selections, currentIndex, updateEntry]
  )

  const toggleExpand = useCallback((mediaId: number) => {
    setExpandedMediaIds((prev) => {
      const next = new Set(prev)
      if (next.has(mediaId)) next.delete(mediaId)
      else next.add(mediaId)
      return next
    })
  }, [])

  const isMediaSelected = useCallback(
    (mediaId: number) =>
      currentEntry.selections.some((s: any) => s.id === mediaId),
    [currentEntry.selections]
  )

  const getMediaRating = useCallback(
    (mediaId: number) => {
      const sel = currentEntry.selections.find((s: any) => s.id === mediaId)
      return sel ? sel.rating : currentEntry.rating
    },
    [currentEntry.selections, currentEntry.rating]
  )

  const getMediaStatus = useCallback(
    (mediaId: number) => {
      const sel = currentEntry.selections.find((s: any) => s.id === mediaId)
      return sel ? sel.anilistStatus : "COMPLETED"
    },
    [currentEntry.selections]
  )

  const getMediaProgress = useCallback(
    (mediaId: number) => {
      const sel = currentEntry.selections.find((s: any) => s.id === mediaId)
      return sel ? sel.progress : 0
    },
    [currentEntry.selections]
  )

  const getMediaTotalEpisodes = useCallback(
    (mediaId: number) => {
      const sel = currentEntry.selections.find((s: any) => s.id === mediaId)
      return sel ? sel.totalEpisodes : null
    },
    [currentEntry.selections]
  )

  return (
    <Card className="overflow-hidden rounded-none border shadow-2xl">
      {/* ── Header ── */}
      <div className="space-y-5 border-b p-4 sm:p-6 lg:p-8">
        {/* Row 1: title + score */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: sidebar trigger + title block */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex min-w-0 items-center gap-2">
              {/* Mobile sidebar trigger */}
              <div className="shrink-0 lg:hidden">
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
                  className="h-10 text-base font-bold sm:h-11"
                  autoFocus
                  onBlur={() => setIsEditingSearch(false)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && setIsEditingSearch(false)
                  }
                />
              ) : (
                <div className="group flex min-w-0 flex-1 items-center gap-2">
                  {/*
                    Typography fix:
                    - Base: text-lg  (18px) — readable on phones
                    - sm:   text-2xl (24px) — tablets
                    - lg:   text-3xl (30px) — desktops
                    Previously jumped straight text-xl → sm:text-3xl, skipping tablets.
                    Also switched from `truncate` to `break-words` so long titles
                    wrap instead of silently vanishing off-screen on narrow viewports.
                  */}
                  <h3 className="text-lg font-black tracking-tighter wrap-break-word uppercase underline decoration-primary/30 underline-offset-8 sm:text-2xl lg:text-3xl">
                    {currentEntry.name}
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setIsEditingSearch(true)}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Search</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            {/*
              Typography fix:
              - Was text-[9px] / sm:text-[10px] — below browser minimum legible size
              - Now text-xs (12px) everywhere — minimum for mono labels
              - tracking-widest preserved for the uppercase mono aesthetic
            */}
            <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Source: {currentEntry.originalLine}
            </p>
          </div>

          {/* Right: Score badge */}
          {/*
            Responsive fix:
            - On mobile the score badge sits below the title (flex-col default).
            - On sm+ it floats to the right as a column (sm:flex-col sm:items-end).
            - Padding uses consistent scale: px-3 py-1.5 → sm:px-4 sm:py-2
          */}
          <div className="flex shrink-0 items-center sm:flex-col sm:items-end">
            <div className="flex items-center gap-2 rounded-none border border-primary/20 bg-primary/10 px-3 py-1.5 sm:px-4 sm:py-2">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              {/*
                Typography fix:
                - Was text-[10px] sm:text-xs — inconsistent, overly small on mobile
                - Now text-xs everywhere (12px) — minimum for a legible label
              */}
              <span className="text-xs font-black tracking-widest text-primary uppercase">
                Score
              </span>
              <NumberInput
                value={currentEntry.rating}
                onChange={(val: number) =>
                  updateEntry(currentIndex, { rating: val, isManual: true })
                }
              />
              <span className="text-xs font-black opacity-70 sm:text-sm">
                / 10
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Quick Actions */}
        {/*
          Responsive fix:
          - Was: grid grid-cols-2 gap-2 → sm:flex sm:flex-wrap (abrupt jump)
          - Now: always flex-wrap so it adapts fluidly at every width.
          - "Undo All" no longer needs col-span-2 hack.
          - Button text: was text-[10px] sm:text-xs — now text-xs sm:text-sm for
            proper readability and consistent scale with the rest of the UI.
        */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-none border-primary/20 font-black tracking-tighter uppercase"
            onClick={handleAutoSelect}
            disabled={isLoading || searchResults.length === 0}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs sm:text-sm">Auto Select</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-none border-primary/20 font-black tracking-tighter uppercase"
            onClick={handleSelectAll}
            disabled={isLoading || searchResults.length === 0}
          >
            <CheckSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs sm:text-sm">Select All</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-none border-destructive/20 font-black tracking-tighter uppercase hover:bg-destructive/10"
            onClick={handleClearAll}
          >
            <RefreshCcw className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs sm:text-sm">Undo All</span>
          </Button>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="p-4 sm:p-6 lg:p-8">
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
                    ease: "easeOut",
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
              <div className="space-y-8 rounded-none border-2 border-dashed bg-muted/5 py-16 text-center sm:py-24">
                <div className="relative inline-block">
                  <Layers className="mx-auto h-16 w-16 text-muted/30 sm:h-20 sm:w-20" />
                  <AlertCircle className="absolute -right-1 -bottom-1 h-7 w-7 text-destructive sm:h-8 sm:w-8" />
                </div>
                <div className="space-y-3">
                  {/*
                    Typography fix:
                    - Was text-3xl flat — too large on mobile (30px with tracking-tighter)
                    - Now text-xl sm:text-2xl lg:text-3xl — scales with viewport
                  */}
                  <p className="text-xl font-black tracking-tighter uppercase italic opacity-50 sm:text-2xl lg:text-3xl">
                    Empty Sequence Detected
                  </p>
                  {/*
                    Typography fix:
                    - Was `text-sm` flat — fine, but max-w-xs is very tight on desktop
                    - Now max-w-sm sm:max-w-xs so it has breathing room on small screens
                    - text-sm preserved (14px is appropriate for secondary body copy)
                  */}
                  <p className="mx-auto max-w-sm text-sm font-medium text-muted-foreground sm:max-w-xs">
                    No records found. Refine your query to re-initialize search.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-none border-primary/20 px-8 font-black tracking-tighter uppercase hover:bg-primary/5 sm:h-14 sm:px-10"
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
