import { useState } from "react"
import { UserNav } from "@/components/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import AdminSidebar from "@/components/admin-sidebar"

export function AdminHeader() {
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center lg:hidden">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-2">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Admin Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0">
                            <AdminSidebar onNavigate={() => setOpen(false)} />
                        </SheetContent>
                    </Sheet>
                </div>
                
                <div className="hidden lg:flex" /> {/* Spacer for desktop to keep right items pushed */}

                <div className="flex items-center space-x-2 ml-auto">
                    <ThemeToggle />
                    <UserNav />
                </div>
            </div>
        </header>
    )
}