import { type AnimeEntry, type Selection } from "@/components/ProgressProvider"

export type DiffCategory = "new" | "updated" | "unchanged"

export interface AnimeDiffItem {
  id: number
  idMal?: number | null
  title: string
  image: string
  entryName: string
  category: DiffCategory
  localRating: number
  remoteRating?: number
  localStatus: string
  remoteStatus?: string
  localProgress: number
  remoteProgress?: number
  selection: Selection
  entryIndex: number
  selectionIndex: number
}

export interface DiffSummary {
  newCount: number
  updatedCount: number
  unchangedCount: number
  totalCount: number
  items: AnimeDiffItem[]
}

export function computeAnimeDiff(
  entries: AnimeEntry[],
  remoteLists: any[] = []
): DiffSummary {
  // Map of remote mediaId -> remote media item entry
  const remoteMap = new Map<number, any>()
  for (const list of remoteLists) {
    if (list?.entries && Array.isArray(list.entries)) {
      for (const item of list.entries) {
        if (item?.media?.id) {
          remoteMap.set(item.media.id, item)
        }
      }
    }
  }

  const items: AnimeDiffItem[] = []
  let newCount = 0
  let updatedCount = 0
  let unchangedCount = 0

  entries.forEach((entry, entryIndex) => {
    entry.selections.forEach((selection, selectionIndex) => {
      const remote = remoteMap.get(selection.id)

      if (!remote) {
        newCount++
        items.push({
          id: selection.id,
          idMal: selection.idMal,
          title: selection.title,
          image: selection.image,
          entryName: entry.name,
          category: "new",
          localRating: selection.rating,
          localStatus: selection.anilistStatus,
          localProgress: selection.progress,
          selection,
          entryIndex,
          selectionIndex,
        })
      } else {
        const remoteScore = remote.score ?? 0
        const remoteStatus = remote.status ?? "COMPLETED"
        const remoteProgress = remote.progress ?? 0

        // Check if ratings, status, or progress differ
        const hasScoreDiff = Math.abs(remoteScore - selection.rating) > 0.001
        const hasStatusDiff = remoteStatus !== selection.anilistStatus
        const hasProgressDiff = remoteProgress !== selection.progress

        if (hasScoreDiff || hasStatusDiff || hasProgressDiff) {
          updatedCount++
          items.push({
            id: selection.id,
            idMal: selection.idMal,
            title: selection.title,
            image: selection.image,
            entryName: entry.name,
            category: "updated",
            localRating: selection.rating,
            remoteRating: remoteScore,
            localStatus: selection.anilistStatus,
            remoteStatus,
            localProgress: selection.progress,
            remoteProgress,
            selection,
            entryIndex,
            selectionIndex,
          })
        } else {
          unchangedCount++
          items.push({
            id: selection.id,
            idMal: selection.idMal,
            title: selection.title,
            image: selection.image,
            entryName: entry.name,
            category: "unchanged",
            localRating: selection.rating,
            remoteRating: remoteScore,
            localStatus: selection.anilistStatus,
            remoteStatus,
            localProgress: selection.progress,
            remoteProgress,
            selection,
            entryIndex,
            selectionIndex,
          })
        }
      }
    })
  })

  return {
    newCount,
    updatedCount,
    unchangedCount,
    totalCount: items.length,
    items,
  }
}
