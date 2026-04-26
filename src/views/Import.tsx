import { useState, useRef, useEffect, type FC, type ChangeEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useProgress, type AnimeEntry } from "@/components/ProgressProvider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Upload,
  ClipboardList,
  Trash2,
  Check,
  ArrowRight,
  FileText,
  AlertTriangle,
  Sparkles,
  Copy,
  ChevronDown,
  Info,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import {
  type AniListScoreFormat,
  getAIPrompt,
  normalizeScoreToFormat,
  SCORE_FORMAT_OPTIONS,
  getScoreConfig,
} from "@/lib/scoreFormat"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { queryAniList, UPDATE_USER_SETTINGS } from "@/lib/anilist"

// ── AI platform icons ───────────────────────────────────────────────────
const ChatGPTIcon = () => (
  <svg
    fill="currentColor"
    viewBox="0 0 24 24"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
  >
    <title>OpenAI icon</title>
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"></path>
  </svg>
)

const ClaudeIcon = () => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
  >
    <title>Claude</title>
    <path
      d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"
      fill="currentColor"
    />
  </svg>
)

const GeminiIcon = () => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
  >
    <title>Google Gemini</title>
    <path
      d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"
      fill="currentColor"
    />
  </svg>
)

const PerplexityIcon = () => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
  >
    <title>Perplexity</title>
    <path
      d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z"
      fill="currentColor"
    />
  </svg>
)

