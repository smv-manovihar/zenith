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
import LoadingScreen from "./components/LoadingScreen"
// Lazy load views for code splitting
const Home = lazy(() => import("./views/Home"))
const Import = lazy(() => import("./views/Import"))
const Review = lazy(() => import("./views/Review"))
const Sync = lazy(() => import("./views/Sync"))
const AuthCallback = lazy(() => import("./views/AuthCallback"))
const ListManagement = lazy(() => import("./views/ListManagement"))
const Export = lazy(() => import("./views/Export"))
const Search = lazy(() => import("./views/Search"))

const LoadingFallback = () => <LoadingScreen message="Loading Zenith" />

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
                <Route
                  path="/list"
                  element={token ? <ListManagement /> : <Navigate to="/" replace />}
                />
                <Route
                  path="/search"
                  element={token ? <Search /> : <Navigate to="/" replace />}
                />
                <Route
                  path="/export"
                  element={token ? <Export /> : <Navigate to="/" replace />}
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
