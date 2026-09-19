"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

interface TooltipContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean, isTouch?: boolean) => void
  setTriggerRef: (node: HTMLElement | null) => void
  setContentRef: (node: HTMLElement | null) => void
  isHolding: boolean
  setIsHolding: (holding: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

function Tooltip({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const [isHolding, setIsHolding] = React.useState(false)
  const isTouchRef = React.useRef(false)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLElement | null>(null)

  const setTriggerRef = React.useCallback((node: HTMLElement | null) => {
    triggerRef.current = node
  }, [])

  const setContentRef = React.useCallback((node: HTMLElement | null) => {
    contentRef.current = node
  }, [])

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
      if (!nextOpen) {
        isTouchRef.current = false
        setIsHolding(false)
      }
    },
    [isControlled, onOpenChange]
  )

  const setIsOpen = React.useCallback(
    (nextOpen: boolean, isTouch: boolean = false) => {
      if (isTouch) {
        isTouchRef.current = true
      }
      handleOpenChange(nextOpen)
    },
    [handleOpenChange]
  )

  // Listen for global close-all-tooltips event
  React.useEffect(() => {
    const handleClose = () => {
      if (isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener("close-all-tooltips", handleClose)
    return () => window.removeEventListener("close-all-tooltips", handleClose)
  }, [isOpen, setIsOpen])

  // Dismissal listeners when tooltip is open
  React.useEffect(() => {
    if (!isOpen) return

    // 1. Auto-dismiss timer when opened via touch hold
    let autoDismissTimer: ReturnType<typeof setTimeout> | null = null
    if (isTouchRef.current) {
      autoDismissTimer = setTimeout(() => {
        setIsOpen(false)
      }, 3500)
    }

    // 2. Dismiss on scroll or viewport move
    const handleScrollOrMove = (e: Event) => {
      if (contentRef.current && contentRef.current.contains(e.target as Node)) {
        return
      }
      setIsOpen(false)
    }

    // 3. Dismiss on pointerdown / touchstart outside
    const handlePointerDownOutside = (e: PointerEvent | MouseEvent | TouchEvent) => {
      const target = e.target as Node | null
      if (!target) return

      if (
        (triggerRef.current && triggerRef.current.contains(target)) ||
        (contentRef.current && contentRef.current.contains(target))
      ) {
        return
      }

      setIsOpen(false)
    }

    // 4. Dismiss on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("scroll", handleScrollOrMove, { capture: true, passive: true })
    window.addEventListener("resize", handleScrollOrMove, { passive: true })
    document.addEventListener("pointerdown", handlePointerDownOutside, { capture: true })
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      if (autoDismissTimer) clearTimeout(autoDismissTimer)
      window.removeEventListener("scroll", handleScrollOrMove, { capture: true })
      window.removeEventListener("resize", handleScrollOrMove)
      document.removeEventListener("pointerdown", handlePointerDownOutside, { capture: true })
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, setIsOpen])

  return (
    <TooltipContext.Provider
      value={{
        isOpen,
        setIsOpen,
        setTriggerRef,
        setContentRef,
        isHolding,
        setIsHolding,
      }}
    >
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({
  className,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  onClick,
  onContextMenu,
  style,
  ref,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const context = React.useContext(TooltipContext)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = React.useRef<{ x: number; y: number } | null>(null)
  const didLongPressRef = React.useRef(false)
  const suppressClickUntilRef = React.useRef<number>(0)

  const clearHoldTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    context?.setIsHolding(false)
  }, [context])

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      startPosRef.current = { x: touch.clientX, y: touch.clientY }
      didLongPressRef.current = false

      clearHoldTimer()
      context?.setIsHolding(true)

      window.dispatchEvent(new CustomEvent("close-all-tooltips"))

      timerRef.current = setTimeout(() => {
        didLongPressRef.current = true
        suppressClickUntilRef.current = Date.now() + 600
        context?.setIsHolding(false)
        context?.setIsOpen(true, true)

        try {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(15)
          }
        } catch {
          // Ignore
        }
      }, 400)
    }

    onTouchStart?.(e)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (startPosRef.current && e.touches.length > 0) {
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - startPosRef.current.x)
      const dy = Math.abs(touch.clientY - startPosRef.current.y)
      if (dx > 8 || dy > 8) {
        clearHoldTimer()
      }
    }
    onTouchMove?.(e)
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    clearHoldTimer()
    startPosRef.current = null
    onTouchEnd?.(e)
  }

  const handleTouchCancel = (e: React.TouchEvent<HTMLButtonElement>) => {
    clearHoldTimer()
    startPosRef.current = null
    onTouchCancel?.(e)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (didLongPressRef.current || Date.now() < suppressClickUntilRef.current) {
      e.preventDefault()
      e.stopPropagation()
      didLongPressRef.current = false
      return
    }

    if (context?.isOpen) {
      context.setIsOpen(false)
    }

    onClick?.(e)
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (didLongPressRef.current || startPosRef.current) {
      e.preventDefault()
    }
    onContextMenu?.(e)
  }

  const handleRef = (node: HTMLButtonElement | null) => {
    context?.setTriggerRef(node)
    if (typeof ref === "function") {
      ref(node)
    } else if (ref && typeof ref === "object") {
      ;(ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
    }
  }

  return (
    <TooltipPrimitive.Trigger
      ref={handleRef}
      data-slot="tooltip-trigger"
      data-holding={context?.isHolding ? "true" : undefined}
      className={cn(
        "select-none transition-transform duration-200 data-[holding=true]:scale-95",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        touchAction: "manipulation",
        ...style,
      }}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ref,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const context = React.useContext(TooltipContext)

  const handleRef = (node: HTMLDivElement | null) => {
    context?.setContentRef(node)
    if (typeof ref === "function") {
      ref(node)
    } else if (ref && typeof ref === "object") {
      ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    }
  }

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={handleRef}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 inline-flex w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-none bg-foreground px-3 py-1.5 text-xs text-background shadow-md backdrop-blur-xs select-none has-data-[slot=kbd]:pr-1.5",
          "data-[side=bottom]:slide-in-from-top-1.5 data-[side=left]:slide-in-from-right-1.5 data-[side=right]:slide-in-from-left-1.5 data-[side=top]:slide-in-from-bottom-1.5",
          "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
          "data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0 data-[state=instant-open]:zoom-in-95",
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          "duration-150 ease-out **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-none",
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
