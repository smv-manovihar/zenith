import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  memo,
  type FC,
} from "react"
import { useWindowVirtualizer } from "@tanstack/react-virtual"
import { useNavigate } from "react-router-dom"
import { useProgress } from "@/components/ProgressProvider"
import {
  queryAniList,
  GET_MEDIA_LIST_COLLECTION,
  SAVE_MEDIA_LIST_ENTRY,
  DELETE_MEDIA_LIST_ENTRY,
  UPDATE_USER_SETTINGS,
} from "@/lib/anilist"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  RefreshCcw,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Download,
  Check,
  ChevronDown,
  MoreVertical,
  FilterX,
} from "lucide-react"
import { toast } from "sonner"
import {
  type AniListScoreFormat,
  formatScoreDisplay,
  SCORE_FORMAT_OPTIONS,
} from "@/lib/scoreFormat"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { MediaDetailsDialog } from "@/components/Review/MediaDetailsDialog"
import { EditEntryDialog } from "@/components/Review/EditEntryDialog"

// ── Types ─────────────────────────────────────────────────────────────────
interface ListEntry {
  id: number
  score: number
  status: string
  progress: number
  updatedAt?: number
  createdAt?: number
  startedAt?: { year?: number; month?: number; day?: number }
  completedAt?: { year?: number; month?: number; day?: number }
  media: {
    id: number
    idMal?: number | null
    title: { romaji: string; english?: string }
    coverImage: { large: string; medium: string }
    bannerImage?: string
    description?: string
    format?: string
    status?: string
    episodes?: number
    duration?: number
    averageScore?: number
    popularity?: number
    trending?: number
    startDate?: { year?: number; month?: number; day?: number }
    season?: string
    seasonYear?: number
    genres?: string[]
    studios?: { nodes: { name: string; isAnimationStudio: boolean }[] }
    siteUrl?: string
  }
}

interface ListGroup {
  name: string
  status: string
  entries: ListEntry[]
}

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "CURRENT", label: "Watching" },
  { key: "COMPLETED", label: "Completed" },
  { key: "PLANNING", label: "Planning" },
  { key: "PAUSED", label: "Paused" },
  { key: "DROPPED", label: "Dropped" },
  { key: "REPEATING", label: "Repeating" },
] as const

const STATUS_LABELS: Record<string, string> = {
  CURRENT: "Watching",
  COMPLETED: "Completed",
  PLANNING: "Planning",
  PAUSED: "Paused",
  DROPPED: "Dropped",
  REPEATING: "Repeating",
}

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"]
const FORMATS = ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"]
const SORTS = [
  { value: "UPDATED_AT_DESC", label: "Recently Updated" },
  { value: "CREATED_AT_DESC", label: "Recently Added" },
  { value: "POPULARITY_DESC", label: "Popularity" },
  { value: "SCORE_DESC", label: "AniList Score" },
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "START_DATE_DESC", label: "Newest Release" },
  { value: "START_DATE", label: "Oldest Release" },
  { value: "TITLE_ROMAJI", label: "Title (A-Z)" },
]


// ── Entry Row ─────────────────────────────────────────────────────────────
interface EntryRowProps {
  entry: ListEntry
  scoreFormat: AniListScoreFormat
  onEdit: (e: ListEntry) => void
  onDelete: (e: ListEntry) => void
  onInfo: (e: ListEntry) => void
  deleting: boolean
}

