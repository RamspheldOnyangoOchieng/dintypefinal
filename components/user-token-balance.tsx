"use client"
import { Coins } from "lucide-react"
import { useAuth } from "@/components/auth-context"

interface UserTokenBalanceProps {
    userId?: string
    className?: string
    showIcon?: boolean
    iconSize?: number
    textSize?: "xs" | "sm" | "base" | "lg" | "xl"
}

export function UserTokenBalance({
    className = "",
    showIcon = true,
    iconSize = 16,
    textSize = "sm",
}: UserTokenBalanceProps) {
    const { user, isLoading } = useAuth()
    const balance = user?.tokenBalance ?? 0

    const textSizeClass = {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
    }[textSize]

    if (isLoading) {
        return <span className={`text-xs ${className}`}>Loading...</span>
    }

    if (!user) {
        return null
    }

    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 shadow-sm ${className}`}>
            {showIcon && <Coins size={iconSize} className="text-primary animate-pulse" />}
            <span className={`font-black italic tracking-tight ${textSizeClass}`}>
                {balance} 
                <span className="text-[10px] text-muted-foreground uppercase not-italic ml-0.5">Tokens</span>
            </span>
        </div>
    )
}