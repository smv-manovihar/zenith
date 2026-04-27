import {
  type FC,
  type MouseEvent,
  type ChangeEvent,
  useState,
  useEffect,
} from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "./ui/button"
import {
  type AniListScoreFormat,
  getScoreConfig,
  POINT_3_EMOJIS,
} from "@/lib/scoreFormat"
import { cn } from "@/lib/utils"

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
  /** When provided, adapts the input control to the AniList score format */
  scoreFormat?: AniListScoreFormat
}

// ── Star rating (POINT_5) ──────────────────────────────────────────────────
const StarInput: FC<{
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  className?: string
}> = ({ value, onChange, disabled, className }) => (
  <div className={cn("flex items-center gap-0.5", className)}>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          onChange(star === value ? 0 : star)
        }}
        className={cn(
          "text-base leading-none transition-all hover:scale-110 disabled:opacity-40",
          star <= value ? "opacity-100" : "opacity-20"
        )}
        aria-label={`${star} star${star !== 1 ? "s" : ""}`}
      >
        ★
      </button>
    ))}
  </div>
)

// ── Smiley rating (POINT_3) ───────────────────────────────────────────────
const SmileyInput: FC<{
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  className?: string
}> = ({ value, onChange, disabled, className }) => (
  <div className={cn("flex items-center gap-1", className)}>
    {[1, 2, 3].map((level) => (
      <button
        key={level}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          onChange(level === value ? 0 : level)
        }}
        className={cn(
          "text-base leading-none transition-all hover:scale-110 disabled:opacity-40",
          level === value ? "scale-110 opacity-100" : "opacity-25"
        )}
        aria-label={POINT_3_EMOJIS[level]}
      >
        {POINT_3_EMOJIS[level]}
      </button>
    ))}
  </div>
)

// ── Main component ────────────────────────────────────────────────────────
export const NumberInput: FC<NumberInputProps> = ({
  value,
  onChange,
  min: minProp,
  max: maxProp,
  step: stepProp,
  className = "",
  disabled = false,
  scoreFormat,
}) => {
  const config = scoreFormat ? getScoreConfig(scoreFormat) : null
  const min = minProp ?? config?.min ?? 0
  const max = maxProp ?? config?.max ?? 10
  const step = stepProp ?? config?.step ?? 0.5

  const [localValue, setLocalValue] = useState(value.toString())

  useEffect(() => {
    if (parseFloat(localValue) !== value) {
      setLocalValue(value.toString())
    }
  }, [value, localValue])

  // Delegate to specialised controls
  if (scoreFormat === "POINT_5") {
    return (
      <StarInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={className}
      />
    )
  }

  if (scoreFormat === "POINT_3") {
    return (
      <SmileyInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={className}
      />
    )
  }

  // ── Numeric stepper (POINT_100 / POINT_10 / POINT_10_DECIMAL / default) ──
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

    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
      val = val.substring(1)
    }

    setLocalValue(val)

    const parsed = parseFloat(val)
    if (!isNaN(parsed)) {
      const clamped = Math.min(Math.max(min, parsed), max)
      onChange(clamped)
      if (clamped !== parsed) {
        setLocalValue(clamped.toString())
      }
    } else if (val === "") {
      onChange(min)
    }
  }

  const handleBlur = () => {
    setLocalValue(value.toString())
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-none transition-colors hover:bg-primary/20 hover:text-primary"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3.5 w-3.5" />
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
        className="w-8 shrink-0 [appearance:textfield] border-none bg-transparent p-0 text-center text-sm font-black focus:ring-0 disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-none transition-colors hover:bg-primary/20 hover:text-primary"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
