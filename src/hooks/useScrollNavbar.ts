import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

export function useScrollNavbar() {
  const navRef = useRef<HTMLElement>(null)
  const lastScrollY = useRef(0)
  const currentTranslateY = useRef(0)
  const location = useLocation()

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    // Ensure transform is continuous without CSS transition delays
    nav.style.transition = "none"

    // Initialize position based on current window scroll
    const startScrollY = Math.max(0, window.scrollY)
    lastScrollY.current = startScrollY

    const navHeight = nav.offsetHeight || 64
    currentTranslateY.current = startScrollY === 0 ? 0 : -navHeight
    nav.style.transform = `translateY(${currentTranslateY.current}px)`

    let rafId: number | null = null

    const updateNavbar = () => {
      if (!nav) return

      const rawScrollY = window.scrollY
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      )
      // Clamp scroll to avoid iOS elastic bounce at edges
      const scrollY = Math.max(0, Math.min(rawScrollY, maxScroll))
      const height = nav.offsetHeight || 64
      const delta = scrollY - lastScrollY.current

      if (scrollY <= 0) {
        // At the absolute top of the page, header is fully visible
        currentTranslateY.current = 0
      } else {
        // 1:1 scroll pace tracking:
        // When scrolling down (delta > 0), navbar moves up (translateY decreases to -height)
        // When scrolling up (delta < 0), navbar moves down (translateY increases to 0)
        currentTranslateY.current = Math.max(
          -height,
          Math.min(0, currentTranslateY.current - delta)
        )
      }

      nav.style.transform = `translateY(${currentTranslateY.current}px)`
      lastScrollY.current = scrollY
      rafId = null
    }

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateNavbar)
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", updateNavbar, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", updateNavbar)
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [location.pathname])

  return navRef
}
