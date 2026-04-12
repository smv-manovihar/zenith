import { useState, useEffect, useCallback, type FC } from "react"
import { AlertCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useProgress } from "@/components/ProgressProvider"
import { Button } from "@/components/ui/button"

import { ReviewHeader } from "@/components/Review/ReviewHeader"
import { ReviewSidebar } from "@/components/Review/ReviewSidebar"
import { MediaSelectionArea } from "@/components/Review/MediaSelectionArea"
import { ReviewNavigation } from "@/components/Review/ReviewNavigation"
import { MediaDetailsDialog } from "@/components/Review/MediaDetailsDialog"

const Review: FC = () => {
  const { entries, updateEntry, token } = useProgress()
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnresolved = entries.findIndex((e) => e.selections.length === 0)
    return firstUnresolved === -1 ? 0 : firstUnresolved
  })
  const [selectedDetailsMedia, setSelectedDetailsMedia] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate("/")
    }
  }, [token, navigate])

  const currentEntry = entries[currentIndex]

  const handleNext = useCallback(() => {
    if (currentIndex < entries.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      navigate("/sync")
    }
  }, [currentIndex, entries.length, navigate])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex])

  const updateRating = useCallback(
    (index: number, val: number) => {
      updateEntry(index, { rating: val })
    },
    [updateEntry]
  )

  const entriesWithMissingScores = entries.filter(
    (e) => e.selections.length > 0 && e.rating === 0
  ).length

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
    <div className="mx-auto max-w-7xl animate-in space-y-10 px-2 pb-32 duration-700 fade-in sm:px-6 lg:px-8">
      <ReviewHeader
        entriesCount={entries.length}
        resolvedCount={resolvedCount}
        entriesWithMissingScores={entriesWithMissingScores}
      />

      <div className="grid items-start gap-10 lg:grid-cols-12">
        {/* Left Side: Navigation List (Desktop) */}
        <div className="hidden space-y-4 lg:col-span-4 lg:block">
          <ReviewSidebar
            entries={entries}
            currentIndex={currentIndex}
            onSelectEntry={setCurrentIndex}
            onUpdateRating={updateRating}
          />
        </div>

        {/* Right Side: Media Selection Area */}
        <div className="space-y-6 lg:col-span-8">
          <MediaSelectionArea
            currentEntry={currentEntry}
            currentIndex={currentIndex}
            updateEntry={updateEntry}
            onViewDetails={setSelectedDetailsMedia}
            entries={entries}
            onSelectEntry={setCurrentIndex}
          />
        </div>
      </div>

      <ReviewNavigation
        currentIndex={currentIndex}
        entriesCount={entries.length}
        currentEntrySelectionsCount={currentEntry.selections.length}
        onNext={handleNext}
        onPrev={handlePrev}
      />

      <MediaDetailsDialog
        media={selectedDetailsMedia}
        onClose={() => setSelectedDetailsMedia(null)}
      />
    </div>
  )
}

export default Review
