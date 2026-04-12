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
  Upload,
  ClipboardList,
  Trash2,
  ArrowRight,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { AI_PROMPT } from "@/lib/utils"

const Import: FC = () => {
  const [text, setText] = useState("")
  const [failedLines, setFailedLines] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { entries, setEntries, token } = useProgress()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate("/")
    }
  }, [token, navigate])

  const parseCSV = (content: string) => {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (lines.length < 2) return null

    // Try to find the header
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
      return null // Not the CSV format we expect
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
        newEntries.push({
          id: crypto.randomUUID(),
          originalLine: lines[i],
          name: row[nameIdx],
          rating: parseFloat(row[ratingIdx]),
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
      // 1. Set the selection and focus
      textarea.focus()
      textarea.setSelectionRange(index, index + lineText.length)

      // 2. Calculate the row number to center "internally"
      const linesBefore = text.substring(0, index).split("\n")
      const rowNumber = linesBefore.length - 1
      const lineHeight = 21 // Approx height for text-sm leading-relaxed

      // Center the line within the textarea box
      textarea.scrollTop =
        rowNumber * lineHeight - textarea.clientHeight / 2 + lineHeight / 2

      // 3. Center the textarea within the "screen"
      // We calculate where the textarea is and where the viewport center is
      const rect = textarea.getBoundingClientRect()
      const scrollTarget =
        window.pageYOffset +
        rect.top -
        window.innerHeight / 2 +
        textarea.clientHeight / 2

      window.scrollTo({
        top: Math.max(0, scrollTarget - 40), // 40px offset to keep it slightly above dead center (balance for Navbar)
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
      // 1. Check for Structural Markers
      const hasListMarker = /^[0-9]+[\.\)]\s*|^[\-\*\+]\s*/.test(line)

      // 2. Initial Cleaning for pattern matching
      let cleanedLine = line
        .replace(/^[0-9]+[\.\)]\s*/, "") // Strip "1. " or "1) "
        .replace(/^[\-\*\+]\s*/, "") // Strip "- " or "* "
        .trim()

      if (cleanedLine.length === 0) continue

      // 3. Primary Regex: [Title] (Score) -> The "Structure of Truth"
      const scoreRegex =
        /(?:^|\d*\.?\s*)\[?(.+?)\]?\s*[\(\-:\s]\s*([\d\.,]+)(?:\/10)?\)?$/
      const match = cleanedLine.match(scoreRegex)

      if (match) {
        const name = match[1].trim()
        const ratingStr = match[2].replace(",", ".")
        const rating = parseFloat(ratingStr)

        finalEntries.push({
          id: crypto.randomUUID(),
          originalLine: line,
          name,
          rating: isNaN(rating) ? 0 : rating > 10 ? rating / 10 : rating,
          selections: [],
          status: "pending",
        })
      } else {
        // 4. Strict Structural-Only Fallback
        // Only accept as a "Title-Only" entry if it has an explicit list marker
        // and doesn't look like a URL or a multi-line sentence.
        const isUrl = /^(https?:\/\/|www\.)/i.test(cleanedLine)
        const isProse =
          /[\.\?\!]$/.test(cleanedLine) && cleanedLine.includes(" ")

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
          // If it doesn't meet the structural requirements, it's unparsed
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
                      [Name] (Rating/10)
                    </code>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-full gap-2 border-primary/20 bg-primary/5 font-black text-primary transition-all hover:bg-primary hover:text-primary-foreground sm:w-auto"
                  onClick={() => {
                    navigator.clipboard.writeText(AI_PROMPT)
                    toast.success("AI Formatter Prompt copied!")
                  }}
                >
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary/20 text-[8px]">
                    AI
                  </div>
                  <span className="truncate">Copy Formatter Prompt</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  ref={textareaRef}
                  placeholder="1. Cowboy Bebop (10/10)&#10; Akira (9/10)..."
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
                      Tip: Ensure each line matches "[Name] (Score/10)" or your
                      CSV has "Name" and "Score" headers. You can also use the
                      AI formatter prompt above.
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
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
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
            className="fixed bottom-6 left-4 right-4 z-50 flex flex-col gap-3 rounded-none border border-primary/20 bg-card/60 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:bottom-8 sm:mx-auto sm:w-full sm:max-w-md"
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
                  Source
                </p>
                <p className="text-xs font-black text-foreground sm:text-sm">
                  Parsed Content
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
