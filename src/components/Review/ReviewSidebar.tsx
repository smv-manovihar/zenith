import React from "react"
import { List, type RowComponentProps } from "react-window"
import { Library, Menu } from "lucide-react"
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
      key={index}
      entry={entry}
      idx={index}
      isActive={index === currentIndex}
      onClick={() => onSelectEntry(index)}
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
}) => {
  const rowProps = React.useMemo(
    () => ({
      entries,
      currentIndex,
      onSelectEntry,
      onUpdateRating,
    }),
    [entries, currentIndex, onSelectEntry, onUpdateRating]
  )

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
            <DrawerTitle className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
              <Library className="h-4 w-4" />
              Your List
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-2">
            <List
              style={{ height: 500, width: "100%" }}
              rowCount={entries.length}
              rowHeight={96}
              rowProps={rowProps}
              rowComponent={RowComponent}
              className="scrollbar-thin"
            />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Card className="rounded-none border shadow-lg">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2 text-xs font-black tracking-[0.2em] text-muted-foreground uppercase">
          <Library className="h-4 w-4" />
          Your List
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-2">
          <List
            style={{ height: 600, width: "100%" }}
            rowCount={entries.length}
            rowHeight={96}
            rowProps={rowProps}
            rowComponent={RowComponent}
            className="scrollbar-thin"
          />
        </div>
      </CardContent>
    </Card>
  )
}
