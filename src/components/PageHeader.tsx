import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { HelpSectionData } from "@/components/PageHelp"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  /** Where the back button goes. Defaults to history back. */
  backTo?: string
  backLabel?: string
  /** Hides the back button. */
  hideBack?: boolean
  /** Title shown in the help dialog. Defaults to `Help`. */
  helpTitle?: string
  /** Navigable help sections. Shows one section at a time. */
  helpSections?: HelpSectionData[]
  /** Fallback explainer content. Used only when helpSections is omitted. */
  helpContent?: ReactNode
  /** Extra action buttons rendered on the right side of the header. */
  actions?: ReactNode
}

export function PageHeader({
  title,
  description,
  backTo,
  backLabel = "Go back",
  hideBack = false,
  helpTitle,
  helpSections,
  helpContent,
  actions,
}: PageHeaderProps) {
  const navigate = useNavigate()
  const [helpOpen, setHelpOpen] = useState(false)
  const [activeHelpIndex, setActiveHelpIndex] = useState(0)

  const handleBack = () => {
    if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  const resolvedHelpTitle = helpTitle ?? "Help"
  const hasHelp = (helpSections && helpSections.length > 0) || helpContent
  const activeSection = helpSections?.[activeHelpIndex]

  const openHelp = () => {
    setActiveHelpIndex(0)
    setHelpOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          {!hideBack && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-none"
              onClick={handleBack}
              aria-label={backLabel}
              title={backLabel}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight uppercase sm:text-2xl md:text-3xl">
                {title}
              </h2>
              {hasHelp && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 rounded-none text-muted-foreground hover:text-primary"
                      onClick={openHelp}
                      aria-label="Show help"
                    >
                      <CircleHelp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    What do I do here?
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {description && (
              <p className="mt-1 max-w-lg text-xs font-medium text-muted-foreground sm:text-sm">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {hasHelp && (
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-none border-primary/10 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm font-black tracking-tight uppercase">
                {resolvedHelpTitle}
              </DialogTitle>
              <DialogDescription asChild>
                {helpSections && helpSections.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {helpSections.map((section, index) => (
                        <button
                          key={section.title}
                          type="button"
                          onClick={() => setActiveHelpIndex(index)}
                          className={cn(
                            "rounded-none border px-2.5 py-1 text-xs font-black tracking-widest uppercase transition-colors",
                            index === activeHelpIndex
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          )}
                        >
                          {section.title}
                        </button>
                      ))}
                    </div>
                    {activeSection && (
                      <div
                        key={activeSection.title}
                        className="text-xs leading-relaxed font-medium text-muted-foreground sm:text-sm"
                      >
                        {activeSection.content}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 pt-1 text-xs leading-relaxed font-medium text-muted-foreground sm:text-sm">
                    {helpContent}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
