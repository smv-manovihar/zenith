import { type FC, type MouseEvent, type ChangeEvent } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "./ui/button"

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export const NumberInput: FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.5,
  className = "",
}) => {
  const handleDecrement = (e: MouseEvent) => {
    e.stopPropagation()
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  const handleIncrement = (e: MouseEvent) => {
    e.stopPropagation()
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0
    onChange(val)
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-none transition-colors hover:bg-primary/20 hover:text-primary"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>

      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        className="w-10 [appearance:textfield] border-none bg-transparent p-0 text-center text-sm font-black focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-none transition-colors hover:bg-primary/20 hover:text-primary"
        onClick={handleIncrement}
        disabled={value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}
