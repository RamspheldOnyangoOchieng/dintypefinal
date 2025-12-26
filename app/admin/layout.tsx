"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import AdminSidebar from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { AdminGuard } from "@/components/admin-guard"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()

  // Public admin routes that don't need the sidebar or guard
  const isPublicAdminRoute = pathname === '/admin/login' || pathname === '/admin/signup'

  if (isPublicAdminRoute) {
    return <main className="min-h-screen bg-background">{children}</main>
  }

  return (
    <AdminGuard>
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-card text-card-foreground lg:block">
          <AdminSidebar />
        </div>
        <div className="flex flex-col">
          <AdminHeader />
          {/* key={pathname} forces remount on navigation to prevent hydration errors from extensions like Google Translate */}
          <main className="flex-1 p-4 sm:p-6 w-full overflow-x-auto" key={pathname}>{children}</main>
        </div>
      </div>
    </AdminGuard>
  )
}

export default AdminLayout
