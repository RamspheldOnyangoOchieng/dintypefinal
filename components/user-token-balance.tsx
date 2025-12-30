"use client"
import { Coins } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

interface UserTokenBalanceProps {
    userId?: string
    className?: string
    showIcon?: boolean
    iconSize?: number
    textSize?: "xs" | "sm" | "base" | "lg" | "xl"
    refreshTrigger?: number
}

export function UserTokenBalance({
    userId,
    className = "",
    showIcon = true,
    iconSize = 16,
    textSize = "sm",
    refreshTrigger = 0
}: UserTokenBalanceProps) {
    const { user: currentUser, isLoading: authLoading } = useAuth()
    const [balance, setBalance] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    // Deterministic balance display
    // If userId matches current user, use context balance
    // If userId is different, fetch manually

    useEffect(() => {
        const fetchBalance = async () => {
            if (!userId) return;

            // If it's the current user, just use the auth context balance
            if (currentUser && userId === currentUser.id) {
                setBalance(currentUser.tokenBalance)
                return
            }

            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from("user_tokens")
                    .select("balance")
                    .eq("user_id", userId)
                    .maybeSingle()

                if (data) {
                    setBalance(data.balance)
                } else {
                    setBalance(0)
                }
            } catch (err) {
                console.error("Error fetching token balance:", err)
                setBalance(0)
            } finally {
                setLoading(false)
            }
        }

        fetchBalance()
    }, [userId, currentUser?.id, currentUser?.tokenBalance, refreshTrigger])

    const textSizeClass = {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
    }[textSize]

    // If no userId provided, fallback to current user balance from context
    const displayBalance = userId ? (balance ?? 0) : (currentUser?.tokenBalance ?? 0)
    const isActuallyLoading = (userId && balance === null && loading) || (!userId && authLoading)

    if (isActuallyLoading) {
        return <span className={`text-xs ${className} animate-pulse`}>...</span>
    }

    if (!userId && !currentUser) {
        return null
    }

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 shadow-sm ${className}`}>
            {showIcon && <Coins size={iconSize} className="text-primary" />}
            <span className={`font-black italic tracking-tight ${textSizeClass}`}>
                {displayBalance}
                <span className="text-[10px] text-muted-foreground uppercase not-italic ml-0.5">Tokens</span>
            </span>
        </div>
    )
}