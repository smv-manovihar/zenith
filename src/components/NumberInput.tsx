import React from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "./ui/button"

interface NumberInputProps {
  value: number
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.5,
  className = "",
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newValue = Math.max(min, value - step)
    onChange(newValue.toString())
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newValue = Math.min(max, value + step)
    onChange(newValue.toString())
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary transition-colors"
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
        className="w-10 border-none bg-transparent p-0 text-center text-sm font-black focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary transition-colors"
        onClick={handleIncrement}
        disabled={value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}
