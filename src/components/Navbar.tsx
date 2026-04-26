import React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useProgress } from "./ProgressProvider"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
  List,
  Download,
  Search,
} from "lucide-react"
import { useTheme } from "./theme-provider"
import { cn } from "@/lib/utils"
import { useScrollDirection } from "@/hooks/useScrollDirection"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SCORE_FORMAT_OPTIONS } from "@/lib/scoreFormat"

export const Navbar: React.FC = () => {
  const { token, setToken, user } = useProgress()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const scrollDirection = useScrollDirection()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleLogout = () => {
    setToken(null)
    navigate("/")
  }

  const steps = [
    { name: "Import", path: "/import" },
    { name: "Review", path: "/review" },
    { name: "Sync", path: "/sync" },
  ]

  const scoreFormatLabel =
    SCORE_FORMAT_OPTIONS.find((o) => o.value === user?.scoreFormat)?.label ??
    user?.scoreFormat

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false)

  if (!token && location.pathname !== "/") return null

  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50 border-b bg-background/80 backdrop-blur-md transition-transform duration-300",
        scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="container mx-auto px-4">
        {/* Main Row */}
        <div className="flex h-16 items-center justify-between gap-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-xl font-black tracking-widest text-primary uppercase md:text-2xl"
          >
            Zenith
          </Link>

          {/* Desktop Navigation Steps */}
          {token && (
            <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
              {steps.map((step, index) => {
                const isActive = location.pathname === step.path
                const isPast =
                  steps.findIndex((s) => s.path === location.pathname) > index

                return (
                  <React.Fragment key={step.path}>
                    <Link
                      to={step.path}
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-none border text-[10px]",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : isPast
                              ? "border-primary/50 bg-primary/20 text-primary"
                              : "border-muted-foreground/30"
                        )}
                      >
                        {isPast ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="whitespace-nowrap">{step.name}</span>
                    </Link>
                    {index < steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                    )}
                  </React.Fragment>
                )
              })}

              {/* Standalone links */}
              <div className="mx-2 h-4 w-px bg-border" />
              <Link
                to="/list"
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === "/list"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" />
                My List
              </Link>
              <Link
                to="/search"
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === "/search"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Search className="h-3.5 w-3.5" />
                Search
              </Link>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end">
                Switch to {theme === "dark" ? "light" : "dark"} mode
              </TooltipContent>
            </Tooltip>

            {token ? (
              <Popover open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 gap-0 overflow-hidden rounded-full p-0"
                  >
                    <Avatar className="h-full w-full border border-border">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-muted text-sm font-bold">
                        {user?.name?.charAt(0).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  sideOffset={8}
                  className="w-56 rounded-none border-border p-0"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 border-b border-border p-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-muted text-sm font-bold">
                        {user?.name?.charAt(0).toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {user?.name ?? "User"}
                      </p>
                      {scoreFormatLabel && (
                        <p className="text-[10px] text-muted-foreground">
                          {scoreFormatLabel}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick links */}
                  <div className="space-y-px p-1">
                    <PopoverLink
                      to="/list"
                      icon={<List className="h-3.5 w-3.5" />}
                    >
                      My AniList
                    </PopoverLink>
                    <PopoverLink
                      to="/export"
                      icon={<Download className="h-3.5 w-3.5" />}
                    >
                      Export Collection
                    </PopoverLink>
                    {user?.siteUrl && (
                      <a
                        href={user.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center gap-2.5 rounded-none px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View on AniList
                      </a>
                    )}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-border p-1">
                    <Button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5"
                      variant={"destructive"}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              location.pathname !== "/" && (
                <span className="text-sm text-muted-foreground">
                  Not logged in
                </span>
              )
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {token && (
          <div className="border-t border-border/40 py-2 md:hidden">
            <div className="scrollbar-none flex w-full items-center gap-4 overflow-x-auto pb-1">
              {steps.map((step, index) => {
                const isActive = location.pathname === step.path
                const isPast =
                  steps.findIndex((s) => s.path === location.pathname) > index

                return (
                  <React.Fragment key={step.path}>
                    <Link
                      to={step.path}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 text-xs font-medium transition-colors hover:text-primary",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-none border text-[9px]",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : isPast
                              ? "border-primary/50 bg-primary/20 text-primary"
                              : "border-muted-foreground/30"
                        )}
                      >
                        {isPast ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="whitespace-nowrap">{step.name}</span>
                    </Link>
                    {index < steps.length - 1 && (
                      <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// Small helper for popover nav links
function PopoverLink({
  to,
  icon,
  children,
}: {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="flex w-full items-center gap-2.5 rounded-none px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {icon}
      {children}
    </Link>
  )
}
