"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const TooltipContext = React.createContext<{
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
} | null>(null)

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const handleClose = () => setIsOpen(false)
    window.addEventListener("close-all-tooltips", handleClose)
    return () => window.removeEventListener("close-all-tooltips", handleClose)
  }, [])

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen }}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={isOpen}
        onOpenChange={setIsOpen}
        {...props}
      />
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({
  className,
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
  onContextMenu,
  style,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const context = React.useContext(TooltipContext)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    // Close any other open tooltips before starting a new one
    window.dispatchEvent(new CustomEvent("close-all-tooltips"))

    timerRef.current = setTimeout(() => {
      context?.setIsOpen(true)
    }, 500) // 500ms long press threshold

    if (onTouchStart) onTouchStart(e)
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (onTouchEnd) onTouchEnd(e)
  }

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      className={cn("select-none", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("close-all-tooltips"))
        context?.setIsOpen(true)
        if (onContextMenu) onContextMenu(e)
      }}
      style={{
        WebkitTouchCallout: "none",
        ...style,
      }}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-none bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-none data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-none bg-foreground fill-foreground" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
