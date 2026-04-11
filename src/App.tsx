import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"
import { Navbar } from "./components/Navbar"
import Home from "./views/Home"
import Import from "./views/Import"
import Review from "./views/Review"
import Sync from "./views/Sync"
import AuthCallback from "./views/AuthCallback"
import { useProgress } from "./components/ProgressProvider"
import { TooltipProvider } from "./components/ui/tooltip"

function App() {
  const { token } = useProgress()

  return (
    <TooltipProvider>
      <Router>
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
          <Navbar />
          <main className="container mx-auto px-4 pt-24 pb-12">
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
          </main>
        </div>
      </Router>
    </TooltipProvider>
  )
}

export default App
