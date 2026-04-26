import { useState, useEffect, useCallback, useRef, type FC } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Layers,
  Edit2,
  Star,
  AlertCircle,
  Sparkles,
  CheckSquare,
  RotateCcw,
  Tv,
  Clapperboard,
  Music,
  MonitorPlay,
  Search,
  Loader2,
  Undo2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { NumberInput } from "@/components/NumberInput"
import { queryAniList, SEARCH_ANIME_QUERY, rateLimiter } from "@/lib/anilist"
import { Storage } from "@/lib/storage"
import { normalizeTitle, cn } from "@/lib/utils"
import { ReviewSidebar } from "./ReviewSidebar"
import { MediaCardSkeleton } from "./MediaCardSkeleton"
import { toast } from "sonner"
import { MediaCard } from "./MediaCard"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDebounce } from "@/hooks/useDebounce"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SlidersHorizontal } from "lucide-react"

interface MediaSelectionAreaProps {
  currentEntry: any
  currentIndex: number
  updateEntry: (index: number, updates: any) => void
  onViewDetails: (media: any) => void
  entries: any[]
  onSelectEntry: (index: number) => void
  onClearFilters: () => void
}

const FORMATS = [
  { value: "TV", label: "TV Series", icon: Tv },
  { value: "TV_SHORT", label: "TV Short", icon: MonitorPlay },
  { value: "MOVIE", label: "Movie", icon: Clapperboard },
  { value: "OVA", label: "OVA", icon: Layers },
  { value: "ONA", label: "ONA", icon: Sparkles },
  { value: "SPECIAL", label: "Special", icon: Star },
  { value: "MUSIC", label: "Music", icon: Music },
]

const SORTS = [
  { value: "POPULARITY_DESC", label: "Popularity" },
  { value: "SCORE_DESC", label: "Score" },
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "START_DATE_DESC", label: "Newest" },
  { value: "START_DATE", label: "Oldest" },
]

interface FilterButtonProps {
  format: (typeof FORMATS)[0]
  isActive: boolean
  onClick: () => void
  className?: string
}

const FilterButton: FC<FilterButtonProps> = ({
  format,
  isActive,
  onClick,
  className,
}) => {
  const Icon = format.icon
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-10 gap-2 rounded-none border-primary/20 font-black tracking-tight uppercase transition-all duration-300",
        isActive
          ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]"
          : "bg-background hover:border-primary/40 hover:bg-primary/5",
        className
      )}
    >
      <Icon
        className={cn("h-3.5 w-3.5", isActive ? "opacity-100" : "opacity-50")}
      />
      {format.label}
    </Button>
  )
}

