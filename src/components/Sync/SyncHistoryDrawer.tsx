import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Storage, type SyncSessionRecord } from "@/lib/storage"
import {
  History,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RotateCcw,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"

interface SyncHistoryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onResumeErrors?: () => void
}

export const SyncHistoryDrawer: React.FC<SyncHistoryDrawerProps> = ({
  open,
  onOpenChange,
  onResumeErrors,
}) => {
  const [sessions, setSessions] = useState<SyncSessionRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadSessions = async () => {
    setLoading(true)
    try {
      const records = await Storage.getSyncHistorySessions()
      setSessions(records)
    } catch (e) {
      console.warn("Failed to load sync history:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadSessions()
    }
  }, [open])

  const handleClearHistory = async () => {
    await Storage.clearSyncHistory()
    setSessions([])
    toast.success("Sync history cleared.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-none border-primary/20 bg-background p-4 sm:p-6">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase sm:text-xl">
              <History className="h-5 w-5 text-primary" />
              Sync Session History
            </DialogTitle>
            {sessions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 rounded-none px-2 text-xs font-bold text-muted-foreground hover:text-destructive"
                onClick={handleClearHistory}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            View logs from past sync operations and resume incomplete syncs.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <p className="text-xs font-bold text-muted-foreground uppercase">
              Loading sessions...
            </p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-muted-foreground uppercase">
            No sync sessions recorded yet.
          </div>
        ) : (
          <div className="scrollbar-thin max-h-96 space-y-3 overflow-y-auto pr-1">
            {sessions.map((session) => {
              const dateStr = new Date(session.timestamp).toLocaleString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )
              const hasErrors = session.errorCount > 0

              return (
                <div
                  key={session.id}
                  className="space-y-2 border border-border/60 bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-bold text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {dateStr}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="rounded-none text-xs font-bold"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" />
                        {session.successCount} Synced
                      </Badge>
                      {hasErrors && (
                        <Badge
                          variant="destructive"
                          className="rounded-none text-xs font-bold"
                        >
                          <AlertCircle className="mr-1 h-3 w-3" />
                          {session.errorCount} Failed
                        </Badge>
                      )}
                    </div>
                  </div>

                  {session.errors && session.errors.length > 0 && (
                    <div className="space-y-1 rounded-none border border-destructive/20 bg-destructive/5 p-2 text-xs">
                      <p className="font-bold text-destructive uppercase">
                        Failed Items:
                      </p>
                      {session.errors.map((err, i) => (
                        <p
                          key={i}
                          className="truncate text-xs text-muted-foreground"
                        >
                          • <span className="font-bold">{err.title}:</span>{" "}
                          {err.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-between pt-2 border-t border-border">
          {onResumeErrors && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-none text-xs font-bold uppercase"
              onClick={() => {
                onResumeErrors()
                onOpenChange(false)
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Resume Failed Items
            </Button>
          )}
          <Button
            size="sm"
            className="h-9 rounded-none text-xs font-bold uppercase ml-auto"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
