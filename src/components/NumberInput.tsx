import {
  type FC,
  type MouseEvent,
  type ChangeEvent,
  useState,
  useEffect,
} from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "./ui/button"

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

export const NumberInput: FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.5,
  className = "",
  disabled = false,
}) => {
  const [localValue, setLocalValue] = useState(value.toString())

  useEffect(() => {
    // Sync local value when the prop value changes externally
    if (parseFloat(localValue) !== value) {
      setLocalValue(value.toString())
    }
  }, [value, localValue])

  const handleDecrement = (e: MouseEvent) => {
    e.stopPropagation()
    const newValue = Math.max(min, value - step)
    onChange(newValue)
    setLocalValue(newValue.toString())
  }

  const handleIncrement = (e: MouseEvent) => {
    e.stopPropagation()
    const newValue = Math.min(max, value + step)
    onChange(newValue)
    setLocalValue(newValue.toString())
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value

    // If user types a number after a leading zero (e.g., "05"), strip the zero
    // but preserve it for decimals (e.g., "0.5")
    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
      val = val.substring(1)
    }

    setLocalValue(val)

    const parsed = parseFloat(val)
    if (!isNaN(parsed)) {
      const clamped = Math.min(Math.max(min, parsed), max)
      onChange(clamped)
      // If we clamped (e.g. user typed 11 when max is 10),
      // update localValue to reflect the clamped value
      if (clamped !== parsed) {
        setLocalValue(clamped.toString())
      }
    } else if (val === "") {
      onChange(min)
    }
  }

  const handleBlur = () => {
    // Clean up the input on blur (e.g., if it was "1." it becomes "1")
    setLocalValue(value.toString())
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-none transition-colors hover:bg-primary/20 hover:text-primary"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>

      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onClick={(e) => e.stopPropagation()}
        disabled={disabled}
        className="w-8 [appearance:textfield] border-none bg-transparent p-0 text-center text-sm font-black focus:ring-0 disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-none transition-colors hover:bg-primary/20 hover:text-primary"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}
