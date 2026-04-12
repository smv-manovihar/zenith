import React from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading Zenith",
  fullScreen = true,
}) => {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-8 ${
        fullScreen ? "min-h-[80vh]" : "py-12"
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Animated Background Aura */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute h-32 w-32 rounded-full bg-primary/30 blur-3xl"
        />

        {/* Main Logo Content */}
        <div className="relative flex flex-col items-center gap-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-black tracking-[0.2em] text-primary uppercase"
          >
            Zenith
          </motion.div>

          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase"
            >
              {message}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Animated Progress Line */}
      <div className="h-px w-32 overflow-hidden bg-primary/10">
        <motion.div
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
          className="h-full w-1/2 bg-primary/50"
        />
      </div>
    </div>
  )
}

export default LoadingScreen
