import type React from "react"
import AdminSidebar from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { AdminGuard } from "@/components/admin-guard"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AdminGuard>
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-card text-card-foreground lg:block">
          <AdminSidebar />
        </div>
        <div className="flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </AdminGuard>
  )
}

export default AdminLayout
