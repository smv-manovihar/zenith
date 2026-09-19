import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SidebarEntry } from "@/components/Review/SidebarEntry"

describe("SidebarEntry component", () => {
  const sampleEntry = {
    name: "Fullmetal Alchemist: Brotherhood",
    rating: 9.5,
    selections: [{ id: 5114 }],
  }

  it("renders entry name and rating correctly", () => {
    render(
      <SidebarEntry
        entry={sampleEntry}
        idx={0}
        isActive={false}
        onClick={vi.fn()}
      />
    )

    expect(
      screen.getByText("Fullmetal Alchemist: Brotherhood")
    ).toBeInTheDocument()
    expect(screen.getByText("Score")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument() // 1 selection badge
  })

  it("triggers onClick when clicked or enter key pressed", () => {
    const handleClick = vi.fn()
    render(
      <SidebarEntry
        entry={sampleEntry}
        idx={0}
        isActive={false}
        onClick={handleClick}
      />
    )

    const entryButton = screen.getByRole("button", {
      name: /Fullmetal Alchemist/i,
    })
    fireEvent.click(entryButton)
    expect(handleClick).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(entryButton, { key: "Enter" })
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  it("displays Missing Score indicator when rating is 0", () => {
    const missingScoreEntry = {
      name: "Unrated Anime",
      rating: 0,
      selections: [],
    }

    render(
      <SidebarEntry
        entry={missingScoreEntry}
        idx={0}
        isActive={false}
        onClick={vi.fn()}
      />
    )

    expect(screen.getByText("Missing")).toBeInTheDocument()
  })

  it("handles batch checkbox toggle without triggering entry selection", () => {
    const handleClick = vi.fn()
    const handleToggleBatch = vi.fn()

    render(
      <SidebarEntry
        entry={sampleEntry}
        idx={2}
        isActive={false}
        onClick={handleClick}
        isSelectedForBatch={false}
        onToggleSelectBatch={handleToggleBatch}
      />
    )

    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)

    expect(handleToggleBatch).toHaveBeenCalledWith(2)
    expect(handleClick).not.toHaveBeenCalled()
  })
})
