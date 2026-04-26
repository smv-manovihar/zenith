import { useState, useEffect, useMemo, useRef, type FC } from "react"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import {
  queryAniList,
  SEARCH_ANIME_QUERY,
  SAVE_MEDIA_LIST_ENTRY,
} from "@/lib/anilist"
import { useProgress, type AniListStatus } from "@/components/ProgressProvider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search as SearchIcon,
  AlertCircle,
  Loader2,
  FilterX,
} from "lucide-react"
import { toast } from "sonner"
import { MediaCard } from "@/components/Review/MediaCard"
import { MediaDetailsDialog } from "@/components/Review/MediaDetailsDialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EditEntryDialog } from "@/components/Review/EditEntryDialog"
import { type AniListScoreFormat } from "@/lib/scoreFormat"

const getCurrentSeason = () => {
  const month = new Date().getMonth()
  if (month >= 0 && month <= 2) return "WINTER"
  if (month >= 3 && month <= 5) return "SPRING"
  if (month >= 6 && month <= 8) return "SUMMER"
  return "FALL"
}

const getCurrentYear = () => new Date().getFullYear()

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"]
const FORMATS = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"]
const SORTS = [
  { value: "POPULARITY_DESC", label: "Popularity" },
  { value: "SCORE_DESC", label: "Score" },
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "START_DATE_DESC", label: "Newest" },
  { value: "START_DATE", label: "Oldest" },
]

