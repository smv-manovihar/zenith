import { useRef, useEffect, useMemo, useCallback, useState } from "react"
import { List, type RowComponentProps } from "react-window" // Note: Ensure types match your wrapper
import { Library, Menu, Search, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SidebarEntry } from "./SidebarEntry"

interface ReviewSidebarProps {
  entries: any[]
  currentIndex: number
  onSelectEntry: (index: number) => void
  onUpdateRating: (index: number, rating: number) => void
  isMobile?: boolean
  searchQuery?: string
  onSearchChange?: (val: string) => void
  isFilterActive?: boolean
}

type SidebarRowProps = {
  entries: any[]
  currentIndex: number
  onSelectEntry: (index: number) => void
  onUpdateRating: (index: number, rating: number) => void
}

const RowComponent = ({
  index,
  style,
  entries,
  currentIndex,
  onSelectEntry,
  onUpdateRating,
}: RowComponentProps<SidebarRowProps>) => {
  const entry = entries[index]
  if (!entry) return null

  return (
    <SidebarEntry
      key={entry.originalIndex}
      entry={entry}
      idx={entry.originalIndex}
      isActive={entry.originalIndex === currentIndex}
      onClick={() => onSelectEntry(entry.originalIndex)}
      onUpdateRating={onUpdateRating}
      style={style}
    />
  )
}

export const ReviewSidebar: React.FC<ReviewSidebarProps> = ({
  entries,
  currentIndex,
  onSelectEntry,
  onUpdateRating,
  isMobile = false,
  searchQuery = "",
  onSearchChange,
  isFilterActive = false,
}) => {
  // 1. Create the list reference
  const listRef = useRef<any>(null)

  const rowProps = useMemo(
    () => ({
      entries,
      currentIndex,
      onSelectEntry,
      onUpdateRating,
    }),
    [entries, currentIndex, onSelectEntry, onUpdateRating]
  )

  // 1. Force scroll on mount or when currentIndex changes
  const [hasScrolledInitial, setHasScrolledInitial] = useState(false)
  const lastListInstance = useRef<any>(null)

  // Callback ref to handle when the List component mounts/unmounts
  const handleListRef = useCallback((node: any) => {
    listRef.current = node
    if (node) {
      // If it's a new instance (mount/drawer open)
      if (node !== lastListInstance.current) {
        node.scrollToRow({
          index: currentIndex,
          align: "center", // Center instead of smart
          behavior: "auto", // Instant scroll on load/open
        })
        lastListInstance.current = node
        setHasScrolledInitial(true)
      }
    } else {
      // Reset when unmounted
      setHasScrolledInitial(false)
      lastListInstance.current = null
    }
  }, [currentIndex])

  // Effect for subsequent currentIndex changes
  useEffect(() => {
    if (listRef.current && hasScrolledInitial && currentIndex >= 0) {
      listRef.current.scrollToRow({
        index: currentIndex,
        align: "center", // Center instead of smart
        behavior: "smooth",
      })
    }
  }, [currentIndex, hasScrolledInitial])

  if (isMobile) {
    return (
      <Drawer>
        <Tooltip>
          <TooltipTrigger asChild>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Menu className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
          </TooltipTrigger>
          <TooltipContent>View Your List</TooltipContent>
        </Tooltip>
        <DrawerContent className="p-0">
          <DrawerHeader className="border-b px-6 py-4">
            <DrawerTitle className="flex items-center justify-between text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
              <div className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                Your List
              </div>
              <div className="flex items-center gap-2">
                {isFilterActive && (
                  <div className="flex items-center gap-1 text-[8px] text-destructive">
                    <Filter className="h-2 w-2" />
                    Missing Only
                  </div>
                )}
                {entries.length} items
              </div>
            </DrawerTitle>
            <div className="relative mt-2">
              <Search className="absolute top-1/2 left-3 h-3 w-3 -translate-y-1/2 text-muted-foreground opacity-50" />
              <Input
                placeholder="Search your list..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-8 rounded-none border-muted bg-muted/20 pl-8 text-xs font-bold"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 hover:bg-muted"
                >
                  <X className="h-2 w-2" />
                </button>
              )}
            </div>
          </DrawerHeader>
          <div className="p-2">
            {(isFilterActive || searchQuery) && entries.length === 0 ? (
              <div className="flex h-[200px] flex-col items-center justify-center p-8 text-center">
                <Search className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                  No matching entries
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-[10px] font-bold text-primary"
                  onClick={() => {
                    onSearchChange?.("")
                    if (isFilterActive) onSelectEntry(-1) // Signal to clear missing filter if needed
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <List
                listRef={handleListRef} // Use the callback ref
                style={{ height: 500, width: "100%" }}
                rowCount={entries.length}
                rowHeight={96}
                rowProps={rowProps}
                rowComponent={RowComponent}
                className="scrollbar-thin"
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Card className="rounded-none border shadow-lg">
      <CardHeader className="border-b bg-muted/5 pb-4">
        <div className="flex items-center justify-between text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
          <div className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Your List
          </div>
          <div className="flex items-center gap-2">
            {isFilterActive && (
              <div className="flex items-center gap-1 text-[9px] text-destructive animate-pulse">
                <Filter className="h-2.5 w-2.5" />
                Missing
              </div>
            )}
            <span className="opacity-50">{entries.length} Items</span>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground opacity-50" />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="h-10 rounded-none border-muted bg-muted/20 pl-9 text-xs font-bold ring-offset-background transition-colors focus-visible:ring-1 focus-visible:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-2">
          {(isFilterActive || searchQuery) && entries.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-4">
                <Search className="h-12 w-12 text-muted-foreground/20" />
                <X className="absolute -right-1 -bottom-1 h-5 w-5 text-destructive/40" />
              </div>
              <p className="text-xs font-black tracking-widest text-muted-foreground uppercase opacity-50">
                No records found matching your current filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-6 rounded-none border-primary/20 font-black tracking-tighter uppercase"
                onClick={() => {
                  onSearchChange?.("")
                  // Parent component handles showMissingOnly via props updated in Review.tsx
                }}
              >
                Clear search query
              </Button>
            </div>
          ) : (
            <List
              listRef={handleListRef} // Use the callback ref
              style={{ height: 600, width: "100%" }}
              rowCount={entries.length}
              rowHeight={96}
              rowProps={rowProps}
              rowComponent={RowComponent}
              className="scrollbar-thin scrollbar-thumb-muted-foreground/10"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
