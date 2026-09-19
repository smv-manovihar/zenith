import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "@/hooks/useDebounce"

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 500))
    expect(result.current).toBe("initial")
  })

  it("updates debounced value after specified delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "first", delay: 500 } }
    )

    expect(result.current).toBe("first")

    rerender({ value: "second", delay: 500 })
    expect(result.current).toBe("first")

    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(result.current).toBe("first")

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe("second")
  })
})
