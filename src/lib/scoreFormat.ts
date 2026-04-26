/**
 * Zenith Score Format Utilities
 *
 * Handles all 5 AniList score formats:
 *  POINT_100        → 0–100 integer
 *  POINT_10_DECIMAL → 0.0–10.0 (1 decimal)
 *  POINT_10         → 0–10 integer
 *  POINT_5          → 1–5 stars
 *  POINT_3          → 1–3 smileys (1=sad, 2=neutral, 3=happy)
 */

export type AniListScoreFormat =
  | "POINT_100"
  | "POINT_10_DECIMAL"
  | "POINT_10"
  | "POINT_5"
  | "POINT_3"

export interface ScoreConfig {
  min: number
  max: number
  step: number
  /** Human-readable label shown in the UI */
  label: string
  /** Short suffix shown next to a score, e.g. "/10" */
  suffix: string
  /** Whether the score uses a decimal place */
  isDecimal: boolean
}

const CONFIGS: Record<AniListScoreFormat, ScoreConfig> = {
  POINT_100: {
    min: 0,
    max: 100,
    step: 1,
    label: "100-Point",
    suffix: "/100",
    isDecimal: false,
  },
  POINT_10_DECIMAL: {
    min: 0,
    max: 10,
    step: 0.5,
    label: "10-Point Decimal",
    suffix: "/10",
    isDecimal: true,
  },
  POINT_10: {
    min: 0,
    max: 10,
    step: 1,
    label: "10-Point",
    suffix: "/10",
    isDecimal: false,
  },
  POINT_5: {
    min: 0,
    max: 5,
    step: 1,
    label: "5-Star",
    suffix: "★",
    isDecimal: false,
  },
  POINT_3: {
    min: 0,
    max: 3,
    step: 1,
    label: "3-Smiley",
    suffix: "",
    isDecimal: false,
  },
}

export const POINT_3_EMOJIS = ["😞", "😐", "🙂", "😍"] as const // index 0 = unset
export const POINT_5_LABELS = ["", "★", "★★", "★★★", "★★★★", "★★★★★"] as const

export function getScoreConfig(format: AniListScoreFormat): ScoreConfig {
  return CONFIGS[format] ?? CONFIGS["POINT_10_DECIMAL"]
}

/** Render a score value as a human-readable display string */
export function formatScoreDisplay(
  score: number,
  format: AniListScoreFormat
): string {
  if (score === 0) return "—"
  switch (format) {
    case "POINT_5":
      return POINT_5_LABELS[Math.round(score)] ?? "—"
    case "POINT_3":
      return POINT_3_EMOJIS[Math.round(score)] ?? "—"
    case "POINT_10_DECIMAL":
      return `${score.toFixed(1)}/10`
    case "POINT_10":
      return `${Math.round(score)}/10`
    case "POINT_100":
      return `${Math.round(score)}/100`
    default:
      return `${score}`
  }
}

/**
 * Normalise a raw parsed score (assumed to be on a 0–10 scale, i.e. what
 * the parser currently produces) into the user's preferred format.
 */
export function normalizeScoreToFormat(
  score10: number,
  targetFormat: AniListScoreFormat
): number {
  if (score10 === 0) return 0
  switch (targetFormat) {
    case "POINT_100":
      return Math.round(score10 * 10)
    case "POINT_10_DECIMAL":
      return Math.round(score10 * 2) / 2 // nearest 0.5
    case "POINT_10":
      return Math.round(score10)
    case "POINT_5":
      return Math.min(5, Math.max(1, Math.round(score10 / 2)))
    case "POINT_3":
      if (score10 >= 7) return 3
      if (score10 >= 4) return 2
      return 1
    default:
      return score10
  }
}

/**
 * Convert a score in any format back to the 0–10 baseline used internally
 * when storing/sending to AniList (AniList API accepts the raw format value).
 */
export function scoreToBaseline10(
  score: number,
  format: AniListScoreFormat
): number {
  switch (format) {
    case "POINT_100":
      return score / 10
    case "POINT_5":
      return score * 2
    case "POINT_3":
      return score === 3 ? 9 : score === 2 ? 5 : 2
    default:
      return score
  }
}

