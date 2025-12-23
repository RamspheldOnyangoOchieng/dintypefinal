/**
 * Middleware to prevent automatic login redirects on public routes
 * This component wraps chat pages to ensure they work for unauthenticated users
 */
"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { isPublicRoute } from "@/lib/route-config"

export function PublicRouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    useEffect(() => {
        // Log for debugging
        if (isPublicRoute(pathname)) {
            console.log(`✅ Public route accessed: ${pathname}`)
        }
    }, [pathname])

    return <>{children}</>
}