const EntryRow: FC<EntryRowProps> = ({
  entry,
  scoreFormat,
  onEdit,
  onDelete,
  onInfo,
  deleting,
}) => {
  const title = entry.media.title.english ?? entry.media.title.romaji
  const studio = entry.media.studios?.nodes?.find((n) => n.isAnimationStudio)

  return (
    <div className="group flex items-center gap-3 border-b border-border/50 p-3 transition-colors last:border-0 hover:bg-muted/30">
      {/* Clickable Area for Info */}
      <button
        onClick={() => onInfo(entry)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus:outline-none"
      >
        {/* Cover */}
        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-none bg-muted ring-1 ring-border">
          <img
            src={entry.media.coverImage.medium}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            alt=""
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] leading-tight font-bold text-foreground transition-colors group-hover:text-primary">
            {title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-primary">
              {formatScoreDisplay(entry.score, scoreFormat)}
            </span>
            <span className="rounded-none bg-primary/10 px-1 py-0 text-[9px] font-black tracking-widest text-primary uppercase">
              {STATUS_LABELS[entry.status] || entry.status}
            </span>
            {entry.media.episodes && (
              <span className="text-[10px] text-muted-foreground">
                {entry.progress}/{entry.media.episodes} eps
              </span>
            )}
            {studio && (
              <span className="hidden text-[10px] text-muted-foreground/60 sm:inline">
                {studio.name}
              </span>
            )}
          </div>
          {/* Genres — desktop only */}
          {entry.media.genres && entry.media.genres.length > 0 && (
            <div className="mt-1 hidden gap-1 sm:flex">
              {entry.media.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="rounded-none border border-primary/10 bg-primary/5 px-1.5 py-px text-[9px] font-bold text-primary/70"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Desktop View */}
        <div className="hidden items-center gap-1 sm:flex">
          {entry.media.siteUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
              asChild
            >
              <a
                href={entry.media.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(entry)}
            className="h-7 w-7 rounded-none border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(entry)}
            disabled={deleting}
            className="h-7 w-7 rounded-none border border-destructive/20 text-destructive/50 transition-colors hover:border-destructive/50 hover:text-destructive disabled:opacity-30"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Mobile View */}
        <div className="flex items-center gap-1 sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(entry)}
            className="h-8 w-8 rounded-none border border-border text-muted-foreground"
          >
            <Edit2 className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-none border border-border text-muted-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none">
              {entry.media.siteUrl && (
                <DropdownMenuItem asChild>
                  <a
                    href={entry.media.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center gap-2"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>View on AniList</span>
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(entry)}
                disabled={deleting}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Remove Entry</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

const MemoizedEntryRow = memo(EntryRow, (prev, next) => {
  return (
    prev.entry.id === next.entry.id &&
    prev.deleting === next.deleting &&
    prev.scoreFormat === next.scoreFormat &&
    prev.entry.score === next.entry.score &&
    prev.entry.progress === next.entry.progress &&
    prev.entry.status === next.entry.status
  )
})

// ── Main Page ─────────────────────────────────────────────────────────────
const ListManagement: FC = () => {
  const { token, user } = useProgress()
  const navigate = useNavigate()
  const serverScoreFormat =
    (user?.scoreFormat as AniListScoreFormat) ?? "POINT_10_DECIMAL"
  const [localScoreFormat, setLocalScoreFormat] =
    useState<AniListScoreFormat>(serverScoreFormat)

  const [lists, setLists] = useState<ListGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("CURRENT")
  const [search, setSearch] = useState("")
  const [editEntry, setEditEntry] = useState<ListEntry | null>(null)
  const [infoEntry, setInfoEntry] = useState<ListEntry | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<ListEntry | null>(
    null
  )
  const [fetched, setFetched] = useState(false)
  const [isUpdatingFormat, setIsUpdatingFormat] = useState(false)
  const { setUser } = useProgress()

  const [season, setSeason] = useState<string>("ALL")
  const [seasonYear, setSeasonYear] = useState<string>("ALL")
  const [format, setFormat] = useState<string>("ALL")
  const [sort, setSort] = useState<string>("UPDATED_AT_DESC")

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear() + 1
    return Array.from({ length: 40 }, (_, i) => (currentYear - i).toString())
  }, [])

  const handleClearFilters = () => {
    setSeason("ALL")
    setSeasonYear("ALL")
    setFormat("ALL")
    setSort("UPDATED_AT_DESC")
    setSearch("")
  }

  // Sync local format when server format changes
  useEffect(() => {
    setLocalScoreFormat(serverScoreFormat)
  }, [serverScoreFormat])

  if (!token) {
    navigate("/")
    return null
  }

  const handleScoreFormatChange = (newFormat: AniListScoreFormat) => {
    setLocalScoreFormat(newFormat)
  }

  const handleScoreFormatUpdate = async () => {
    if (!token || !user || localScoreFormat === serverScoreFormat) return
    setIsUpdatingFormat(true)
    try {
      await queryAniList(
        UPDATE_USER_SETTINGS,
        { scoreFormat: localScoreFormat },
        token
      )
      toast.success(`Score format updated to ${localScoreFormat} on AniList`)
      setUser({
        ...user,
        scoreFormat: localScoreFormat,
        mediaListOptions: {
          ...user.mediaListOptions,
          scoreFormat: localScoreFormat,
        },
      })
    } catch (err: any) {
      toast.error("Failed to update settings: " + err.message)
    } finally {
      setIsUpdatingFormat(false)
    }
  }

  const fetchList = useCallback(async () => {
    if (!user || !user.id) return
    setLoading(true)
    try {
      const userId = user.id

      const res = await queryAniList(
        GET_MEDIA_LIST_COLLECTION,
        { userId, type: "ANIME" },
        token
      )
      const rawLists: ListGroup[] = res.data?.MediaListCollection?.lists ?? []
      // Sort groups by STATUS_TABS order
      const tabOrder = STATUS_TABS.map((t) => t.key).filter(
        (k) => k !== "ALL"
      ) as string[]
      const sorted = [...rawLists].sort(
        (a, b) =>
          (tabOrder.indexOf(a.status) ?? 99) -
          (tabOrder.indexOf(b.status) ?? 99)
      )
      setLists(sorted)
      setFetched(true)
    } catch (err: any) {
      toast.error("Failed to load your list: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [token, user])

  // Auto-fetch on mount
  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeGroupEntries = useMemo(() => {
    if (activeTab === "ALL") {
      return lists.flatMap((l) => l.entries)
    }
    return lists.find((l) => l.status === activeTab)?.entries ?? []
  }, [lists, activeTab])

  const filteredEntries = useMemo(() => {
    let result = activeGroupEntries

    // 1. Filter by search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          (e.media.title.english ?? "").toLowerCase().includes(q) ||
          e.media.title.romaji.toLowerCase().includes(q)
      )
    }

    // 2. Filter by Season
    if (season !== "ALL") {
      result = result.filter((e) => e.media.season === season)
    }

    // 3. Filter by Year
    if (seasonYear !== "ALL") {
      const y = parseInt(seasonYear, 10)
      result = result.filter((e) => e.media.seasonYear === y)
    }

    // 4. Filter by Format
    if (format !== "ALL") {
      result = result.filter((e) => e.media.format === format)
    }

    // 5. Sorting
    return [...result].sort((a, b) => {
      switch (sort) {
        case "UPDATED_AT_DESC":
          return (b.updatedAt || 0) - (a.updatedAt || 0)
        case "CREATED_AT_DESC":
          return (b.createdAt || 0) - (a.createdAt || 0)
        case "POPULARITY_DESC":
          return (b.media.popularity || 0) - (a.media.popularity || 0)
        case "SCORE_DESC":
          return (b.media.averageScore || 0) - (a.media.averageScore || 0)
        case "TRENDING_DESC":
          return (b.media.trending || 0) - (a.media.trending || 0)
        case "TITLE_ROMAJI":
          return a.media.title.romaji.localeCompare(b.media.title.romaji)
        case "START_DATE_DESC": {
          const dateA = a.media.startDate?.year
            ? a.media.startDate.year * 10000 +
              (a.media.startDate.month || 0) * 100 +
              (a.media.startDate.day || 0)
            : 0
          const dateB = b.media.startDate?.year
            ? b.media.startDate.year * 10000 +
              (b.media.startDate.month || 0) * 100 +
              (b.media.startDate.day || 0)
            : 0
          return dateB - dateA
        }
        case "START_DATE": {
          const dateA = a.media.startDate?.year
            ? a.media.startDate.year * 10000 +
              (a.media.startDate.month || 0) * 100 +
              (a.media.startDate.day || 0)
            : 99999999
          const dateB = b.media.startDate?.year
            ? b.media.startDate.year * 10000 +
              (b.media.startDate.month || 0) * 100 +
              (b.media.startDate.day || 0)
            : 99999999
          return dateA - dateB
        }
        default:
          return 0
      }
    })
  }, [activeGroupEntries, search, season, seasonYear, format, sort])

  // --- Window Virtualization Setup ---
  const listRef = useRef<HTMLDivElement>(null)

  // We need to know how far down the page the list starts
  const [listOffset, setListOffset] = useState(0)

  // Measure the offset once the component mounts or the layout changes
  useEffect(() => {
    if (listRef.current) {
      setListOffset(listRef.current.offsetTop)
    }
  }, [
    filteredEntries.length,
    activeTab,
    season,
    seasonYear,
    format,
    sort,
    fetched,
  ])

  const rowVirtualizer = useWindowVirtualizer({
    count: filteredEntries.length,
    estimateSize: () => 81, // Approximate height of your EntryRow
    overscan: 5,
    scrollMargin: listOffset, // Tells the virtualizer about the header above the list
  })

  const handleSave = async (
    listEntryId: number,
    updates: { score: number; status: string; progress: number }
  ) => {
    try {
      await queryAniList(
        SAVE_MEDIA_LIST_ENTRY,
        {
          mediaId: lists
            .flatMap((l) => l.entries)
            .find((e) => e.id === listEntryId)?.media.id,
          status: updates.status,
          score: updates.score,
          progress: updates.progress,
        },
        token
      )
      setLists((prev) =>
        prev.map((group) => ({
          ...group,
          entries: group.entries.map((e) =>
            e.id === listEntryId
              ? {
                  ...e,
                  score: updates.score,
                  status: updates.status,
                  progress: updates.progress,
                }
              : e
          ),
        }))
      )
      toast.success("Entry updated!")
    } catch (err: any) {
      toast.error("Failed to save: " + err.message)
    }
  }

  const handleDelete = useCallback(
    async (entry: ListEntry) => {
      setDeletingId(entry.id)
      try {
        await queryAniList(DELETE_MEDIA_LIST_ENTRY, { id: entry.id }, token)
        setLists((prev) =>
          prev.map((group) => ({
            ...group,
            entries: group.entries.filter((e) => e.id !== entry.id),
          }))
        )
        toast.success("Entry removed.")
      } catch (err: any) {
        toast.error("Failed to delete: " + err.message)
      } finally {
        setDeletingId(null)
        setDeleteConfirmEntry(null)
      }
    },
    [token]
  )

  const totalCount = lists.reduce((acc, l) => acc + l.entries.length, 0)

  return (
    <div className="mx-auto w-full max-w-5xl animate-in space-y-6 px-1 pb-24 duration-500 fade-in slide-in-from-bottom-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">
              My AniList
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">
                {fetched ? `${totalCount} entries` : "Loading your list…"}
              </p>
            </div>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-nowrap sm:items-center">
          <div className="col-span-2 flex items-center justify-between gap-1.5 rounded-none border border-primary/10 bg-primary/5 px-2 py-2 transition-all hover:border-primary/20 sm:col-auto sm:justify-start sm:py-0.5">
            <span className="text-[8px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
              Format
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isUpdatingFormat}>
                <button className="group flex items-center gap-1 text-[10px] font-black tracking-widest text-primary uppercase transition-colors hover:text-primary/70 disabled:opacity-50">
                  {isUpdatingFormat ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    (SCORE_FORMAT_OPTIONS.find(
                      (o) => o.value === localScoreFormat
                    )?.label.split(" (")[0] ?? localScoreFormat)
                  )}
                  <ChevronDown className="h-2.5 w-2.5 opacity-40 transition-transform group-hover:translate-y-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-none">
                <div className="px-2 py-1.5 text-[9px] font-black tracking-[0.2em] text-muted-foreground/60 uppercase">
                  AniList Score Format
                </div>
                {SCORE_FORMAT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => handleScoreFormatChange(opt.value)}
                    className={cn(
                      "text-[11px] font-bold",
                      opt.value === localScoreFormat && "text-primary"
                    )}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {localScoreFormat !== serverScoreFormat && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 animate-in rounded-none bg-emerald-500 p-0 text-white shadow-lg shadow-emerald-500/20 zoom-in-95 fade-in hover:bg-emerald-600"
                onClick={handleScoreFormatUpdate}
                disabled={isUpdatingFormat}
              >
                {isUpdatingFormat ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-none sm:w-auto"
            onClick={() => navigate("/export")}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 rounded-none sm:w-auto"
            onClick={fetchList}
            disabled={loading}
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && !fetched && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      )}

      {fetched && (
        <>
          {/* Status Tabs */}
          <div className="scrollbar-none flex gap-1 overflow-x-auto border-b border-border/50 pb-2">
            {STATUS_TABS.map((tab) => {
              const count =
                tab.key === "ALL"
                  ? totalCount
                  : (lists.find((l) => l.status === tab.key)?.entries.length ??
                    0)

              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key)
                    setSearch("")
                  }}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-none border px-3 py-1.5 text-xs font-black tracking-widest uppercase transition-colors",
                    activeTab === tab.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={cn(
                        "text-[9px]",
                        activeTab === tab.key
                          ? "text-primary/70"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col gap-3 rounded-none border border-border/50 bg-muted/20 p-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                placeholder={`Search ${STATUS_LABELS[activeTab] ?? ""} entries…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 rounded-none border-primary/20 bg-background/50 pl-9 text-[11px] font-semibold transition-colors focus-visible:border-primary/50 focus-visible:ring-0"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger className="h-9 w-[110px] rounded-none text-[10px] font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Season" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="ALL" className="text-[10px] font-bold uppercase">All Seasons</SelectItem>
                  {SEASONS.map((s) => (
                    <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase">
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={seasonYear} onValueChange={setSeasonYear}>
                <SelectTrigger className="h-9 w-[90px] rounded-none text-[10px] font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="ALL" className="text-[10px] font-bold uppercase">All Years</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={y} className="text-[10px] font-bold uppercase">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-9 w-auto min-w-[100px] rounded-none text-[10px] font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="ALL" className="text-[10px] font-bold uppercase">All Formats</SelectItem>
                  {FORMATS.map((f) => (
                    <SelectItem key={f} value={f} className="text-[10px] font-bold uppercase">
                      {f.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-[160px] rounded-none text-[10px] font-bold uppercase tracking-wider">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-[10px] font-bold uppercase">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearFilters}
                className="h-9 w-9 rounded-none text-muted-foreground hover:bg-primary/10 hover:text-primary"
                title="Clear Filters"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Entries Container */}
          <div
            ref={listRef}
            className="w-full flex-1 border-t border-border/50"
          >
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 opacity-30" />
                <p className="text-sm font-bold">
                  {search
                    ? "No entries match your search."
                    : `No entries in ${activeTab === "ALL" ? "your list" : STATUS_LABELS[activeTab]}.`}
                </p>
              </div>
            ) : (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const entry = filteredEntries[virtualItem.index]
                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start - listOffset}px)`,
                      }}
                    >
                      <MemoizedEntryRow
                        entry={entry}
                        scoreFormat={localScoreFormat}
                        onEdit={setEditEntry}
                        onDelete={setDeleteConfirmEntry}
                        onInfo={setInfoEntry}
                        deleting={deletingId === entry.id}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <EditEntryDialog
        isOpen={!!editEntry}
        media={editEntry?.media}
        initialScore={editEntry?.score}
        initialStatus={editEntry?.status}
        initialProgress={editEntry?.progress}
        scoreFormat={localScoreFormat}
        onSave={(updates) => handleSave(editEntry!.id, updates)}
        onClose={() => setEditEntry(null)}
      />

      {/* Info Dialog */}
      <MediaDetailsDialog
        media={infoEntry?.media || null}
        onClose={() => setInfoEntry(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmEntry}
        onOpenChange={(open) => !open && setDeleteConfirmEntry(null)}
      >
        <AlertDialogContent className="rounded-none border-primary/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-black tracking-tight uppercase">
              Remove from List?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to remove{" "}
              <span className="font-bold text-foreground">
                {deleteConfirmEntry?.media.title.english ??
                  deleteConfirmEntry?.media.title.romaji}
              </span>{" "}
              from your AniList? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="h-9 rounded-none border-border/50 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteConfirmEntry && handleDelete(deleteConfirmEntry)
              }
              className="h-9 rounded-none bg-destructive text-[10px] font-black tracking-widest text-destructive-foreground uppercase shadow-lg shadow-destructive/20 transition-all hover:bg-destructive/90 hover:scale-[1.02]"
            >
              Remove Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ListManagement