export const MediaSelectionArea: FC<MediaSelectionAreaProps> = ({
  currentEntry,
  currentIndex,
  updateEntry,
  onViewDetails,
  entries,
  onSelectEntry,
  onClearFilters,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const originalName = useRef("")
  const [selectedFormats, setSelectedFormats] = useState<string[]>(() => {
    const saved = Storage.getPreferredFormats()
    return saved ? JSON.parse(saved) : FORMATS.map((f) => f.value)
  })
  const [sort, setSort] = useState<string>("POPULARITY_DESC")
  const [appliedFilters, setAppliedFilters] = useState({
    query: searchQuery,
    formats: selectedFormats,
    sort: sort,
  })

  const isFiltersDirty =
    searchQuery !== appliedFilters.query ||
    JSON.stringify(selectedFormats) !==
      JSON.stringify(appliedFilters.formats) ||
    sort !== appliedFilters.sort

  const handleSearch = useCallback(() => {
    if (rateLimiter.isRateLimited) {
      const seconds = Math.ceil(rateLimiter.waitTime / 1000)
      toast.warning(
        `AniList Rate Limit: Please wait ${seconds}s before searching again.`,
        {
          id: "rate-limit-toast",
        }
      )
      return
    }
    setAppliedFilters({
      query: searchQuery,
      formats: selectedFormats,
      sort: sort,
    })
  }, [searchQuery, selectedFormats, sort, rateLimiter])

  // Auto-apply search when entry changes
  useEffect(() => {
    if (currentEntry) {
      setSearchQuery(currentEntry.name)
      originalName.current = currentEntry.name
      setAppliedFilters({
        query: currentEntry.name,
        formats: selectedFormats,
        sort: sort,
      })
    }
  }, [currentIndex]) // Only on index change to preserve "original" name for the current entry

  const toggleFormat = useCallback((formatValue: string) => {
    setSelectedFormats((prev) => {
      // If we are currently in "All Formats" mode (empty array),
      // clicking a format should select ONLY that format.
      if (prev.length === 0) {
        return [formatValue]
      }

      const next = prev.includes(formatValue)
        ? prev.filter((f) => f !== formatValue)
        : [...prev, formatValue]

      // If we manually selected every single format OR deselected everything,
      // reset to the "All Formats" state (empty array).
      if (
        next.length === 0 ||
        next.length === FORMATS.map((f) => f.value).length
      ) {
        return []
      }
      return next
    })
  }, [])

  // Persist format preferences
  useEffect(() => {
    Storage.setPreferredFormats(selectedFormats)
  }, [selectedFormats])
  const [isEditingSearch, setIsEditingSearch] = useState(false)
  const [expandedMediaIds, setExpandedMediaIds] = useState<Set<number>>(
    new Set()
  )
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (currentEntry) {
      setSearchQuery(currentEntry.name)
    }
  }, [currentIndex, currentEntry?.name])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "animeSearch",
      appliedFilters.query,
      appliedFilters.formats,
      appliedFilters.sort,
    ],
    queryFn: ({ signal }) =>
      queryAniList(
        SEARCH_ANIME_QUERY,
        {
          search: appliedFilters.query,
          format_in:
            appliedFilters.formats.length > 0 &&
            appliedFilters.formats.length < FORMATS.length
              ? appliedFilters.formats
              : undefined,
          sort: appliedFilters.sort ? [appliedFilters.sort] : undefined,
        },
        undefined,
        3,
        signal
      ),
    enabled: !!appliedFilters.query,
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
            title:
              match.title.english ||
              match.title.romaji ||
              match.title.native ||
              "No Title",
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
          title:
            media.title.english ||
            media.title.romaji ||
            media.title.native ||
            "No Title",
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
          title:
            match.title.english ||
            match.title.romaji ||
            match.title.native ||
            "No Title",
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
      title:
        media.title.english ||
        media.title.romaji ||
        media.title.native ||
        "No Title",
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
      const updates: any = { selections: newSelections, isManual: true }
      // If there's only one selection, keep entry rating in sync
      if (newSelections.length === 1) {
        updates.rating = val
      }
      updateEntry(currentIndex, updates)
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
      <div className="space-y-5 border-b p-4 sm:p-6">
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
                  onClearFilters={onClearFilters}
                />
              </div>

              {isEditingSearch ? (
                <div className="relative flex min-w-0 flex-1 items-center">
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      const newVal = e.target.value
                      setSearchQuery(newVal)
                      updateEntry(currentIndex, { name: newVal })
                    }}
                    className="h-10 pr-10 text-base font-bold sm:h-11"
                    autoFocus
                    onBlur={() => {
                      if (!searchQuery.trim()) {
                        const restored = originalName.current
                        setSearchQuery(restored)
                        updateEntry(currentIndex, { name: restored })
                      }
                      setIsEditingSearch(false)
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setIsEditingSearch(false)
                    }
                  />
                  {searchQuery !== originalName.current && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        const restored = originalName.current
                        setSearchQuery(restored)
                        updateEntry(currentIndex, { name: restored })
                      }}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="group flex min-w-0 flex-1 items-center gap-2">
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
            <p className="font-mono text-xs tracking-widest break-all text-muted-foreground uppercase opacity-70">
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
                onChange={(val: number) => {
                  const newSelections = currentEntry.selections.map(
                    (s: any) => ({
                      ...s,
                      rating: val,
                    })
                  )
                  updateEntry(currentIndex, {
                    rating: val,
                    selections: newSelections,
                    isManual: true,
                  })
                }}
              />
              <span className="text-xs font-black opacity-100 sm:text-sm">
                / 10
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Filters & Search */}
        <div className="flex flex-col gap-4 pt-2 md:flex-row md:items-center">
          {/* Desktop Filters (hidden on mobile) */}
          <div className="hidden flex-1 flex-wrap items-center gap-3 md:flex">
            <div className="flex flex-wrap items-center gap-2">
              {FORMATS.map((format) => {
                const isActive =
                  selectedFormats.length === 0 ||
                  selectedFormats.includes(format.value)
                return (
                  <FilterButton
                    key={format.value}
                    format={format}
                    isActive={isActive}
                    onClick={() => toggleFormat(format.value)}
                  />
                )
              })}
            </div>

            <div className="h-8 w-px bg-border/50" />

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-10 w-[140px] rounded-none border-primary/20 bg-background font-black tracking-tight uppercase">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-primary/20 bg-background font-black uppercase shadow-2xl">
                  {SORTS.map((s) => (
                    <SelectItem
                      key={s.value}
                      value={s.value}
                      className="rounded-none focus:bg-primary/10 focus:text-primary"
                    >
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSearch}
              disabled={!isFiltersDirty || isFetching}
              className={cn(
                "h-10 gap-2 rounded-none px-6 font-black tracking-tighter uppercase transition-all",
                isFiltersDirty
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                  : "bg-muted text-muted-foreground opacity-50"
              )}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>Apply</span>
            </Button>
          </div>

          {/* Mobile Filters Drawer (visible only on mobile) */}
          <div className="flex md:hidden">
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 w-full justify-between gap-2 rounded-none border-primary/20 bg-background font-black tracking-tight uppercase",
                    isFiltersDirty &&
                      "border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <span>Filters & Sort</span>
                  </div>
                  {isFiltersDirty ? (
                    <Badge className="animate-pulse rounded-none bg-primary font-black">
                      Pending Changes
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-1.5 opacity-40">
                      {sort !== "POPULARITY_DESC" ||
                      selectedFormats.length > 0 ? (
                        <>
                          {sort !== "POPULARITY_DESC" && (
                            <span className="text-[10px]">
                              {SORTS.find((s) => s.value === sort)?.label}
                            </span>
                          )}
                          {sort !== "POPULARITY_DESC" &&
                            selectedFormats.length > 0 && (
                              <div className="h-1 w-1 rounded-full bg-border" />
                            )}
                          {selectedFormats.length > 0 && (
                            <span className="text-[10px]">
                              {selectedFormats.length} Formats
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px]">Default</span>
                      )}
                    </div>
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="min-h-[96vh] rounded-t-none border-t-primary/20 bg-background pb-8 outline-hidden">
                <DrawerHeader className="border-b border-border/50 pb-6 text-left">
                  <DrawerTitle className="text-2xl font-black tracking-tighter uppercase">
                    Refine Search
                  </DrawerTitle>
                  <DrawerDescription className="font-bold text-muted-foreground/60 uppercase">
                    Adjust formats and sorting to find the right entry.
                  </DrawerDescription>
                </DrawerHeader>

                <div className="scrollbar-thin scrollbar-thumb-primary/10 flex-1 space-y-8 overflow-y-auto p-6">
                  {/* Formats Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black tracking-widest text-muted-foreground uppercase">
                        Media Formats
                      </h4>
                      {selectedFormats.length > 0 && (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-[10px] font-black text-primary uppercase"
                          onClick={() => setSelectedFormats([])}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {FORMATS.map((format) => {
                        const isActive =
                          selectedFormats.length === 0 ||
                          selectedFormats.includes(format.value)
                        return (
                          <FilterButton
                            key={format.value}
                            format={format}
                            isActive={isActive}
                            onClick={() => toggleFormat(format.value)}
                            className="h-12 w-full justify-start text-xs"
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Sort Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black tracking-widest text-muted-foreground uppercase">
                      Sort Results By
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {SORTS.map((s) => (
                        <Button
                          key={s.value}
                          variant={sort === s.value ? "default" : "outline"}
                          className={cn(
                            "h-12 justify-start rounded-none border-primary/20 font-black uppercase",
                            sort === s.value &&
                              "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                          )}
                          onClick={() => setSort(s.value)}
                        >
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <DrawerFooter className="pb-0">
                  <DrawerClose asChild>
                    <Button
                      onClick={handleSearch}
                      disabled={isFetching}
                      className={cn(
                        "h-14 w-full gap-3 rounded-none text-base font-black tracking-tighter uppercase transition-all",
                        isFiltersDirty
                          ? "bg-primary text-primary-foreground shadow-[0_0_25px_rgba(var(--primary),0.4)]"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isFetching ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Search className="h-5 w-5" />
                      )}
                      <span>{isFiltersDirty ? "Apply & Search" : "Close"}</span>
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        {/* Row 3: Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-4 sm:gap-3">
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-none border-destructive/20 font-black tracking-tighter uppercase hover:bg-destructive/10"
              onClick={handleClearAll}
            >
              <RotateCcw className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs sm:text-sm">Undo All</span>
            </Button>
            {currentEntry.selections.length > 0 && (
              <Badge className="h-9 rounded-none border border-primary/20 bg-primary/5 px-4 text-sm font-black text-primary shadow-none">
                {currentEntry.selections.length}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <MediaCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
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
