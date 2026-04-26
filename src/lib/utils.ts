import React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Star } from "lucide-react"
import type { AniListScoreFormat } from "./scoreFormat"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// AI_PROMPT is now format-aware — import getAIPrompt from "./scoreFormat" instead.

export const normalizeTitle = (title: string | null | undefined) => {
  if (!title) return ""
  return title.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/**
 * Normalises a score from any AniList format to a 0–100 baseline for
 * consistent threshold comparisons in getScoreStyles.
 */
function toBaseline100(score: number, format?: AniListScoreFormat): number {
  if (!format) return score // averageScore is 0-100
  switch (format) {
    case "POINT_10_DECIMAL":
    case "POINT_10":
      return score * 10
    case "POINT_5":
      return (score / 5) * 100
    case "POINT_3":
      return (score / 3) * 100
    case "POINT_100":
    default:
      return score
  }
}

export const getScoreStyles = (
  score: number,
  format?: AniListScoreFormat
) => {
  const s = toBaseline100(score, format)
  if (s >= 90)
    return {
      color: "text-yellow-400",
      border: "border-yellow-400/20",
      bg: "bg-yellow-400/5",
      icon: React.createElement(Star, {
        className: "h-3 w-3 fill-yellow-400",
      }),
      label: "MASTERPIECE",
    }
  if (s >= 80)
    return {
      color: "text-emerald-500",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
      icon: React.createElement(Star, { className: "h-3 w-3 fill-emerald-500" }),
      label: "EXCELLENT",
    }
  if (s >= 70)
    return {
      color: "text-blue-500",
      border: "border-blue-500/20",
      bg: "bg-blue-500/10",
      icon: React.createElement(Star, { className: "h-3 w-3 fill-blue-500" }),
      label: "GOOD",
    }
  if (s >= 50)
    return {
      color: "text-zinc-500",
      border: "border-zinc-500/20",
      bg: "bg-zinc-500/10",
      icon: React.createElement(Star, { className: "h-3 w-3 fill-zinc-500" }),
      label: "MEDIOCRE",
    }
  return {
    color: "text-destructive",
    border: "border-destructive/20",
    bg: "bg-destructive/10",
    icon: React.createElement(Star, { className: "h-3 w-3 fill-destructive" }),
    label: "POOR",
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

export const getStatusStyles = (status: string) => {
  switch (status) {
    case "FINISHED":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        border: "border-emerald-500/20",
      }
    case "RELEASING":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-500",
        border: "border-blue-500/20",
      }
    case "NOT_YET_RELEASED":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        border: "border-amber-500/20",
      }
    case "CANCELLED":
      return {
        bg: "bg-destructive/10",
        text: "text-destructive",
        border: "border-destructive/20",
      }
    case "HIATUS":
      return {
        bg: "bg-muted/10",
        text: "text-muted-foreground",
        border: "border-muted",
      }
    default:
      return {
        bg: "bg-primary/10",
        text: "text-primary",
        border: "border-primary/20",
      }
  }
}