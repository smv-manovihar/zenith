import { useLayoutEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"

const GLYPHS = [
  "ア", "イ", "ウ", "エ", "オ",
  "カ", "キ", "ク", "ケ", "コ",
  "サ", "シ", "ス", "セ", "ソ",
  "タ", "チ", "ツ", "テ", "ト",
  "ナ", "ニ", "ヌ", "ネ", "ノ",
  "ハ", "ヒ", "フ", "ヘ", "ホ",
  "マ", "ミ", "ム", "メ", "モ",
  "ヤ", "ユ", "ヨ",
  "ラ", "リ", "ル", "レ", "ロ",
  "ワ", "ヲ", "ン",
  "ガ", "ギ", "グ", "ゲ", "ゴ",
  "ザ", "ジ", "ズ", "ゼ", "ゾ",
  "ダ", "ヂ", "ヅ", "デ", "ド",
  "バ", "ビ", "ブ", "ベ", "ボ",
  "パ", "ピ", "プ", "ペ", "ポ",
  "ヴ",
]

type Particle = {
  id: number
  x: number
  y: number
  size: number
  glyph: string
  accent: boolean
  opacity: number
  vx: number
  vy: number
  amp: number
  freq: number
  phase: number
}

// Shared drift: every particle in the base layer moves with the same velocity,
// so the jittered grid keeps its even density in all areas instead of drifting
// into clumps and empty patches. Variety comes from the zero-mean
// perpendicular sway + twinkle, which average out and preserve uniformity.
// A smaller extras layer (below) drifts fully randomly on top for organic feel.
const DRIFT_ANGLE = -Math.PI / 2 + 0.18 // gentle upward drift, slight slant
const DRIFT_SPEED = 9 // px/s
const ACCENT_RATIO = 0.45

function makeParticles(count: number): Particle[] {
  // jittered grid: one particle per cell guarantees even density
  // across the whole viewport (no clumps, no empty patches)
  const cols = Math.ceil(Math.sqrt(count * 2))
  const rows = Math.ceil(count / cols)
  const cells: { c: number; r: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) cells.push({ c, r })
  }
  // shuffle so any unused cells are spread out, not clustered at the end
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }

  const vx = Math.cos(DRIFT_ANGLE) * DRIFT_SPEED
  const vy = Math.sin(DRIFT_ANGLE) * DRIFT_SPEED
  // accents take the first slots of the shuffled cells, so the accent color
  // is spread evenly instead of clustering randomly in some areas
  const accentCount = Math.round(count * ACCENT_RATIO)

  return Array.from({ length: count }, (_, i) => {
    const { c, r } = cells[i % cells.length]
    return {
      id: i,
      x: (c + 0.15 + Math.random() * 0.7) / cols,
      y: (r + 0.15 + Math.random() * 0.7) / rows,
      size: 12 + Math.random() * 16,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      accent: i < accentCount,
      opacity: 0.3 + Math.random() * 0.25,
      vx,
      vy,
      amp: 6 + Math.random() * 12,
      freq: 0.2 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
    }
  })
}

// Extras layer: fully random positions and headings, like the original free
// drift. Kept small so the base layer's even coverage dominates.
function makeRandomParticles(n: number, startId: number): Particle[] {
  return Array.from({ length: n }, (_, k) => {
    const angle = Math.random() * Math.PI * 2
    const speed = 6 + Math.random() * 10
    return {
      id: startId + k,
      x: Math.random(),
      y: Math.random(),
      size: 12 + Math.random() * 16,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      accent: Math.random() < ACCENT_RATIO,
      opacity: 0.3 + Math.random() * 0.25,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      amp: 6 + Math.random() * 12,
      freq: 0.2 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
    }
  })
}

const WRAP_MARGIN = 0.06
const REPEL_RADIUS = 160
const REPEL_FORCE = 48

/**
 * Katakana particle field for the landing page.
 * Even density via a jittered grid; all glyphs share one slow drift vector
 * (plus a gentle perpendicular sway + twinkle each) so coverage stays uniform
 * in every area instead of clumping. A smaller extras layer drifts fully
 * randomly on top for organic feel. Wraps toroidally off-screen.
 * Glyphs dodge mouse/touch via rAF.
 * Portaled to document.body so no animated ancestor can re-contain the
 * fixed layer (which used to fade particles in late and make them jump
 * when the page's enter animation ended).
 */
