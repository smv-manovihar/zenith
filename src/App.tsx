import { lazy, Suspense } from "react"
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"
import { Navbar } from "./components/Navbar"
import { useProgress } from "./components/ProgressProvider"
import { TooltipProvider } from "./components/ui/tooltip"
import { Loader2 } from "lucide-react"

// Lazy load views for code splitting
const Home = lazy(() => import("./views/Home"))
const Import = lazy(() => import("./views/Import"))
const Review = lazy(() => import("./views/Review"))
const Sync = lazy(() => import("./views/Sync"))
const AuthCallback = lazy(() => import("./views/AuthCallback"))

const LoadingFallback = () => (
  <div className="flex min-h-[50vh] w-full items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
      <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
        Loading Zenith...
      </p>
    </div>
  </div>
)

function App() {
  const { token } = useProgress()

  return (
    <TooltipProvider delayDuration={300}>
      <Router>
        <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/30">
          <Navbar />
          <main className="container mx-auto px-4 pt-32 pb-12 md:pt-24">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/callback" element={<AuthCallback />} />

                {/* Protected Routes */}
                <Route
                  path="/import"
                  element={token ? <Import /> : <Navigate to="/" replace />}
                />
                <Route
                  path="/review"
                  element={token ? <Review /> : <Navigate to="/" replace />}
                />
                <Route
                  path="/sync"
                  element={token ? <Sync /> : <Navigate to="/" replace />}
                />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </TooltipProvider>
  )
}

export default App
