import React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useProgress } from "./ProgressProvider"
import { Button } from "@/components/ui/button"
import { LogOut, CheckCircle2, ArrowRight, Sun, Moon } from "lucide-react"
import { useTheme } from "./theme-provider"
import { cn } from "@/lib/utils"
import { useScrollDirection } from "@/hooks/useScrollDirection"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  if (!token && location.pathname !== "/") return null

  return (
    <nav
      className={cn(
        "fixed top-0 right-0 left-0 z-50 border-b bg-background/80 backdrop-blur-md transition-transform duration-300",
        scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
      )}
    >
      <div className="container mx-auto px-4">
        {/* Main Row: Logo, Desktop Nav, and Logout */}
        <div className="flex h-16 items-center justify-between gap-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-xl font-black tracking-widest text-primary uppercase md:text-2xl"
          >
            Zenith
          </Link>

          {/* Row 1 - Desktop Navigation Steps */}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 gap-0 rounded-full p-0 overflow-hidden hover:bg-primary/5 active:scale-95 transition-all ring-offset-background focus-visible:outline-none focus-visible:ring-2"
                  >
                    <Avatar className="h-full w-full border-2 border-primary/20 transition-transform group-hover:scale-105">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-primary/10 font-bold text-primary">
                        {user?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 mt-2 rounded-2xl border-primary/10 bg-background/95 backdrop-blur-xl shadow-2xl p-2 pb-1">
                  <div className="flex flex-col items-center gap-3 p-4 pt-6 text-center">
                    <Avatar className="h-20 w-20 border-4 border-primary/10 shadow-xl">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="text-2xl bg-primary/10 font-black text-primary">
                        {user?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-xl font-black tracking-tight leading-none truncate max-w-[200px]">
                        {user?.name || "User"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="mx-2 bg-primary/5" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex h-12 items-center gap-3 px-4 focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-xl transition-all"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-widest">Sign Out from Zenith</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              location.pathname !== "/" && (
                <span className="text-sm text-muted-foreground">
                  Not logged in
                </span>
              )
            )}
          </div>
        </div>

        {/* Row 2: Mobile Navigation Steps ONLY */}
        {token && (
          <div className="border-t border-border/40 py-3 md:hidden">
            <div className="scrollbar-none flex w-full items-center justify-between gap-2 overflow-x-auto pb-1">
              {steps.map((step, index) => {
                const isActive = location.pathname === step.path
                const isPast =
                  steps.findIndex((s) => s.path === location.pathname) > index

                return (
                  <React.Fragment key={step.path}>
                    <Link
                      to={step.path}
                      className={cn(
                        "flex shrink-0 items-center gap-2 text-xs font-medium transition-colors hover:text-primary",
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
