import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useProgress } from "@/components/ProgressProvider"
import LoadingScreen from "@/components/LoadingScreen"

const AuthCallback: React.FC = () => {
  const { setToken } = useProgress()
  const navigate = useNavigate()

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get("access_token")
      if (accessToken) {
        setToken(accessToken)
        navigate("/import")
      }
    } else {
      // If no hash, maybe already have token or error
      navigate("/")
    }
  }, [setToken, navigate])

  return <LoadingScreen message="Authenticating with AniList" />
}

export default AuthCallback