/** Returns the AI_PROMPT string adapted for the given score format */
export function getAIPrompt(format: AniListScoreFormat): string {
  const formatInstructions: Record<AniListScoreFormat, string> = {
    POINT_100: `Convert them into a sequentially numbered list where every line exactly matches this pattern: "[Anime Name] ([Score]/100)".

Rules:
1. **Exact format:** Follow this syntax precisely: "1. Spirited Away (86/100)"
2. **Normalize scores:** Convert any score system to a 0–100 integer scale (e.g., 8.6/10 → 86/100; 4.3/5 → 86/100). Round to the nearest integer.
3. **Title standardization:** Use the most common English or Romaji title. Remove any extraneous text, years, or messy formatting.
4. **Zero chatter:** Output ONLY the parsed list. No introductory text, acknowledgments, or explanations.

Data to parse:`,

    POINT_10_DECIMAL: `Convert them into a sequentially numbered list where every line exactly matches this pattern: "[Anime Name] ([Score]/10)".

Rules:
1. **Exact format:** Follow this syntax precisely: "1. Spirited Away (8.6/10)"
2. **Normalize scores:** Convert any score system to a 0.0–10.0 scale with one decimal place (e.g., 86/100 → 8.6/10; 4.3/5 → 8.6/10).
3. **Title standardization:** Use the most common English or Romaji title. Remove any extraneous text, years, or messy formatting.
4. **Zero chatter:** Output ONLY the parsed list. No introductory text, acknowledgments, or explanations.

Data to parse:`,

    POINT_10: `Convert them into a sequentially numbered list where every line exactly matches this pattern: "[Anime Name] ([Score]/10)".

Rules:
1. **Exact format:** Follow this syntax precisely: "1. Spirited Away (9/10)"
2. **Normalize scores:** Convert any score system to a 0–10 integer scale (e.g., 86/100 → 9/10; 4.3/5 → 9/10). Round to the nearest integer.
3. **Title standardization:** Use the most common English or Romaji title. Remove any extraneous text, years, or messy formatting.
4. **Zero chatter:** Output ONLY the parsed list. No introductory text, acknowledgments, or explanations.

Data to parse:`,

    POINT_5: `Convert them into a sequentially numbered list where every line exactly matches this pattern: "[Anime Name] ([Stars] stars)".

Rules:
1. **Exact format:** Follow this syntax precisely: "1. Spirited Away (4 stars)"
2. **Normalize scores:** Convert any score system to a 1–5 star scale (e.g., 8.6/10 → 4 stars; 86/100 → 4 stars; round to nearest integer).
3. **Title standardization:** Use the most common English or Romaji title. Remove any extraneous text, years, or messy formatting.
4. **Zero chatter:** Output ONLY the parsed list. No introductory text, acknowledgments, or explanations.

Data to parse:`,

    POINT_3: `Convert them into a sequentially numbered list where every line exactly matches this pattern: "[Anime Name] ([Rating])" where rating is 1 (didn't like), 2 (liked), or 3 (loved).

Rules:
1. **Exact format:** Follow this syntax precisely: "1. Spirited Away (3)"
2. **Normalize scores:** Convert any score system to 1, 2, or 3 (1 = poor/below average; 2 = average/decent; 3 = good/great). 
3. **Title standardization:** Use the most common English or Romaji title. Remove any extraneous text, years, or messy formatting.
4. **Zero chatter:** Output ONLY the parsed list. No introductory text, acknowledgments, or explanations.

Data to parse:`,
  }

  return `Act as a strict data parsing system. I will provide a raw list of anime titles and ratings below. ${formatInstructions[format] ?? formatInstructions["POINT_10_DECIMAL"]}`
}

/** All available formats as options for a select dropdown */
export const SCORE_FORMAT_OPTIONS: {
  value: AniListScoreFormat
  label: string
}[] = [
  { value: "POINT_10_DECIMAL", label: "10-Point Decimal (8.5/10)" },
  { value: "POINT_10", label: "10-Point (9/10)" },
  { value: "POINT_100", label: "100-Point (85/100)" },
  { value: "POINT_5", label: "5-Star (★★★★☆)" },
  { value: "POINT_3", label: "3-Smiley (😍 / 🙂 / 😞)" },
]
