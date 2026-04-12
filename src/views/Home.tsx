import React, { useState, useRef, useEffect } from "react"
import { useProgress } from "@/components/ProgressProvider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  LogIn,
  Sparkles,
  LayoutList,
  RefreshCcw,
  ChevronRight,
  Terminal,
  ExternalLink,
  AlertTriangle,
  Info,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"

const Home: React.FC = () => {
  const { clientId, token } = useProgress()
  const [showGuide, setShowGuide] = useState(false)
  const guideRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (showGuide && guideRef.current) {
      guideRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [showGuide])

  const handleLogin = () => {
    if (!clientId) return
    const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=token`
    window.location.href = authUrl
  }

  const isConfigMissing = !clientId
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"

  return (
    <div className="mx-auto max-w-5xl animate-in space-y-16 px-4 py-12 duration-1000 fade-in">
      {/* Hero Section */}
      <div className="space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="bg-linear-to-b from-foreground to-muted-foreground bg-clip-text text-5xl leading-[1.1] font-black tracking-tighter text-transparent md:text-6xl lg:text-8xl">
            Sync Your <br className="hidden md:block" />
            <span className="text-primary">Offline</span> Watch Lists{" "}
            <br className="hidden md:block" />
            to <span className="text-primary">AniList</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed font-medium text-muted-foreground">
            Simple way to sync your anime watch list to AniList.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 pt-6">
          {isLocal && isConfigMissing ? (
            <div className="max-w-md space-y-4 rounded-none border border-destructive/20 bg-destructive/5 p-6">
              <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-destructive uppercase">
                <AlertTriangle className="h-4 w-4" />
                Configuration Required
              </div>
              <p className="text-sm text-muted-foreground">
                Please set your{" "}
                <code className="rounded-none bg-destructive/10 px-2 py-0.5 text-destructive">
                  VITE_ANILIST_CLIENT_ID
                </code>{" "}
                in the{" "}
                <code className="rounded-none bg-destructive/10 px-2 py-0.5 text-destructive">
                  .env
                </code>{" "}
                file to enable Zenith.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuide(true)}
                className="border-destructive/30 hover:bg-destructive/10"
              >
                See Setup Instructions
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row">
              {!token ? (
                <Button
                  size="lg"
                  className="group h-16 gap-3 rounded-none px-10 text-xl font-black shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
                  onClick={handleLogin}
                >
                  <LogIn className="h-6 w-6 transition-transform group-hover:rotate-12" />
                  Connect AniList
                  <ChevronRight className="h-5 w-5 opacity-50" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-16 gap-3 rounded-none border-2 border-primary/10 px-10 text-xl font-black transition-all hover:bg-primary/5"
                  onClick={() => navigate("/import")}
                >
                  Continue
                  <ChevronRight className="h-5 w-5 opacity-30" />
                </Button>
              )}
            </div>
          )}

          {!token && isLocal && (
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-2 text-sm font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-primary"
            >
              <Terminal className="h-4 w-4" />
              {showGuide ? "Hide Setup Guide" : "Developer Setup Guide"}
            </button>
          )}
        </div>
      </div>

      {/* Setup Guide Section */}
      {isLocal && showGuide && (
        <div
          ref={guideRef}
          className="animate-in duration-500 fade-in slide-in-from-top-8"
        >
          <Card className="overflow-hidden rounded-none border-primary/10 bg-card/30 shadow-2xl backdrop-blur-xl">
            <CardHeader className="border-b border-primary/10 py-8">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight uppercase">
                    <Terminal className="h-6 w-6 text-primary" />
                    Zenith Setup Guide
                  </CardTitle>
                  <CardDescription className="text-base">
                    Step-by-step instructions to initialize Zenith in your local
                    environment.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="w-fit border-primary/30 font-bold text-primary uppercase"
                >
                  Setup Guide
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-12 p-8 md:grid-cols-2">
              <div className="space-y-8">
                <section className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-none bg-primary text-xs text-primary-foreground">
                      1
                    </span>
                    Create Developer App
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Go to the{" "}
                    <a
                      href="https://anilist.co/settings/developer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                    >
                      AniList Developer Settings{" "}
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    and click "Create New Client".
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-none bg-primary text-xs text-primary-foreground">
                      2
                    </span>
                    Set Redirect URI
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    During app creation, set the{" "}
                    <strong className="text-foreground">Redirect URI</strong>{" "}
                    to: <br />
                    <code className="mt-2 block w-fit rounded-none bg-muted px-2 py-1 text-xs font-bold text-primary">
                      http://localhost:5173/callback
                    </code>
                    <span className="mt-1 block text-[10px] font-bold tracking-tighter text-muted-foreground uppercase">
                      Or for production:
                    </span>
                    <code className="mt-1 block w-fit rounded-none bg-muted px-2 py-1 font-mono text-xs text-primary">
                      https://&lt;your-domain&gt;/callback
                    </code>
                    <span className="mt-1 block text-[10px] font-black tracking-tighter text-destructive uppercase">
                      Important: Must include http:// or https:// protocol
                    </span>
                  </p>
                </section>
                <section className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-none bg-primary text-xs text-primary-foreground">
                      3
                    </span>
                    Get Your Credentials
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Copy the{" "}
                    <strong className="text-foreground">Client ID</strong> once
                    your app is created.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-none bg-primary text-xs text-primary-foreground">
                      4
                    </span>
                    Deployment
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    When deploying (to Vercel, Netlify, etc.), add{" "}
                    <code className="rounded-none bg-muted px-1 text-primary">
                      VITE_ANILIST_CLIENT_ID
                    </code>{" "}
                    to your provider's Environment Variables and add your
                    production URL to the Redirect URIs in the AniList
                    dashboard.
                  </p>
                </section>
              </div>

              <div className="space-y-6">
                <div className="space-y-4 rounded-none border border-white/5 bg-black/40 p-6">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-4 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    <Info className="h-4 w-4 text-primary" />
                    Environment Config (.env)
                  </div>
                  <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-emerald-400">
                    {`# .env file in project root
VITE_ANILIST_CLIENT_ID = YOUR_CLIENT_ID
`}
                  </pre>
                </div>

                <div className="rounded-none border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs leading-tight font-medium text-primary">
                    <strong>Pro Tip:</strong> After updating the .env file, you
                    may need to restart your development server for the changes
                    to take effect.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feature Grid */}
      <div className="grid gap-6 pt-12 sm:gap-8 md:grid-cols-3">
        {[
          {
            icon: <LayoutList className="h-6 w-6" />,
            title: "Smart Import",
            desc: "Supports raw text lists and formatted CSV files with auto-detection.",
          },
          {
            icon: <Sparkles className="h-6 w-6" />,
            title: "Related Search",
            desc: "Intelligent matching logic handles prequels, sequels, and spin-offs.",
          },
          {
            icon: <RefreshCcw className="h-6 w-6" />,
            title: "Batch Sync",
            desc: "One-click updates to your AniList profile for entire watchlists.",
          },
        ].map((f, i) => (
          <div
            key={i}
            className="group rounded-none border bg-card/20 p-6 transition-all hover:bg-card/40 hover:shadow-2xl hover:shadow-primary/5 sm:p-8"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:rotate-3 sm:mb-6 sm:h-12 sm:w-12">
              {f.icon}
            </div>
            <h3 className="mb-3 text-lg font-bold sm:text-xl">{f.title}</h3>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
