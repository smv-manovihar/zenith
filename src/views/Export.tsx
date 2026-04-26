import { useState, useMemo, useEffect, type FC } from "react"
import { useNavigate } from "react-router-dom"
import { useProgress, type Selection } from "@/components/ProgressProvider"
import { queryAniList, GET_MEDIA_LIST_COLLECTION } from "@/lib/anilist"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Copy,
  FileCode,
  List,
  ArrowLeft,
  SortAsc,
  Check,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { type AniListScoreFormat, formatScoreDisplay } from "@/lib/scoreFormat"
import { normalizeTitle, cn } from "@/lib/utils"
import { downloadFile, generateMalXml } from "@/lib/exportUtils"

type SortMode = "score" | "name"


// Resolved entries = entries with at least one completed selection
function useResolvedSelections(scoreFormat: AniListScoreFormat) {
  const { entries } = useProgress()
  return useMemo(() => {
    const result: {
      name: string
      selection: Selection
    }[] = []
    for (const entry of entries) {
      for (const sel of entry.selections) {
        if (sel.status === "completed" || sel.rating > 0) {
          result.push({ name: entry.name, selection: sel })
        }
      }
    }
    return result
  }, [entries, scoreFormat]) // eslint-disable-line react-hooks/exhaustive-deps
}

interface ExportPanelProps {
  scoreFormat?: AniListScoreFormat
  /** If true, only show the export actions without the full page chrome */
  compact?: boolean
  /** If true, fetch the full AniList instead of using local synced entries */
  fetchFull?: boolean
}

