import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { NumberInput } from "@/components/NumberInput"

describe("NumberInput component", () => {
  it("renders input with initial value", () => {
    render(<NumberInput value={8} onChange={vi.fn()} />)
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    expect(input.value).toBe("8")
  })

  it("increments value on plus click within bounds", () => {
    const handleChange = vi.fn()
    render(<NumberInput value={8} max={10} step={0.5} onChange={handleChange} />)
    const buttons = screen.getAllByRole("button")
    const plusButton = buttons[1] // Second button is Plus

    fireEvent.click(plusButton)
    expect(handleChange).toHaveBeenCalledWith(8.5)
  })

  it("decrements value on minus click within bounds", () => {
    const handleChange = vi.fn()
    render(<NumberInput value={8} min={0} step={0.5} onChange={handleChange} />)
    const buttons = screen.getAllByRole("button")
    const minusButton = buttons[0] // First button is Minus

    fireEvent.click(minusButton)
    expect(handleChange).toHaveBeenCalledWith(7.5)
  })

  it("clamps manual input to min and max", () => {
    const handleChange = vi.fn()
    render(<NumberInput value={5} min={0} max={10} onChange={handleChange} />)
    const input = screen.getByRole("spinbutton")

    fireEvent.change(input, { target: { value: "15" } })
    expect(handleChange).toHaveBeenCalledWith(10)

    fireEvent.change(input, { target: { value: "-5" } })
    expect(handleChange).toHaveBeenCalledWith(0)
  })

  it("renders 5-star rating buttons when scoreFormat is POINT_5", () => {
    const handleChange = vi.fn()
    render(<NumberInput value={3} scoreFormat="POINT_5" onChange={handleChange} />)
    const starButtons = screen.getAllByRole("button")
    expect(starButtons.length).toBe(5)

    fireEvent.click(starButtons[4]) // Click 5th star
    expect(handleChange).toHaveBeenCalledWith(5)
  })

  it("renders 3-smiley rating buttons when scoreFormat is POINT_3", () => {
    const handleChange = vi.fn()
    render(<NumberInput value={2} scoreFormat="POINT_3" onChange={handleChange} />)
    const smileyButtons = screen.getAllByRole("button")
    expect(smileyButtons.length).toBe(3)

    fireEvent.click(smileyButtons[2]) // Click 3rd smiley
    expect(handleChange).toHaveBeenCalledWith(3)
  })
})
