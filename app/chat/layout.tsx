"use client"

import type React from "react"
import { PublicRouteGuard } from "@/components/public-route-guard"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PublicRouteGuard>
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
      </div>
    </PublicRouteGuard>
  )
}
