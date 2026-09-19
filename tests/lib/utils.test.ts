import { describe, it, expect } from "vitest"
import { cn, normalizeTitle, sanitizeHtml, getScoreStyles, getStatusStyles } from "@/lib/utils"

describe("utils", () => {
  describe("cn", () => {
    it("merges class names and handles tailwind conflicts", () => {
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
      expect(cn("bg-red-500", undefined, "bg-blue-500")).toBe("bg-blue-500")
    })
  })

  describe("normalizeTitle", () => {
    it("strips special characters, spaces, and lowercases text", () => {
      expect(normalizeTitle("Attack on Titan: The Final Season!")).toBe("attackontitanthefinalseason")
      expect(normalizeTitle("Steins;Gate 0")).toBe("steinsgate0")
      expect(normalizeTitle("")).toBe("")
      expect(normalizeTitle(null)).toBe("")
    })
  })

  describe("sanitizeHtml", () => {
    it("strips script tags and inline events", () => {
      const dirty = '<script>alert("xss")</script><img src="x" onerror="alert(1)">Hello'
      const clean = sanitizeHtml(dirty)
      expect(clean).not.toContain("<script>")
      expect(clean).not.toContain("onerror")
      expect(clean).toContain("Hello")
    })
  })

  describe("getScoreStyles", () => {
    it("returns correct tiers for scores", () => {
      expect(getScoreStyles(95).label).toBe("MASTERPIECE")
      expect(getScoreStyles(85).label).toBe("EXCELLENT")
      expect(getScoreStyles(75).label).toBe("GOOD")
      expect(getScoreStyles(55).label).toBe("MEDIOCRE")
      expect(getScoreStyles(30).label).toBe("POOR")
    })
  })

  describe("getStatusStyles", () => {
    it("returns corresponding style colors for AniList status", () => {
      expect(getStatusStyles("FINISHED").text).toBe("text-emerald-500")
      expect(getStatusStyles("RELEASING").text).toBe("text-blue-500")
      expect(getStatusStyles("CANCELLED").text).toBe("text-destructive")
    })
  })
})
