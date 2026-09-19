import { describe, it, expect } from "vitest"
import {
  formatScoreDisplay,
  getScoreConfig,
  normalizeScoreToFormat,
  SCORE_FORMAT_OPTIONS,
} from "@/lib/scoreFormat"

describe("scoreFormat utilities", () => {
  describe("formatScoreDisplay", () => {
    it("returns dash for 0 score", () => {
      expect(formatScoreDisplay(0, "POINT_10_DECIMAL")).toBe("—")
      expect(formatScoreDisplay(0, "POINT_100")).toBe("—")
      expect(formatScoreDisplay(0, "POINT_5")).toBe("—")
      expect(formatScoreDisplay(0, "POINT_3")).toBe("—")
    })

    it("formats POINT_10_DECIMAL correctly", () => {
      expect(formatScoreDisplay(8.5, "POINT_10_DECIMAL")).toBe("8.5/10")
      expect(formatScoreDisplay(10, "POINT_10_DECIMAL")).toBe("10.0/10")
    })

    it("formats POINT_10 integer correctly", () => {
      expect(formatScoreDisplay(8.4, "POINT_10")).toBe("8/10")
      expect(formatScoreDisplay(10, "POINT_10")).toBe("10/10")
    })

    it("formats POINT_100 correctly", () => {
      expect(formatScoreDisplay(85, "POINT_100")).toBe("85/100")
      expect(formatScoreDisplay(100, "POINT_100")).toBe("100/100")
    })

    it("formats POINT_5 stars correctly", () => {
      expect(formatScoreDisplay(3, "POINT_5")).toBe("★★★")
      expect(formatScoreDisplay(5, "POINT_5")).toBe("★★★★★")
    })

    it("formats POINT_3 smileys correctly", () => {
      expect(formatScoreDisplay(1, "POINT_3")).toBe("😐")
      expect(formatScoreDisplay(2, "POINT_3")).toBe("🙂")
      expect(formatScoreDisplay(3, "POINT_3")).toBe("😍")
    })
  })

  describe("getScoreConfig", () => {
    it("returns correct configuration for each score format", () => {
      const config100 = getScoreConfig("POINT_100")
      expect(config100.max).toBe(100)
      expect(config100.min).toBe(0)
      expect(config100.isDecimal).toBe(false)

      const configDec = getScoreConfig("POINT_10_DECIMAL")
      expect(configDec.max).toBe(10)
      expect(configDec.isDecimal).toBe(true)

      const config5 = getScoreConfig("POINT_5")
      expect(config5.max).toBe(5)
      expect(config5.suffix).toBe("★")
    })
  })

  describe("normalizeScoreToFormat", () => {
    it("converts raw 10-scale score to POINT_100", () => {
      expect(normalizeScoreToFormat(8.5, "POINT_100")).toBe(85)
      expect(normalizeScoreToFormat(10, "POINT_100")).toBe(100)
    })

    it("converts raw 10-scale score to POINT_5", () => {
      expect(normalizeScoreToFormat(8.5, "POINT_5")).toBe(4)
      expect(normalizeScoreToFormat(10, "POINT_5")).toBe(5)
      expect(normalizeScoreToFormat(2, "POINT_5")).toBe(1)
    })

    it("converts raw 10-scale score to POINT_3", () => {
      expect(normalizeScoreToFormat(9, "POINT_3")).toBe(3)
      expect(normalizeScoreToFormat(6, "POINT_3")).toBe(2)
      expect(normalizeScoreToFormat(3, "POINT_3")).toBe(1)
    })

    it("preserves zero score as zero", () => {
      expect(normalizeScoreToFormat(0, "POINT_100")).toBe(0)
      expect(normalizeScoreToFormat(0, "POINT_5")).toBe(0)
      expect(normalizeScoreToFormat(0, "POINT_3")).toBe(0)
    })
  })

  describe("SCORE_FORMAT_OPTIONS", () => {
    it("contains all 5 supported score formats", () => {
      expect(SCORE_FORMAT_OPTIONS.length).toBe(5)
      const values = SCORE_FORMAT_OPTIONS.map((o) => o.value)
      expect(values).toContain("POINT_100")
      expect(values).toContain("POINT_10_DECIMAL")
      expect(values).toContain("POINT_10")
      expect(values).toContain("POINT_5")
      expect(values).toContain("POINT_3")
    })
  })
})