export const ExportPanel: FC<ExportPanelProps> = ({
  scoreFormat: formatProp,
  compact = false,
  fetchFull = false,
}) => {
  const { user, token } = useProgress()
  const scoreFormat =
    formatProp ??
    ((user?.scoreFormat as AniListScoreFormat) || "POINT_10_DECIMAL")
  const [sort, setSort] = useState<SortMode>("score")
  const [copied, setCopied] = useState<"list" | "xml" | null>(null)

  const resolved = useResolvedSelections(scoreFormat)
  const [fullList, setFullList] = useState<
    { name: string; selection: Selection }[]
  >([])
  const [loadingFull, setLoadingFull] = useState(fetchFull)

  useEffect(() => {
    if (!fetchFull || !user || !user.id || !token) return
    let mounted = true
    const fetchAll = async () => {
      try {
        const res = await queryAniList(
          GET_MEDIA_LIST_COLLECTION,
          { userId: user.id, type: "ANIME" },
          token
        )
        if (!mounted) return
        const rawLists = res.data?.MediaListCollection?.lists ?? []
        const mapped = rawLists.flatMap((list: any) =>
          list.entries.map((e: any) => ({
            name: e.media.title.english ?? e.media.title.romaji,
            selection: {
              id: e.media.id,
              idMal: e.media.idMal,
              title: e.media.title.english ?? e.media.title.romaji,
              status: "completed",
              anilistStatus: e.status,
              rating: e.score,
              progress: e.progress,
            } as Selection,
          }))
        )
        setFullList(mapped)
      } catch (err: any) {
        toast.error("Failed to fetch full list: " + err.message)
      } finally {
        if (mounted) setLoadingFull(false)
      }
    }
    fetchAll()
    return () => {
      mounted = false
    }
  }, [fetchFull, user, token])

  const sourceData = fetchFull ? fullList : resolved

  const sortedSelections = useMemo(() => {
    const items = [...sourceData]
    switch (sort) {
      case "name":
        return items.sort((a, b) => {
          const nameA = normalizeTitle(a.name || a.selection.title)
          const nameB = normalizeTitle(b.name || b.selection.title)
          return nameA.localeCompare(nameB)
        })
      case "score":
      default:
        return items.sort((a, b) => {
          const scoreDiff =
            (b.selection.rating ?? 0) - (a.selection.rating ?? 0)
          if (scoreDiff !== 0) return scoreDiff

          const nameA = normalizeTitle(a.name || a.selection.title)
          const nameB = normalizeTitle(b.name || b.selection.title)
          return nameA.localeCompare(nameB)
        })
    }
  }, [sourceData, sort])

  const numberedList = useMemo(
    () =>
      sortedSelections
        .map(
          ({ selection }, i) =>
            `${i + 1}. ${selection.title} (${formatScoreDisplay(selection.rating, scoreFormat)})`
        )
        .join("\n"),
    [sortedSelections, scoreFormat]
  )

  const malXml = useMemo(
    () => generateMalXml(sortedSelections, scoreFormat),
    [sortedSelections, scoreFormat]
  )

  const malCompatible = sortedSelections.filter(
    ({ selection }) => selection.idMal
  ).length
  const malMissing = sortedSelections.length - malCompatible

  const handleCopy = (type: "list" | "xml") => {
    const content = type === "list" ? numberedList : malXml
    navigator.clipboard.writeText(content).then(() => {
      setCopied(type)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopied(null), 2000)
    })
  }

  if (loadingFull) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent opacity-40" />
        <p className="text-sm font-bold">Fetching your full AniList...</p>
      </div>
    )
  }

  if (sourceData.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
        <AlertCircle className="h-8 w-8 opacity-40" />
        <p className="text-sm font-bold">
          {fetchFull
            ? "Your AniList is empty."
            : "No synced entries to export."}
        </p>
        {!fetchFull && (
          <p className="text-xs opacity-60">
            Complete the sync step first, then come back to export.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", compact && "space-y-4")}>
      {/* Sort controls */}
      <div className="flex flex-wrap items-center gap-2">
        <SortAsc className="h-4 w-4 text-muted-foreground/60" />
        <span className="text-xs font-bold text-muted-foreground uppercase">
          Sort:
        </span>
        {(["score", "name"] as SortMode[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={cn(
              "rounded-none border px-2.5 py-1 text-[10px] font-black tracking-widest uppercase transition-colors",
              sort === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
            )}
          >
            {s}
          </button>
        ))}
        <Badge
          variant="secondary"
          className="ml-auto rounded-none text-[10px] font-black"
        >
          {sortedSelections.length} entries
        </Badge>
      </div>

      {/* Numbered List */}
      <Card className="rounded-none border-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <List className="h-4 w-4 text-primary" />
              Numbered List
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 rounded-none text-xs"
                onClick={() => handleCopy("list")}
              >
                {copied === "list" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1.5 rounded-none text-xs"
                onClick={() =>
                  downloadFile(numberedList, "anime-list.txt", "text/plain")
                }
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="scrollbar-thin scrollbar-thumb-primary/10 max-h-[300px] overflow-y-auto rounded-none bg-muted/40 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground/80">
            {numberedList}
          </pre>
        </CardContent>
      </Card>

      {/* MAL XML */}
      <Card className="rounded-none border-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCode className="h-4 w-4 text-primary" />
                MyAnimeList XML
              </CardTitle>
              <CardDescription className="mt-0.5 text-[10px]">
                {malCompatible} entries with MAL ID
                {malMissing > 0 && (
                  <span className="text-amber-500/80">
                    {" · "}
                    {malMissing} without (will be excluded)
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 rounded-none text-xs"
                onClick={() => handleCopy("xml")}
              >
                {copied === "xml" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copy
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1.5 rounded-none text-xs"
                onClick={() =>
                  downloadFile(malXml, "animelist.xml", "application/xml")
                }
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="scrollbar-thin scrollbar-thumb-primary/10 max-h-[300px] overflow-y-auto rounded-none bg-muted/40 p-4 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-foreground/60">
            {malXml}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Full page view ────────────────────────────────────────────────────────
const Export: FC = () => {
  const navigate = useNavigate()
  const { token } = useProgress()

  if (!token) {
    navigate("/")
    return null
  }

  return (
    <div className="mx-auto w-full max-w-4xl animate-in space-y-8 px-1 pb-24 duration-500 fade-in slide-in-from-bottom-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="gap-2 rounded-none"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">
            Export
          </h2>
          <p className="text-xs font-medium text-muted-foreground">
            Export your synced list as a numbered text file or MAL-compatible
            XML.
          </p>
        </div>
      </div>

      <ExportPanel fetchFull={true} />
    </div>
  )
}

export default Export
