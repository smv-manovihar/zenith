import { describe, it, expect } from "vitest"
import { generateMalXml } from "@/lib/exportUtils"
import { type Selection } from "@/components/ProgressProvider"

describe("exportUtils", () => {
  it("generates valid MyAnimeList XML structure", () => {
    const selections: { name: string; selection: Selection }[] = [
      {
        name: "Steins;Gate",
        selection: {
          id: 9253,
          idMal: 9253,
          title: "Steins;Gate",
          image: "https://example.com/sg.jpg",
          rating: 9.5,
          status: "completed",
          anilistStatus: "COMPLETED",
          progress: 24,
          totalEpisodes: 24,
        },
      },
    ]

    const xml = generateMalXml(selections, "POINT_10_DECIMAL")

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain("<myanimelist>")
    expect(xml).toContain("<series_animedb_id>9253</series_animedb_id>")
    expect(xml).toContain("<series_title><![CDATA[Steins;Gate]]></series_title>")
    expect(xml).toContain("<my_score>10</my_score>")
    expect(xml).toContain("<my_status>Completed</my_status>")
    expect(xml).toContain("<my_watched_episodes>24</my_watched_episodes>")
    expect(xml).toContain("</myanimelist>")
  })

  it("filters out items without idMal", () => {
    const selections: { name: string; selection: Selection }[] = [
      {
        name: "Anime Without MAL ID",
        selection: {
          id: 99999,
          idMal: null,
          title: "Anime Without MAL ID",
          image: "",
          rating: 7,
          status: "completed",
          anilistStatus: "COMPLETED",
          progress: 12,
          totalEpisodes: 12,
        },
      },
    ]

    const xml = generateMalXml(selections, "POINT_10")
    expect(xml).not.toContain("<series_animedb_id>")
    expect(xml).toContain("<myinfo>")
  })

  it("maps different AniList statuses to MyAnimeList equivalents", () => {
    const selections: { name: string; selection: Selection }[] = [
      {
        name: "Watching Show",
        selection: {
          id: 1,
          idMal: 1,
          title: "Watching Show",
          image: "",
          rating: 8,
          status: "pending",
          anilistStatus: "CURRENT",
          progress: 5,
          totalEpisodes: 12,
        },
      },
      {
        name: "Plan to Watch Show",
        selection: {
          id: 2,
          idMal: 2,
          title: "Plan to Watch Show",
          image: "",
          rating: 0,
          status: "pending",
          anilistStatus: "PLANNING",
          progress: 0,
          totalEpisodes: 24,
        },
      },
    ]

    const xml = generateMalXml(selections, "POINT_10")
    expect(xml).toContain("<my_status>Watching</my_status>")
    expect(xml).toContain("<my_status>Plan to Watch</my_status>")
  })
})
