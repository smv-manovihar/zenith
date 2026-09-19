import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import React from "react"
import {
  ProgressProvider,
  useAuth,
  useAnimeEntries,
  useProgress,
  type AnimeEntry,
} from "@/components/ProgressProvider"

describe("ProgressProvider and split contexts", () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ProgressProvider>{children}</ProgressProvider>
  )

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("provides authentication state and actions via useAuth", () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()

    act(() => {
      result.current.setToken("mock-anilist-token")
    })
    expect(result.current.token).toBe("mock-anilist-token")

    act(() => {
      result.current.handleLogout()
    })
    expect(result.current.token).toBeNull()
  })

  it("provides entries management and granular update mutations via useAnimeEntries", () => {
    const { result } = renderHook(() => useAnimeEntries(), { wrapper })

    const sampleEntries: AnimeEntry[] = [
      {
        id: "entry-1",
        originalLine: "Steins;Gate 10",
        name: "Steins;Gate",
        rating: 10,
        status: "pending",
        selections: [
          {
            id: 9253,
            idMal: 9253,
            title: "Steins;Gate",
            image: "https://example.com/sg.jpg",
            rating: 10,
            status: "pending",
            anilistStatus: "COMPLETED",
            progress: 24,
            totalEpisodes: 24,
          },
        ],
      },
    ]

    act(() => {
      result.current.setEntries(sampleEntries)
    })

    expect(result.current.entries.length).toBe(1)
    expect(result.current.entries[0].name).toBe("Steins;Gate")

    // Update single entry status
    act(() => {
      result.current.updateEntry(0, { status: "resolved" })
    })
    expect(result.current.entries[0].status).toBe("resolved")

    // Update single selection progress
    act(() => {
      result.current.updateSelection(0, 0, { progress: 12 })
    })
    expect(result.current.entries[0].selections[0].progress).toBe(12)
  })

  it("provides full backward-compatibility via useProgress", () => {
    const { result } = renderHook(() => useProgress(), { wrapper })

    expect(result.current.token).toBeDefined()
    expect(result.current.entries).toBeDefined()
    expect(typeof result.current.setToken).toBe("function")
    expect(typeof result.current.setEntries).toBe("function")
    expect(typeof result.current.updateEntry).toBe("function")
    expect(typeof result.current.updateSelection).toBe("function")
  })
})
