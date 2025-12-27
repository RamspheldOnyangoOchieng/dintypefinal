"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import { Coins, Shield } from "lucide-react"

interface TokenBalanceDisplayProps {
  className?: string
  showIcon?: boolean
  iconSize?: number
  textSize?: "xs" | "sm" | "base" | "lg" | "xl"
  refreshInterval?: number | null
}

export function TokenBalanceDisplay({
  className = "",
  showIcon = true,
  iconSize = 16,
  textSize = "sm",
  refreshInterval = 60000, // 1 minute by default, null for no refresh
}: TokenBalanceDisplayProps) {
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const { user } = useAuth()

  const fetchBalances = async () => {
    if (!user) {
      setTokenBalance(null)
      setCreditBalance(null)
      setIsLoading(false)
      return
    }

    try {
      // Use check-premium-status as it returns everything we need
      const response = await fetch("/api/check-premium-status")

      if (!response.ok) {
        throw new Error("Failed to fetch balance")
      }

      const data = await response.json()

      if (data.authenticated) {
        setTokenBalance(data.tokenBalance)
        setCreditBalance(data.creditBalance)
        setIsPremium(data.isPremium)
      } else {
        setTokenBalance(null)
        setCreditBalance(null)
      }
    } catch (error) {
      console.error("Error fetching balance:", error)
      setTokenBalance(null)
      setCreditBalance(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBalances()

    let intervalId: NodeJS.Timeout | null = null
    if (refreshInterval && user) {
      intervalId = setInterval(fetchBalances, refreshInterval)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [user?.id, refreshInterval])

  // Text size classes
  const textSizeClass = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  }[textSize]

  if (!user || (tokenBalance === null && creditBalance === null)) {
    return null
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {isPremium && (
        <div className="flex items-center gap-1 group cursor-help" title="Dina månatliga krediter">
          <Shield size={iconSize} className="text-primary" />
          <span className={`font-semibold ${textSizeClass} text-primary`}>
            {isLoading ? "..." : creditBalance} cr
          </span>
        </div>
      )}
      <div className="flex items-center gap-1 group cursor-help" title="Dina tokens för generationer">
        <Coins size={iconSize} className="text-yellow-500" />
        <span className={`font-semibold ${textSizeClass}`}>
          {isLoading ? "..." : tokenBalance} tk
        </span>
      </div>
    </div>
  )
}
