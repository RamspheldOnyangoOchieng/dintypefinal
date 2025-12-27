"use client"

import { useState, useEffect } from "react"
import {
    Coins,
    Shield,
    CircleDollarSign,
    Activity,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    Loader2,
    Calendar
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface ActivityItem {
    id: string
    amount: number
    type: string
    description: string
    created_at: string
    kind: 'token' | 'credit'
}

interface UnifiedActivityListProps {
    userId: string
    className?: string
    showTitle?: boolean
    limit?: number
}

export function UnifiedActivityList({
    userId,
    className,
    showTitle = true,
    limit = 20
}: UnifiedActivityListProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchActivity = async () => {
            if (!userId) return
            try {
                setLoading(true)
                const response = await fetch(`/api/user-activity?userId=${userId}&limit=${limit}`)
                const data = await response.json()
                if (data.success) {
                    setActivities(data.activities)
                }
            } catch (e) {
                console.error("Failed to fetch activity:", e)
            } finally {
                setLoading(false)
            }
        }
        fetchActivity()
    }, [userId, limit])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                <p className="text-sm text-muted-foreground font-medium">Laddar historik...</p>
            </div>
        )
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/20 rounded-3xl border border-dashed border-border/60">
                <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-muted-foreground">Ingen aktivitet än</h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
                    Dina transaktioner och användning av tokens visas här när du börjar använda plattformen.
                </p>
            </div>
        )
    }

    return (
        <div className={cn("space-y-6", className)}>
            {showTitle && (
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-xl font-black italic tracking-tight">Historik</h2>
                        <p className="text-xs text-muted-foreground font-medium">Dina senaste transaktioner och aktiviteter</p>
                    </div>
                    <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                        {activities.length} Aktiviteter
                    </Badge>
                </div>
            )}

            <div className="space-y-3">
                {activities.map((item) => (
                    <div
                        key={item.id}
                        className="group relative flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 transition-all hover:bg-muted/30 hover:shadow-sm"
                    >
                        <div className={cn(
                            "p-3 rounded-xl flex items-center justify-center",
                            item.kind === 'token' ? "bg-yellow-500/10 text-yellow-500" : "bg-primary/10 text-primary"
                        )}>
                            {item.kind === 'token' ? <Coins className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-bold truncate leading-none">{item.description}</p>
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-muted/60 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                    {item.kind}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(item.created_at), "d MMM yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(item.created_at), "HH:mm")}
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className={cn(
                                "flex items-center justify-end gap-1 text-base font-black italic",
                                item.amount >= 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                                {item.amount >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                {item.amount >= 0 ? "+" : ""}{item.amount}
                            </div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                                {item.kind === 'token' ? 'tokens' : 'krediter'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
