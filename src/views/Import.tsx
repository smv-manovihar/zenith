import React, { useState } from "react"
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

const Import: React.FC = () => {
  const [text, setText] = useState("")
  const [failedLines, setFailedLines] = useState<string[]>([])
  const { entries, setEntries, token } = useProgress()
  const navigate = useNavigate()

  React.useEffect(() => {
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

  const parseText = (content: string) => {
    setFailedLines([])
    let finalEntries: AnimeEntry[] = []
    let finalFailed: string[] = []

    // First try parsing as CSV if it looks like one
    if (content.includes(",") && content.includes("\n")) {
      const result = parseCSV(content)
      if (result && result.entries.length > 0) {
        finalEntries = result.entries
        finalFailed = result.failed
      }
    }

    if (finalEntries.length === 0) {
      // Fallback to regex for the "[Name] (Rating/10)" format
      const regex = /(?:^|\n)\d*\.?\s*\[?([^\](\n]+)\]?\s*\(([\d.]+)\/10\)/g
      const matches = Array.from(content.matchAll(regex))

      const foundLines = matches.map((m) => m[0].trim())
      finalEntries = matches.map((match) => ({
        originalLine: match[0].trim(),
        name: match[1].trim(),
        rating: parseFloat(match[2]),
        selections: [],
        status: "pending",
      }))

      // Identify unparsed lines
      const allLines = content
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      finalFailed = allLines.filter(
        (line) => !foundLines.some((found) => line.includes(found))
      )
    }

    if (finalEntries.length === 0 && finalFailed.length === 0) {
      toast.error(
        "No valid entries found. Check the format: [Name] (Rating/10) or CSV with headers."
      )
      return
    }

    setEntries(finalEntries)
    setFailedLines(finalFailed)

    if (finalEntries.length > 0) {
      toast.success(`Successfully parsed ${finalEntries.length} entries!`)
    }
    if (finalFailed.length > 0) {
      toast.warning(`${finalFailed.length} lines could not be parsed.`)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="mx-auto max-w-4xl animate-in space-y-8 duration-500 fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">
            Zenith Import
          </h2>
          <p className="text-muted-foreground font-medium">
            Stage your Anime collection for synchronization.
          </p>
        </div>
        {entries.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Paste List
                </CardTitle>
                <CardDescription>
                  Format:{" "}
                  <code className="rounded bg-muted px-1">
                    1. [Anime Name] (9.5/10)
                  </code>
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-primary/20 bg-primary/5 font-black text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                onClick={() => {
                  const prompt = `Act as a data parser. I will provide a list of anime titles and ratings. Convert them into a numbered list where each line matches the pattern: [Anime Name] (Score/10). \n\nRules:\n1. Exact format: 1. Title (9.5/10)\n2. Normalize scores to a 10-point scale.\n3. Use the English or Romaji title.\n4. Output ONLY the list. No intro or outro. Just the data.`
                  navigator.clipboard.writeText(prompt)
                  toast.success("AI Formatter Prompt copied!")
                }}
              >
                <div className="flex h-4 w-4 items-center justify-center rounded bg-primary/20 text-[8px]">
                  AI
                </div>
                Copy Formatter Prompt
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="1. Cowboy Bebop (10/10)&#10;2. Akira (9/10)..."
                className="max-h-30 min-h-[300px] font-mono text-sm leading-relaxed focus-visible:ring-primary/30"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <Button
                className="h-11 w-full gap-2 font-bold"
                onClick={() => parseText(text)}
                disabled={!text.trim()}
              >
                Parse Text Contents
              </Button>

              {failedLines.length > 0 && (
                <div className="animate-in space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 duration-300 slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-destructive uppercase">
                    <AlertTriangle className="h-4 w-4" />
                    Unparsed Lines ({failedLines.length})
                  </div>
                  <div className="scrollbar-thin scrollbar-thumb-destructive/20 scrollbar-track-transparent max-h-[200px] space-y-2 overflow-y-auto pr-2">
                    {failedLines.map((line, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-lg border border-destructive/10 bg-destructive/5 p-2 font-mono text-xs text-destructive/80"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-destructive/20 text-[8px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="truncate">{line}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    Tip: Ensure the line matches "[Name] (Score/10)" or your CSV
                    headers.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
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
              <div className="group relative rounded-xl border-2 border-dashed border-primary/20 p-6 text-center transition-colors hover:border-primary/40">
                <Input
                  type="file"
                  accept=".txt,.csv"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={handleFileUpload}
                />
                <FileText className="mx-auto mb-2 h-10 w-10 text-primary/50" />
                <p className="text-xs font-medium text-muted-foreground">
                  Click or drag & drop
                </p>
              </div>
            </CardContent>
          </Card>


          {entries.length > 0 && (
            <div className="animate-in space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 duration-300 zoom-in-95">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold tracking-wider text-primary uppercase">
                  Summary
                </h4>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {entries.length} Entries
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your list is ready for review. We'll search for every anime on
                AniList and let you confirm the results.
              </p>
              <Button
                className="w-full gap-2 shadow-lg shadow-primary/20"
                onClick={() => navigate("/review")}
              >
                Proceed to Review
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Import