const Search: FC = () => {
  const { token, user } = useProgress()
  const queryClient = useQueryClient()

  const [globalSearch, setGlobalSearch] = useState("")
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState("")

  const [season, setSeason] = useState<string>(getCurrentSeason())
  const [seasonYear, setSeasonYear] = useState<string>(
    getCurrentYear().toString()
  )
  const [format, setFormat] = useState<string>("ALL")
  const [sort, setSort] = useState<string>("POPULARITY_DESC")

  const [infoEntry, setInfoEntry] = useState<any | null>(null)
  const [editEntry, setEditEntry] = useState<any | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalSearch(globalSearch)
    }, 500)
    return () => clearTimeout(timer)
  }, [globalSearch])

  const years = useMemo(() => {
    const currentYear = getCurrentYear() + 1
    return Array.from({ length: 40 }, (_, i) => (currentYear - i).toString())
  }, [])

  const handleClearFilters = () => {
    setSeason("ALL")
    setSeasonYear("ALL")
    setFormat("ALL")
    setSort("POPULARITY_DESC")
    setGlobalSearch("")
  }

  const queryVariables = useMemo(() => {
    const vars: any = {}
    if (debouncedGlobalSearch) vars.search = debouncedGlobalSearch
    if (season !== "ALL") vars.season = season
    if (seasonYear !== "ALL") vars.seasonYear = parseInt(seasonYear, 10)
    if (format !== "ALL") vars.format_in = [format]
    if (sort) vars.sort = [sort]
    return vars
  }, [debouncedGlobalSearch, season, seasonYear, format, sort])

  const {
    data: searchData,
    isLoading: isSearchLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["animeSearch", queryVariables],
    queryFn: async ({ pageParam = 1, signal }) => {
      const res = await queryAniList(
        SEARCH_ANIME_QUERY,
        { ...queryVariables, page: pageParam },
        token || undefined,
        3,
        signal
      )
      return { ...res, pageParam }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const pageInfo = lastPage?.data?.Page?.pageInfo
      return pageInfo?.hasNextPage ? lastPage.pageParam + 1 : undefined
    },
  })

  // Since queryAniList returns the response, let's make sure variables are available for getNextPageParam
  // Wait, queryAniList doesn't return the variables. I should probably adjust queryAniList or handle it here.
  // Actually, I'll modify the queryFn to return an object containing data and page number.

  const searchResults = useMemo(() => {
    return (
      searchData?.pages.flatMap((page) => page.data?.Page?.media || []) || []
    )
  }, [searchData])

  const handleUpdateStatus = async (mediaId: number, status: string) => {
    if (!token) {
      toast.error("You must be logged in to update your list.")
      return
    }
    try {
      await queryAniList(SAVE_MEDIA_LIST_ENTRY, { mediaId, status }, token)
      toast.success(`Updated status to ${status.replace(/_/g, " ")}`)
      queryClient.invalidateQueries({ queryKey: ["animeSearch"] })
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message)
    }
  }

  const handleUpdateRating = async (mediaId: number, score: number) => {
    if (!token) return
    try {
      await queryAniList(SAVE_MEDIA_LIST_ENTRY, { mediaId, score }, token)
      queryClient.invalidateQueries({ queryKey: ["animeSearch"] })
    } catch (err: any) {
      toast.error("Failed to update score: " + err.message)
    }
  }

  const handleUpdateProgress = async (mediaId: number, progress: number) => {
    if (!token) return
    try {
      await queryAniList(SAVE_MEDIA_LIST_ENTRY, { mediaId, progress }, token)
      queryClient.invalidateQueries({ queryKey: ["animeSearch"] })
    } catch (err: any) {
      toast.error("Failed to update progress: " + err.message)
    }
  }

  const handleSaveEdit = async (updates: {
    score: number
    status: string
    progress: number
  }) => {
    if (!token || !editEntry) return
    try {
      await queryAniList(
        SAVE_MEDIA_LIST_ENTRY,
        {
          mediaId: editEntry.id,
          status: updates.status,
          score: updates.score,
          progress: updates.progress,
        },
        token
      )
      toast.success(
        `Added ${editEntry.title.english || editEntry.title.romaji} to list!`
      )
      queryClient.invalidateQueries({ queryKey: ["animeSearch"] })
    } catch (err: any) {
      toast.error("Failed to add to list: " + err.message)
      throw err
    }
  }

  // --- Infinite Scroll Observer ---
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.5 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="mx-auto w-full max-w-6xl animate-in space-y-6 px-1 pb-24 duration-500 fade-in slide-in-from-bottom-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-black tracking-tighter text-transparent uppercase sm:text-4xl">
            Search AniList
          </h2>
          <p className="max-w-md text-xs font-bold text-muted-foreground/60 sm:text-sm">
            Discover and manage your AniList collection directly.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-none border border-border/50 bg-muted/20 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search anime titles..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="rounded-none border-primary/20 bg-background/50 pl-9 font-semibold transition-colors focus-visible:border-primary/50 focus-visible:ring-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Seasons</SelectItem>
              {SEASONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={seasonYear} onValueChange={setSeasonYear}>
            <SelectTrigger className="w-[90px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Formats</SelectItem>
              {FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            className="rounded-none text-muted-foreground hover:text-foreground"
            title="Clear Filters"
          >
            <FilterX className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="w-full pt-4">
        {isSearchLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold tracking-widest text-muted-foreground uppercase">
              <span>{searchResults.length} Results</span>
              {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            <div className="flex flex-col gap-6">
              {searchResults.map((media) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  isSelected={false}
                  onSelect={() => {}}
                  hideSelection={true}
                  showEditButton={!!media.mediaListEntry}
                  status={media.mediaListEntry?.status as AniListStatus}
                  progress={media.mediaListEntry?.progress}
                  rating={media.mediaListEntry?.score}
                  totalEpisodes={media.episodes}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateRating={handleUpdateRating}
                  onUpdateProgress={handleUpdateProgress}
                  onViewDetails={setInfoEntry}
                  onAdd={setEditEntry}
                  isMediaSelected={() => false}
                  handleToggleSelection={() => {}}
                  getMediaRating={() => 0}
                  updateSelectionRating={() => {}}
                />
              ))}
            </div>

            {/* Load More Indicator */}
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isFetchingNextPage ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
              ) : hasNextPage ? (
                <div className="h-4 w-4 animate-pulse rounded-full bg-primary/20" />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 opacity-30" />
            <p className="text-sm font-bold">
              No series found matching these filters.
            </p>
            <Button variant="link" onClick={handleClearFilters}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      <MediaDetailsDialog
        media={infoEntry}
        onClose={() => setInfoEntry(null)}
      />

      <EditEntryDialog
        isOpen={!!editEntry}
        media={editEntry}
        scoreFormat={
          (user?.scoreFormat as AniListScoreFormat) ?? "POINT_10_DECIMAL"
        }
        onSave={handleSaveEdit}
        onClose={() => setEditEntry(null)}
      />
    </div>
  )
}

export default Search
