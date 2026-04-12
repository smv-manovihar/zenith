import React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Star } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const AI_PROMPT = `Act as a strict data parsing system. I will provide a raw list of anime titles and ratings below. Convert them into a sequentially numbered list where every line exactly matches this pattern: "[Anime Name] ([Score]/10)".

Rules:
1. **Exact format:** Follow this syntax precisely: "1. Spirited Away (8.6/10)"
2. **Normalize scores:** Mathematically convert any non-10-point scales into a 10-point scale (e.g., convert 85/100 to 8.5/10; convert 4.5/5 to 9.0/10). Round to one decimal place.
3. **Title standardization:** Use the most common English or Romaji title. Remove any extraneous text, years, or messy formatting from the original input.
4. **Zero chatter:** Output ONLY the parsed list. Do not include any introductory text, acknowledgments, formatting explanations, or concluding remarks. Just the raw data.

Data to parse:
`

export const normalizeTitle = (title: string | null | undefined) => {
  if (!title) return ""
  return title.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export const getScoreStyles = (score: number) => {
  if (score >= 80)
    return {
      color: "text-emerald-500",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
      icon: React.createElement(Star, { className: "h-3 w-3 fill-emerald-500" }),
      label: "EXCELLENT",
    }
  if (score >= 65)
    return {
      color: "text-amber-500",
      border: "border-amber-500/20",
      bg: "bg-amber-500/10",
      icon: React.createElement(Star, { className: "h-3 w-3 fill-amber-500" }),
      label: "POSITIVE",
    }
  return {
    color: "text-muted-foreground",
    border: "border-muted",
    bg: "bg-muted/30",
    icon: React.createElement(Star, { className: "h-3 w-3 fill-muted-foreground" }),
    label: "AVERAGE",
  }
}

/**
 * Strips dangerous tags like <script> and <a> from HTML strings.
 * Used for AniList descriptions.
 */
export const sanitizeHtml = (html: string | null | undefined) => {
  if (!html) return ""
  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove scripts
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gim, (match) => {
      // Just extract the text from inside the link
      return match.replace(/<[^>]+>/g, "")
    })
    .replace(/on\w+="[^"]*"/gim, "") // Remove inline event handlers (onerror, onclick, etc)
    .replace(/javascript:[^"']*/gim, "") // Remove javascript: pseudo-protocol
}