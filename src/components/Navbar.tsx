import React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useProgress } from "./ProgressProvider"
import { Button } from "@/components/ui/button"
import { LogOut, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export const Navbar: React.FC = () => {
  const { token, setToken } = useProgress()
  const location = useLocation()
  const navigate = useNavigate()

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
    <nav className="fixed top-0 right-0 left-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-black tracking-widest text-primary uppercase"
        >
          Zenith
        </Link>

        {token && (
          <div className="hidden items-center gap-8 md:flex">
            {steps.map((step, index) => {
              const isActive = location.pathname === step.path
              const isPast =
                steps.findIndex((s) => s.path === location.pathname) > index

              return (
                <Link
                  key={step.path}
                  to={step.path}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[10px]",
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
                  {step.name}
                  {index < steps.length - 1 && (
                    <ArrowRight className="ml-2 h-4 w-4 text-muted-foreground/30" />
                  )}
                </Link>
              )
            })}
          </div>
        )}

        <div className="flex items-center gap-4">
          {token ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Not logged in</span>
          )}
        </div>
      </div>
    </nav>
  )
}