// ── AI platform definitions ───────────────────────────────────────────────
const AI_PLATFORMS = [
  {
    name: "ChatGPT",
    url: (prompt: string) =>
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
    prefill: true,
    color:
      "hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-400",
    icon: <ChatGPTIcon />,
  },
  {
    name: "Claude",
    url: (prompt: string) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
    prefill: true,
    color:
      "hover:border-orange-400/40 hover:bg-orange-400/5 hover:text-orange-300",
    icon: <ClaudeIcon />,
  },
  {
    name: "Gemini",
    url: (prompt: string) =>
      `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}`,
    prefill: true,
    color: "hover:border-blue-400/40 hover:bg-blue-400/5 hover:text-blue-300",
    icon: <GeminiIcon />,
  },
  {
    name: "Perplexity",
    url: (prompt: string) =>
      `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
    prefill: true,
    color:
      "hover:border-violet-400/40 hover:bg-violet-400/5 hover:text-violet-300",
    icon: <PerplexityIcon />,
  },
]

const Import: FC = () => {
  const [text, setText] = useState("")
  const [failedLines, setFailedLines] = useState<string[]>([])
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { entries, setEntries, token, user, setUser } = useProgress()
  const navigate = useNavigate()
  const [isUpdatingFormat, setIsUpdatingFormat] = useState(false)

  // Derive initial format from user's AniList preference
  const [scoreFormat, setScoreFormat] = useState<AniListScoreFormat>(
    (user?.scoreFormat as AniListScoreFormat) ?? "POINT_10_DECIMAL"
  )

  // Keep format in sync if user data loads after mount
  useEffect(() => {
    if (user?.scoreFormat) {
      setScoreFormat(user.scoreFormat as AniListScoreFormat)
    }
  }, [user?.scoreFormat])

  const handleScoreFormatChange = (newFormat: AniListScoreFormat) => {
    setScoreFormat(newFormat)
  }

  const handleScoreFormatUpdate = async () => {
    if (!token || !user || scoreFormat === user.scoreFormat) return

    setIsUpdatingFormat(true)
    try {
      await queryAniList(
        UPDATE_USER_SETTINGS,
        { scoreFormat: scoreFormat },
        token
      )
      toast.success(`Score format updated to ${scoreFormat} on AniList`)
      // Update local state
      setUser({
        ...user,
        scoreFormat: scoreFormat,
        mediaListOptions: {
          ...user.mediaListOptions,
          scoreFormat: scoreFormat,
        },
      })
    } catch (err: any) {
      toast.error("Failed to update AniList settings: " + err.message)
    } finally {
      setIsUpdatingFormat(false)
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/")
    }
  }, [token, navigate])

  const config = getScoreConfig(scoreFormat)

  const parseCSV = (content: string) => {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (lines.length < 2) return null

    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim())
    const nameIdx = headers.findIndex(
      (h) =>
        h.includes("anime name") ||
        h === "name" ||
        h === "title" ||
        h === "anime"
    )
    const ratingIdx = headers.findIndex(
      (h) => h.includes("rating") || h === "score" || h === "grade"
    )

    if (nameIdx === -1 || ratingIdx === -1) {
      return null
    }

    const newEntries: AnimeEntry[] = []
    const failed: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((col) => col.trim())
      if (
        row[nameIdx] &&
        row[ratingIdx] &&
        !isNaN(parseFloat(row[ratingIdx]))
      ) {
        const raw = parseFloat(row[ratingIdx])
        // CSV scores assumed to already be in user's format
        newEntries.push({
          id: crypto.randomUUID(),
          originalLine: lines[i],
          name: row[nameIdx],
          rating: raw,
          selections: [],
          status: "pending",
        })
      } else {
        failed.push(lines[i])
      }
    }
    return { entries: newEntries, failed }
  }

  const navigateToLine = (lineText: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const index = text.indexOf(lineText)
    if (index !== -1) {
      textarea.focus()
      textarea.setSelectionRange(index, index + lineText.length)

      const linesBefore = text.substring(0, index).split("\n")
      const rowNumber = linesBefore.length - 1
      const lineHeight = 21

      textarea.scrollTop =
        rowNumber * lineHeight - textarea.clientHeight / 2 + lineHeight / 2

      const rect = textarea.getBoundingClientRect()
      const scrollTarget =
        window.pageYOffset +
        rect.top -
        window.innerHeight / 2 +
        textarea.clientHeight / 2

      window.scrollTo({
        top: Math.max(0, scrollTarget - 40),
        behavior: "smooth",
      })
    }
  }

  const parseText = (content: string) => {
    setFailedLines([])
    let finalEntries: AnimeEntry[] = []
    let finalFailed: string[] = []

    // 1. Try CSV first
    if (content.includes(",") && content.includes("\n")) {
      const result = parseCSV(content)
      if (result && result.entries.length > 0) {
        finalEntries = result.entries
        finalFailed = result.failed

        setEntries(finalEntries)
        setFailedLines(finalFailed)
        toast.success(`Loaded ${finalEntries.length} entries via CSV.`)
        return
      }
    }

    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    for (const line of lines) {
      const hasListMarker = /^[0-9]+[\.\)]\s*|^[\-\*\+]\s*/.test(line)

      let cleanedLine = line
        .replace(/^[0-9]+[\.\)]\s*/, "")
        .replace(/^[\-\*\+]\s*/, "")
        .trim()

      if (cleanedLine.length === 0) continue

      // Primary Regex: [Title] (Score)
      const scoreRegex =
        /(?:^|\d*\.?\s*)\[?(.+?)\]?\s*[\(\-:\s]\s*([\d\.,]+)(?:\/\d+)?(?:\s*stars?)?\)?$/
      const match = cleanedLine.match(scoreRegex)

      if (match) {
        const name = match[1].trim()
        const ratingStr = match[2].replace(",", ".")
        const rawRating = parseFloat(ratingStr)

        // Normalize to target format
        const rating = isNaN(rawRating)
          ? 0
          : normalizeScoreToFormat(
              rawRating > config.max ? rawRating / 10 : rawRating,
              scoreFormat
            )

        finalEntries.push({
          id: crypto.randomUUID(),
          originalLine: line,
          name,
          rating,
          selections: [],
          status: "pending",
        })
      } else {
        const isUrl = /^(https?:\/\/|www\.)/i.test(cleanedLine)
        const isProse =
          /[\.\?\\!]$/.test(cleanedLine) && cleanedLine.includes(" ")

        if (hasListMarker && cleanedLine.length > 2 && !isUrl && !isProse) {
          finalEntries.push({
            id: crypto.randomUUID(),
            originalLine: line,
            name: cleanedLine,
            rating: 0,
            selections: [],
            status: "pending",
          })
        } else {
          finalFailed.push(line)
        }
      }
    }

    if (finalEntries.length === 0 && finalFailed.length === 0) {
      toast.error("No valid entries found.")
      return
    }

    setEntries(finalEntries)
    setFailedLines(finalFailed)

    if (finalEntries.length > 0) {
      toast.success(`Loaded ${finalEntries.length} entries.`)
    }
    if (finalFailed.length > 0) {
      toast.warning(`${finalFailed.length} lines moved to unparsed.`)
    }
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      parseText(content)
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    setEntries([])
    setText("")
  }

  const handleOpenAIPlatform = (platform: (typeof AI_PLATFORMS)[number]) => {
    const prompt = getAIPrompt(scoreFormat)
    if (platform.prefill) {
      window.open(platform.url(prompt), "_blank", "noopener,noreferrer")
    } else {
      navigator.clipboard.writeText(prompt).catch(() => {})
      toast.info(`Prompt copied! Paste it into your preferred AI platform.`)
    }
  }

  const formatLabel =
    SCORE_FORMAT_OPTIONS.find((o) => o.value === scoreFormat)?.label ??
    scoreFormat

  return (
    <>
      <div className="mx-auto w-full max-w-4xl animate-in space-y-6 px-1 pb-40 duration-500 fade-in slide-in-from-bottom-4 sm:space-y-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight uppercase sm:text-3xl">
              Zenith Import
            </h2>
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              Import your anime lists via text or CSV to prepare for batch
              synchronization.
            </p>
          </div>
          {entries.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
              className="w-full gap-2 rounded-none sm:w-auto"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Score Format Selector */}
        <div className="flex flex-wrap items-center gap-3 rounded-none border border-primary/10 bg-primary/5 px-4 py-3">
          <Info className="h-4 w-4 shrink-0 text-primary/60" />
          <span className="text-xs font-medium text-muted-foreground">
            Score format:
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isUpdatingFormat}>
              <button
                className={cn(
                  "flex items-center gap-1.5 rounded-none border border-primary/20 bg-background px-2.5 py-1 text-xs font-black text-primary transition-colors hover:border-primary/40 hover:bg-primary/5",
                  isUpdatingFormat && "cursor-not-allowed opacity-50"
                )}
              >
                {isUpdatingFormat ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  formatLabel
                )}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-none">
              {SCORE_FORMAT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleScoreFormatChange(opt.value)}
                  className={
                    opt.value === scoreFormat ? "font-bold text-primary" : ""
                  }
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user?.scoreFormat && user.scoreFormat !== scoreFormat && (
            <div className="flex animate-in items-center gap-2 fade-in slide-in-from-left-2">
              <Button
                size="sm"
                className="h-7 w-7 rounded-none bg-emerald-500 p-0 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                onClick={handleScoreFormatUpdate}
                disabled={isUpdatingFormat}
              >
                {isUpdatingFormat ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <span className="text-[10px] font-bold tracking-tight text-emerald-500 uppercase">
                Apply to AniList
              </span>
            </div>
          )}
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card className="rounded-none border-primary/10 shadow-lg">
              <CardHeader className="flex flex-col space-y-4 pb-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Paste List
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Format:{" "}
                    <code className="rounded bg-muted px-1">
                      {scoreFormat === "POINT_5"
                        ? "[Name] (N stars)"
                        : scoreFormat === "POINT_3"
                          ? "[Name] (1-3)"
                          : scoreFormat === "POINT_100"
                            ? "[Name] (85/100)"
                            : "[Name] (8.5/10)"}
                    </code>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full gap-2 border-primary/20 bg-primary/5 font-black text-primary transition-all hover:bg-primary hover:text-primary-foreground sm:w-auto"
                  onClick={() => setAiDialogOpen(true)}
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="truncate">Format with AI</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  ref={textareaRef}
                  placeholder="1. Cowboy Bebop (10)&#10;Akira (9)..."
                  className="max-h-[500px] min-h-[300px] overflow-y-auto rounded-none font-mono text-sm leading-relaxed focus-visible:ring-primary/30"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button
                  className="h-11 w-full gap-2 rounded-none font-bold"
                  onClick={() => parseText(text)}
                  disabled={!text.trim()}
                >
                  Parse Text Contents
                </Button>
              </CardContent>
            </Card>

            {failedLines.length > 0 && (
              <Card className="animate-in rounded-none border-destructive/20 bg-destructive/5 shadow-lg duration-500 slide-in-from-top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest text-destructive uppercase">
                    <AlertTriangle className="h-4 w-4" />
                    Unparsed Lines ({failedLines.length})
                  </CardTitle>
                  <CardDescription className="text-xs text-destructive/60">
                    These lines didn't match our recognized formats.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="scrollbar-thin scrollbar-thumb-destructive/20 scrollbar-track-transparent max-h-[300px] space-y-2 overflow-y-auto pr-2 sm:max-h-[400px]">
                    {failedLines.map((line, idx) => (
                      <div
                        key={idx}
                        onClick={() => navigateToLine(line)}
                        className="group/item flex min-w-0 cursor-pointer items-start gap-3 rounded-none border border-destructive/10 bg-background/50 p-3 font-mono text-[11px] text-destructive/80 shadow-sm transition-all hover:border-destructive/30 hover:bg-destructive/10 sm:text-xs"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-destructive/20 text-[10px] font-bold transition-colors group-hover/item:bg-destructive/40">
                          {idx + 1}
                        </span>
                        <span className="min-w-0 flex-1 break-all whitespace-pre-wrap">
                          {line}
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0 self-center opacity-0 transition-opacity group-hover/item:opacity-30" />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-none bg-destructive/10 p-4">
                    <p className="text-xs leading-relaxed font-bold text-destructive/80 italic">
                      Tip: Use the "Format with AI" button above to auto-format
                      your list. Each line should match the expected format.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="rounded-none border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-primary">
                  <Upload className="h-5 w-5" />
                  Upload File
                </CardTitle>
                <CardDescription className="text-[10px] leading-tight font-medium">
                  Upload a .txt or .csv file. Required columns:{" "}
                  <code className="rounded bg-primary/10 px-1 text-primary">
                    Name
                  </code>{" "}
                  &{" "}
                  <code className="rounded bg-primary/10 px-1 text-primary">
                    Score
                  </code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="group relative rounded-none border-2 border-dashed border-primary/20 p-6 text-center transition-all hover:border-primary/40 hover:bg-primary/5">
                  <Input
                    type="file"
                    accept=".txt,.csv"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    onChange={handleFileUpload}
                  />
                  <div className="pointer-events-none relative z-0">
                    <FileText className="mx-auto mb-2 h-10 w-10 text-primary/50 transition-transform group-hover:scale-110" />
                    <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                      Click or drag & drop
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      Supports .txt and .csv
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Format with AI Dialog ─────────────────────────────────────── */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="rounded-none border-primary/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black tracking-tight uppercase">
              <Sparkles className="h-4 w-4 text-primary" />
              Format with AI
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Choose an AI platform below. The formatter prompt (tuned for your{" "}
              <span className="font-bold text-primary">{formatLabel}</span>{" "}
              score format) will be sent directly to the AI's chat. Paste your
              raw anime list into the chat after the prompt, then copy the
              formatted result back here.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AI_PLATFORMS.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handleOpenAIPlatform(platform)}
                className={`flex items-center gap-3 rounded-none border border-border px-4 py-3 text-left text-sm font-bold transition-all ${platform.color}`}
              >
                <span className="flex shrink-0 items-center justify-center">
                  {platform.icon}
                </span>
                <span>{platform.name}</span>
                {!platform.prefill && (
                  <span className="ml-auto text-[9px] font-black tracking-widest uppercase opacity-40">
                    copies
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-border pt-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(getAIPrompt(scoreFormat))
                toast.success("Formatter prompt copied!")
              }}
              className="flex w-full items-center justify-center gap-2 rounded-none border border-dashed border-border px-4 py-2.5 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Prompt Only
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
              opacity: { duration: 0.8 },
            }}
            className="fixed right-4 bottom-6 left-4 z-50 flex flex-col gap-3 rounded-none border border-primary/20 bg-card/60 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:bottom-8 sm:mx-auto sm:w-full sm:max-w-md"
          >
            <div className="flex items-center justify-between px-2 sm:px-4">
              <div className="flex flex-col">
                <p className="text-[8px] font-black tracking-[0.2em] text-muted-foreground uppercase sm:text-[9px]">
                  Import Collection
                </p>
                <p className="text-xs font-black text-primary sm:text-sm">
                  {entries.length} Entries Ready
                </p>
              </div>
              <div className="h-8 w-px bg-primary/10" />
              <div className="flex flex-col text-right">
                <p className="text-[8px] font-black tracking-[0.2em] text-muted-foreground uppercase sm:text-[9px]">
                  Format
                </p>
                <p className="text-xs font-black text-foreground sm:text-sm">
                  {formatLabel}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => navigate("/review")}
              className="group h-12 w-full rounded-none bg-primary text-[10px] font-black tracking-widest uppercase shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 sm:h-12 sm:text-xs"
            >
              Review Entries
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Import
