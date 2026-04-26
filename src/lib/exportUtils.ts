import { type Selection } from "@/components/ProgressProvider"
import { type AniListScoreFormat } from "@/lib/scoreFormat"

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function generateMalXml(
  selections: { name: string; selection: Selection }[],
  scoreFormat: AniListScoreFormat
) {
  const entries = selections
    .filter(({ selection }) => selection.idMal)
    .map(({ selection }) => {
      const statusMap: Record<string, string> = {
        COMPLETED: "Completed",
        CURRENT: "Watching",
        PLANNING: "Plan to Watch",
        PAUSED: "On-Hold",
        DROPPED: "Dropped",
        REPEATING: "Completed",
      }
      const malStatus = statusMap[selection.anilistStatus] ?? "Completed"
      
      // Normalize score to 0–10 integer for MAL XML
      let malScore = selection.rating
      if (scoreFormat === "POINT_100")
        malScore = Math.round(selection.rating / 10)
      else if (scoreFormat === "POINT_5")
        malScore = Math.round(selection.rating * 2)
      else if (scoreFormat === "POINT_3")
        malScore = selection.rating === 3 ? 9 : selection.rating === 2 ? 5 : 2
      else malScore = Math.round(selection.rating)

      return `  <anime>
    <series_animedb_id>${selection.idMal}</series_animedb_id>
    <series_title><![CDATA[${selection.title}]]></series_title>
    <my_score>${malScore}</my_score>
    <my_status>${malStatus}</my_status>
    <my_watched_episodes>${selection.progress ?? 0}</my_watched_episodes>
    <update_on_import>1</update_on_import>
  </anime>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<myanimelist>
  <myinfo>
    <user_export_type>1</user_export_type>
  </myinfo>
${entries}
</myanimelist>`
}