export default function LandingParticles({
  count = 32,
  extras = 8,
}: {
  count?: number
  extras?: number
}) {
  const particles = useMemo(
    () => [...makeParticles(count), ...makeRandomParticles(extras, count)],
    [count, extras]
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<(HTMLDivElement | null)[]>([])
  const pointerRef = useRef({ x: -9999, y: -9999, active: false })

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const n = particles.length
    const fx = particles.map((p) => p.x)
    const fy = particles.map((p) => p.y)
    const repel = particles.map(() => ({ x: 0, y: 0 }))

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      pointerRef.current = {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        active: true,
      }
    }
    const onLeave = () => {
      pointerRef.current.active = false
      pointerRef.current.x = -9999
      pointerRef.current.y = -9999
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerdown", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)

    let raf = 0
    let last = performance.now()
    const start = last
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = (now - start) / 1000
      const rect = el.getBoundingClientRect()
      const w = rect.width || window.innerWidth
      const h = rect.height || window.innerHeight
      const pointer = pointerRef.current

      for (let i = 0; i < n; i++) {
        const node = nodesRef.current[i]
        if (!node) continue
        const p = particles[i]

        // drift along the particle's own random heading, wrap per axis
        fx[i] += (p.vx * dt) / w
        fy[i] += (p.vy * dt) / h
        if (fx[i] < -WRAP_MARGIN) fx[i] += 1 + WRAP_MARGIN * 2
        else if (fx[i] > 1 + WRAP_MARGIN) fx[i] -= 1 + WRAP_MARGIN * 2
        if (fy[i] < -WRAP_MARGIN) fy[i] += 1 + WRAP_MARGIN * 2
        else if (fy[i] > 1 + WRAP_MARGIN) fy[i] -= 1 + WRAP_MARGIN * 2

        // gentle sway perpendicular to the heading
        const sway = Math.sin(t * p.freq + p.phase) * p.amp
        const mag = Math.hypot(p.vx, p.vy) || 1
        const baseX = fx[i] * w + (-p.vy / mag) * sway
        const baseY = fy[i] * h + (p.vx / mag) * sway

        // ease away from mouse/touch
        let tx = 0
        let ty = 0
        if (pointer.active) {
          const dx = baseX + repel[i].x - pointer.x
          const dy = baseY + repel[i].y - pointer.y
          const d = Math.hypot(dx, dy)
          if (d < REPEL_RADIUS && d > 0.01) {
            const f = (1 - d / REPEL_RADIUS) * REPEL_FORCE
            tx = (dx / d) * f
            ty = (dy / d) * f
          }
        }
        repel[i].x += (tx - repel[i].x) * 0.12
        repel[i].y += (ty - repel[i].y) * 0.12

        node.style.left = "0px"
        node.style.top = "0px"
        node.style.transform = `translate3d(${(baseX + repel[i].x).toFixed(1)}px,${(baseY + repel[i].y).toFixed(1)}px,0)`
        node.style.opacity = (
          p.opacity *
          (0.72 + 0.28 * Math.sin(t * p.freq * 1.7 + p.phase))
        ).toFixed(3)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerdown", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
    }
  }, [particles])

  return createPortal(
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {particles.map((p, i) => {
        // t=0 sway offset so the first frame matches the static render
        const mag = Math.hypot(p.vx, p.vy) || 1
        const s0 = Math.sin(p.phase) * p.amp
        return (
          <div
            key={p.id}
            ref={(n) => {
              nodesRef.current[i] = n
            }}
            className="absolute will-change-transform"
            style={{
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              transform: `translate3d(${((-p.vy / mag) * s0).toFixed(1)}px,${((p.vx / mag) * s0).toFixed(1)}px,0)`,
              opacity: p.opacity * (0.72 + 0.28 * Math.sin(p.phase)),
            }}
          >
            <span
              className={`block font-mono font-bold leading-none select-none ${
                p.accent ? "text-primary" : "text-foreground"
              }`}
              style={{ fontSize: `${p.size}px` }}
            >
              {p.glyph}
            </span>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
