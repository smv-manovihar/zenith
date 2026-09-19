import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MediaCard } from "@/components/Review/MediaCard"
import { TooltipProvider } from "@/components/ui/tooltip"

describe("MediaCard component", () => {
  const sampleMedia = {
    id: 16498,
    title: {
      english: "Attack on Titan",
      romaji: "Shingeki no Kyojin",
    },
    coverImage: {
      large: "https://example.com/aot.jpg",
      medium: "https://example.com/aot_med.jpg",
    },
    format: "TV",
    episodes: 25,
    status: "FINISHED",
    averageScore: 85,
    description: "Centuries ago, mankind was slaughtered by titans...",
    studios: {
      nodes: [{ name: "WIT Studio", isAnimationStudio: true }],
    },
    season: "SPRING",
    seasonYear: 2013,
    siteUrl: "https://anilist.co/anime/16498",
  }

  const renderWithTooltip = (ui: React.ReactElement) => {
    return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>)
  }

  it("renders media title, format, episodes, and studios", () => {
    renderWithTooltip(
      <MediaCard
        media={sampleMedia}
        isSelected={false}
        onSelect={vi.fn()}
        onViewDetails={vi.fn()}
      />
    )

    expect(screen.getAllByText("Attack on Titan")[0]).toBeInTheDocument()
    expect(screen.getByText("WIT Studio")).toBeInTheDocument()
    expect(screen.getAllByText("TV")[0]).toBeInTheDocument()
    expect(screen.getByText("FINISHED")).toBeInTheDocument()
  })

  it("triggers onSelect when select button is clicked", () => {
    const handleSelect = vi.fn()
    renderWithTooltip(
      <MediaCard
        media={sampleMedia}
        isSelected={false}
        onSelect={handleSelect}
        onViewDetails={vi.fn()}
      />
    )

    const selectButton = screen.getByRole("button", { name: /Select This/i })
    fireEvent.click(selectButton)
    expect(handleSelect).toHaveBeenCalledWith(sampleMedia)
  })

  it("triggers onViewDetails when details icon or cover image is clicked", () => {
    const handleViewDetails = vi.fn()
    renderWithTooltip(
      <MediaCard
        media={sampleMedia}
        isSelected={false}
        onSelect={vi.fn()}
        onViewDetails={handleViewDetails}
      />
    )

    const coverImage = screen.getByAltText("Attack on Titan")
    fireEvent.click(coverImage)
    expect(handleViewDetails).toHaveBeenCalledWith(sampleMedia)
  })

  it("shows score and status controls when card is selected", () => {
    const handleUpdateRating = vi.fn()
    renderWithTooltip(
      <MediaCard
        media={sampleMedia}
        isSelected={true}
        onSelect={vi.fn()}
        onViewDetails={vi.fn()}
        rating={9}
        onUpdateRating={handleUpdateRating}
        status="COMPLETED"
      />
    )

    expect(screen.getByText("Score")).toBeInTheDocument()
    const inputs = screen.getAllByRole("spinbutton")
    expect(inputs.length).toBeGreaterThan(0)
  })
})
