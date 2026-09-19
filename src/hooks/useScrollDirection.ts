import { useState, useEffect } from "react"

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up")

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const updateScrollDirection = () => {
      const scrollY = window.scrollY

      // At the very top, always show navbar smoothly
      if (scrollY <= 10) {
        setScrollDirection("up")
        lastScrollY = scrollY
        ticking = false
        return
      }

      const diff = scrollY - lastScrollY

      // Downward scroll goes up right away (threshold: 10px)
      // Upward scroll comes back very easily and responsively (threshold: 5px)
      if (diff > 10) {
        setScrollDirection("down")
        lastScrollY = scrollY
      } else if (diff < -5) {
        setScrollDirection("up")
        lastScrollY = scrollY
      }

      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  return scrollDirection
}
