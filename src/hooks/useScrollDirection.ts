import { useState, useEffect } from "react"

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(
    null
  )

  useEffect(() => {
    let lastScrollY = window.scrollY

    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      
      // Always show navbar at the very top (first 100px)
      if (scrollY <= 100) {
        setScrollDirection("up")
        lastScrollY = scrollY
        return
      }

      const diff = scrollY - lastScrollY
      const direction = diff > 0 ? "down" : "up"
      
      // Threshold check:
      // Use a larger threshold for hiding (down) to avoid flickering/premature hiding
      // and a smaller threshold for showing (up) for responsiveness.
      const threshold = direction === "down" ? 20 : 10
      
      if (Math.abs(diff) > threshold) {
        if (direction !== scrollDirection) {
          setScrollDirection(direction)
        }
        lastScrollY = scrollY
      }
    }

    window.addEventListener("scroll", updateScrollDirection)
    return () => {
      window.removeEventListener("scroll", updateScrollDirection)
    }
  }, [scrollDirection])

  return scrollDirection
}
