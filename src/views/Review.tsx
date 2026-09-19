import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FC,
  useMemo,
} from "react"
import { AnimatePresence } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useProgress } from "@/components/ProgressProvider"
import { Button } from "@/components/ui/button"

import { ReviewHeader } from "@/components/Review/ReviewHeader"
import { ReviewSidebar } from "@/components/Review/ReviewSidebar"
import { MediaSelectionArea } from "@/components/Review/MediaSelectionArea"
import { ReviewNavigation } from "@/components/Review/ReviewNavigation"
import { MediaDetailsDialog } from "@/components/Review/MediaDetailsDialog"

const Review: FC = () => {
  const { entries, updateEntry, token, lastVisitedIndex, setLastVisitedIndex } =
    useProgress()
  const selectionAreaRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showMissingOnly, setShowMissingOnly] = useState(
    searchParams.get("filter") === "missing"
  )
  const [currentIndex, setCurrentIndex] = useState(() => {
    const urlId = searchParams.get("id")
    if (urlId) {
      const idx = entries.findIndex((e) => e.id === urlId)
      if (idx !== -1) return idx
    }

    const urlIndex = searchParams.get("index")
    if (urlIndex !== null) {
      const idx = parseInt(urlIndex, 10)
      if (!isNaN(idx) && idx >= 0 && idx < entries.length) return idx
    }

    if (searchParams.get("filter") === "missing") {
      const firstMissing = entries.findIndex(
        (e) =>
          e.selections.length > 0 && e.selections.some((s) => s.rating === 0)
      )
      if (firstMissing !== -1) return firstMissing
    }

    return lastVisitedIndex >= 0 && lastVisitedIndex < entries.length
      ? lastVisitedIndex
      : 0
  })
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState(
    searchParams.get("q") || ""
  )
  const [selectedDetailsMedia, setSelectedDetailsMedia] = useState<any>(null)
  const shouldScrollRef = useRef(false)

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set("index", currentIndex.toString())

    const currentEntry = entries[currentIndex]
    if (currentEntry?.id) {
      params.set("id", currentEntry.id)
    }

    if (showMissingOnly) {
      params.set("filter", "missing")
    } else {
      params.delete("filter")
    }

    if (sidebarSearchQuery) {
      params.set("q", sidebarSearchQuery)
    } else {
      params.delete("q")
    }

    // Only update if something changed
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true })
    }
  }, [
    currentIndex,
    showMissingOnly,
    sidebarSearchQuery,
    setSearchParams,
    searchParams,
    entries,
  ])

  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate("/")
    }
  }, [token, navigate])

  // Scroll to selection area only when navigating via Next/Prev
  useEffect(() => {
    if (!shouldScrollRef.current) return
    shouldScrollRef.current = false

    if (selectionAreaRef.current) {
      const top =
        selectionAreaRef.current.getBoundingClientRect().top +
        window.scrollY -
        100
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
    }
  }, [currentIndex])

  // Track last visited index
  useEffect(() => {
    setLastVisitedIndex(currentIndex)
  }, [currentIndex, setLastVisitedIndex])

  const currentEntry = entries[currentIndex] || entries[0]

  const filteredEntries = useMemo(() => {
    return entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => {
        const matchesMissing =
          !showMissingOnly ||
          (entry.selections.length > 0 &&
            entry.selections.some((s: any) => s.rating === 0))
        const matchesSearch =
          !sidebarSearchQuery ||
          entry.name.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
        return matchesMissing && matchesSearch
      })
  }, [entries, showMissingOnly, sidebarSearchQuery])

  // If current entry is not in the filtered list, automatically select the first filtered entry
  useEffect(() => {
    if (filteredEntries.length > 0) {
      const isCurrentInFiltered = filteredEntries.some(
        (fe) => fe.index === currentIndex
      )
      if (!isCurrentInFiltered) {
        setCurrentIndex(filteredEntries[0].index)
      }
    }
  }, [filteredEntries, currentIndex])

  const currentFilteredPos = useMemo(() => {
    return filteredEntries.findIndex((fe) => fe.index === currentIndex)
  }, [filteredEntries, currentIndex])

  const handleNext = useCallback(() => {
    if (filteredEntries.length === 0) return

    if (
      currentFilteredPos !== -1 &&
      currentFilteredPos < filteredEntries.length - 1
    ) {
      shouldScrollRef.current = true
      setCurrentIndex(filteredEntries[currentFilteredPos + 1].index)
    } else if (currentFilteredPos === -1 && filteredEntries.length > 0) {
      shouldScrollRef.current = true
      setCurrentIndex(filteredEntries[0].index)
    } else {
      navigate("/sync")
    }
  }, [currentFilteredPos, filteredEntries, navigate])

  const handlePrev = useCallback(() => {
    if (filteredEntries.length === 0) return

    if (currentFilteredPos > 0) {
      shouldScrollRef.current = true
      setCurrentIndex(filteredEntries[currentFilteredPos - 1].index)
    } else if (currentFilteredPos === -1 && filteredEntries.length > 0) {
      shouldScrollRef.current = true
      setCurrentIndex(filteredEntries[0].index)
    }
  }, [currentFilteredPos, filteredEntries])

  const updateRating = useCallback(
    (index: number, val: number) => {
      updateEntry(index, { rating: val })
    },
    [updateEntry]
  )

  const entriesWithMissingScores = entries.filter(
    (e) => e.selections.length > 0 && e.selections.some((s) => s.rating === 0)
  ).length

  const handleClearFilters = useCallback(() => {
    setSidebarSearchQuery("")
    setShowMissingOnly(false)
  }, [])

  const resolvedCount = entries.filter((e) => e.selections.length > 0).length

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="font-heading text-xl font-medium tracking-tight">
          No entries to review.
        </p>
        <Button onClick={() => navigate("/import")}>Go to Import</Button>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-7xl animate-in space-y-6 px-1 pb-40 duration-700 fade-in sm:px-6 lg:px-8">
        <ReviewHeader />

        <div className="grid items-start gap-10 lg:grid-cols-12">
          {/* Left Side: Navigation List (Desktop) — top aligns with the
              progress row on the right */}
          <div className="hidden space-y-4 lg:col-span-4 lg:block">
            <ReviewSidebar
              entries={filteredEntries.map((fe) => ({
                ...fe.entry,
                originalIndex: fe.index,
              }))}
              currentIndex={currentIndex}
              onSelectEntry={setCurrentIndex}
              onUpdateRating={updateRating}
              searchQuery={sidebarSearchQuery}
              onSearchChange={setSidebarSearchQuery}
              isFilterActive={showMissingOnly}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Right Side: Progress + Media Selection Area */}
          <div ref={selectionAreaRef} className="space-y-6 lg:col-span-8">
            {/* Progress row — same column as MediaSelectionArea so widths match on desktop */}
            <div className="flex flex-col items-end gap-2">
              {entriesWithMissingScores > 0 && (
                <button
                  onClick={() => setShowMissingOnly(!showMissingOnly)}
                  className={`flex items-center gap-2 rounded-none px-3 py-1 transition-all hover:scale-105 active:scale-95 ${
                    showMissingOnly
                      ? "bg-destructive text-white shadow-lg shadow-destructive/40"
                      : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  }`}
                >
                  <AlertCircle
                    className={`h-3 w-3 ${showMissingOnly ? "animate-pulse" : ""}`}
                  />
                  <span className="text-xs font-black tracking-widest uppercase">
                    {entriesWithMissingScores} Scores Missing
                  </span>
                </button>
              )}
              <div className="flex w-full items-center gap-2">
                <div className="flex w-full min-w-0 flex-1 items-center gap-3 rounded-none border bg-card px-3 py-3 shadow-sm sm:gap-4 sm:px-6">
                  <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    Progress
                  </span>
                  <div className="h-1.5 min-w-15 flex-1 overflow-hidden rounded-none bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-700"
                      style={{
                        width: `${(resolvedCount / entries.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold sm:text-sm">
                    {resolvedCount}/{entries.length}
                  </span>
                </div>

                {/* Mobile List Trigger — same row as progress */}
                <div className="shrink-0 lg:hidden">
                  <ReviewSidebar
                    entries={filteredEntries.map((fe) => ({
                      ...fe.entry,
                      originalIndex: fe.index,
                    }))}
                    currentIndex={currentIndex}
                    onSelectEntry={setCurrentIndex}
                    onUpdateRating={updateRating}
                    isMobile
                    searchQuery={sidebarSearchQuery}
                    onSearchChange={setSidebarSearchQuery}
                    isFilterActive={showMissingOnly}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </div>
            </div>

            <MediaSelectionArea
              currentEntry={currentEntry}
              currentIndex={currentIndex}
              updateEntry={updateEntry}
              onViewDetails={setSelectedDetailsMedia}
              entries={entries}
              onSelectEntry={setCurrentIndex}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredEntries.length > 0 && currentEntry && (
          <ReviewNavigation
            key="review-nav"
            currentIndex={currentFilteredPos >= 0 ? currentFilteredPos : 0}
            entriesCount={filteredEntries.length}
            currentEntrySelectionsCount={currentEntry.selections?.length ?? 0}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </AnimatePresence>

      <MediaDetailsDialog
        media={selectedDetailsMedia}
        onClose={() => setSelectedDetailsMedia(null)}
      />
    </>
  )
}

export default Review
