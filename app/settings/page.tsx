"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SettingsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/profile")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}
