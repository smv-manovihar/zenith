import { describe, it, expect } from "vitest"
import { computeAnimeDiff } from "@/lib/diffUtils"
import { type AnimeEntry } from "@/components/ProgressProvider"

describe("computeAnimeDiff", () => {
  const sampleEntries: AnimeEntry[] = [
    {
      id: "entry-1",
      originalLine: "Attack on Titan 9",
      name: "Attack on Titan",
      rating: 9,
      status: "resolved",
      selections: [
        {
          id: 16498,
          idMal: 16498,
          title: "Attack on Titan",
          image: "https://example.com/aot.jpg",
          rating: 9,
          status: "pending",
          anilistStatus: "COMPLETED",
          progress: 25,
          totalEpisodes: 25,
        },
      ],
    },
    {
      id: "entry-2",
      originalLine: "Death Note 8",
      name: "Death Note",
      rating: 8,
      status: "resolved",
      selections: [
        {
          id: 1535,
          idMal: 1535,
          title: "Death Note",
          image: "https://example.com/dn.jpg",
          rating: 8,
          status: "pending",
          anilistStatus: "COMPLETED",
          progress: 37,
          totalEpisodes: 37,
        },
      ],
    },
  ]

  it("identifies all items as new when remote list is empty", () => {
    const diff = computeAnimeDiff(sampleEntries, [])
    expect(diff.totalCount).toBe(2)
    expect(diff.newCount).toBe(2)
    expect(diff.updatedCount).toBe(0)
    expect(diff.unchangedCount).toBe(0)
    expect(diff.items.every((item) => item.category === "new")).toBe(true)
  })

  it("identifies unchanged items when remote matches local", () => {
    const remoteLists = [
      {
        entries: [
          {
            media: { id: 16498 },
            score: 9,
            status: "COMPLETED",
            progress: 25,
          },
          {
            media: { id: 1535 },
            score: 8,
            status: "COMPLETED",
            progress: 37,
          },
        ],
      },
    ]

    const diff = computeAnimeDiff(sampleEntries, remoteLists)
    expect(diff.totalCount).toBe(2)
    expect(diff.newCount).toBe(0)
    expect(diff.updatedCount).toBe(0)
    expect(diff.unchangedCount).toBe(2)
  })

  it("identifies updated items when score or status differs", () => {
    const remoteLists = [
      {
        entries: [
          {
            media: { id: 16498 },
            score: 7, // Differs from local 9
            status: "COMPLETED",
            progress: 25,
          },
          {
            media: { id: 1535 },
            score: 8,
            status: "CURRENT", // Differs from local COMPLETED
            progress: 10,
          },
        ],
      },
    ]

    const diff = computeAnimeDiff(sampleEntries, remoteLists)
    expect(diff.newCount).toBe(0)
    expect(diff.updatedCount).toBe(2)
    expect(diff.unchangedCount).toBe(0)

    const aot = diff.items.find((i) => i.id === 16498)
    expect(aot?.category).toBe("updated")
    expect(aot?.remoteRating).toBe(7)
    expect(aot?.localRating).toBe(9)
  })

  it("handles mixed categories correctly", () => {
    const remoteLists = [
      {
        entries: [
          {
            media: { id: 16498 },
            score: 9,
            status: "COMPLETED",
            progress: 25,
          },
        ],
      },
    ]

    const diff = computeAnimeDiff(sampleEntries, remoteLists)
    expect(diff.newCount).toBe(1) // Death Note is new
    expect(diff.unchangedCount).toBe(1) // AOT is unchanged
    expect(diff.updatedCount).toBe(0)
    expect(diff.totalCount).toBe(2)
  })
})
