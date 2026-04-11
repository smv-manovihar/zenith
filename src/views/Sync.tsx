import React, { useState } from "react"
import { useProgress } from "@/components/ProgressProvider"
import { queryAniList, SAVE_MEDIA_LIST_ENTRY } from "@/lib/anilist"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RefreshCcw,
  ExternalLink,
  Star,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const Sync: React.FC = () => {
  const { entries, updateEntry, token } = useProgress()
  const [isSyncing, setIsSyncing] = useState(false)
  const navigate = useNavigate()
  const totalToSync = entries.reduce((acc, e) => acc + e.selections.length, 0)
  const totalCompleted = entries.reduce(
    (acc, e) =>
      acc + e.selections.filter((s) => s.status === "completed").length,
    0
  )
  const syncProgress =
    totalToSync > 0 ? Math.round((totalCompleted / totalToSync) * 100) : 0

  const resolvedEntries = entries.filter((e) => e.selections.length > 0)

  const handleSync = async () => {
    if (!token) {
      toast.error("You must be logged in to sync.")
      return
    }

    setIsSyncing(true)

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (
        entry.selections.length === 0 ||
        entry.selections.every((s) => s.status === "completed")
      )
        continue

      const updatedSelections = [...entry.selections]
      let allSelectionsCompleted = true

      for (let j = 0; j < updatedSelections.length; j++) {
        const selection = updatedSelections[j]
        if (selection.status === "completed") continue

        updatedSelections[j] = { ...selection, status: "syncing" }
        updateEntry(i, {
          selections: [...updatedSelections],
          status: "syncing",
        })

        try {
          await queryAniList(
            SAVE_MEDIA_LIST_ENTRY,
            {
              mediaId: selection.id,
              status: "COMPLETED",
              score: selection.rating,
            },
            token
          )

          updatedSelections[j] = { ...selection, status: "completed" }
        } catch (err: any) {
          console.error(err)
          updatedSelections[j] = {
            ...selection,
            status: "error",
            error: err.message || "Failed to update",
          }
          allSelectionsCompleted = false
          toast.error(`Failed to update ${selection.title}`)
        }

        // Rate limiting precaution
        updateEntry(i, { selections: [...updatedSelections] })
        await new Promise((r) => setTimeout(r, 750))
      }

      const finalStatus = allSelectionsCompleted ? "completed" : "error"
      updateEntry(i, {
        status: finalStatus,
        selections: updatedSelections,
      })
    }

    setIsSyncing(false)
    toast.success("Sync process finished!")
  }

  const selectionsCount = entries.reduce(
    (acc, e) => acc + e.selections.length,
    0
  )
  const selectionsCompleted = entries.reduce(
    (acc, e) =>
      acc + e.selections.filter((s) => s.status === "completed").length,
    0
  )
  const errorCount = entries.filter((e) => e.status === "error").length

  return (
    <div className="mx-auto max-w-4xl animate-in space-y-8 duration-500 zoom-in-95 fade-in">
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h2 className="text-3xl font-black tracking-tight uppercase">
          Commit to AniList
        </h2>
        <p className="font-medium text-muted-foreground">
          Matches established for {resolvedEntries.length} out of{" "}
          {entries.length} items. Ready to commit these changes to your AniList
          profile?
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="border-primary/10 shadow-xl md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sync Progress</span>
              <Badge variant="secondary" className="font-mono">
                {syncProgress}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={syncProgress} className="h-4" />

            <div className="space-y-3">
              <h4 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
                Status List
              </h4>
              <div className="max-h-[400px] divide-y overflow-hidden overflow-y-auto rounded-xl border bg-muted/20">
                {entries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col divide-y border-b bg-card/50 last:border-0"
                  >
                    {/* Header: Entry name */}
                    <div className="flex items-center justify-between bg-muted/30 p-3">
                      <span className="text-xs font-black tracking-widest text-muted-foreground uppercase">
                        {entry.name}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {entry.selections.length} Items
                      </Badge>
                    </div>

                    {/* Selection list */}
                    <div className="divide-y divide-primary/5">
                      {entry.selections.map((selection, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center justify-between p-3 pl-6"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-8 overflow-hidden rounded-md bg-muted">
                              {selection.image && (
                                <img
                                  src={selection.image}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="max-w-[180px] truncate text-sm font-bold">
                                {selection.title}
                              </span>
                              <div className="mt-1 flex w-fit items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                <Star className="h-3 w-3 fill-primary text-primary" />
                                <span>SCORE</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="10"
                                  value={selection.rating}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0
                                    const newSelections = entry.selections.map(
                                      (s, i) =>
                                        i === sIdx ? { ...s, rating: val } : s
                                    )
                                    updateEntry(idx, {
                                      selections: newSelections,
                                    })
                                  }}
                                  className="w-8 border-none bg-transparent p-0 text-right font-black focus:ring-0"
                                />
                                <span className="opacity-40">/10</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            {selection.status === "completed" && (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            )}
                            {selection.status === "syncing" && (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            )}
                            {selection.status === "error" && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-5 w-5 text-destructive" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {selection.error}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {selection.status === "pending" && (
                              <div className="h-5 w-5 rounded-full border-2 border-primary/20" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Successfully updated
                </span>
                <span className="font-bold text-emerald-500">
                  {selectionsCompleted}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Errors</span>
                <span className="font-bold text-destructive">{errorCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-bold">
                  {selectionsCount - selectionsCompleted}
                </span>
              </div>

              <Button
                className="group h-12 w-full gap-2 text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                onClick={handleSync}
                disabled={isSyncing || selectionsCompleted === selectionsCount}
              >
                {isSyncing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                )}
                {isSyncing ? "Syncing..." : "Sync to AniList"}
              </Button>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate("/review")}
                disabled={isSyncing}
              >
                <RefreshCcw className="h-4 w-4" />
                Back to Review
              </Button>
            </CardContent>
          </Card>

          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            asChild
          >
            <a
              href="https://anilist.co/home"
              target="_blank"
              rel="noopener noreferrer"
            >
              View My AniList Profile
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Sync
