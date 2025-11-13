"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, ImageIcon, Crown, Moon, Sun, User, Users } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { useTheme } from "next-themes"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => setMounted(true), [])

  // Handle scroll to fade navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past 100px
        setIsVisible(false)
      } else {
        // Scrolling up or at top
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  // Don't show the mobile nav on chat pages
  if (pathname?.startsWith("/chat")) {
    return null
  }

  // Always point to non-localized routes (landing page is "/").
  // Normalize current path by stripping any leading /sv or /en so active states still work.
  const normalizedPath = (pathname || "/").replace(/^\/(sv|en)(?=\/|$)/, "") || "/"
  const homeHref = "/"
  const isActive = (p: string) => normalizedPath === p || normalizedPath.startsWith(`${p}/`)

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <div className="bg-card border-t border-border p-2">
        <div className="flex justify-around items-center">
          <Link href={homeHref} className="flex flex-col items-center p-2">
            <Home className={`h-5 w-5 ${pathname === homeHref ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[10px] ${pathname === homeHref ? "text-primary" : "text-muted-foreground"} mt-1`}>Hem</span>
          </Link>
          <Link href="/generate" className="flex flex-col items-center p-2">
            <ImageIcon className={`h-5 w-5 ${isActive("/generate") ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[10px] ${isActive("/generate") ? "text-primary" : "text-muted-foreground"} mt-1`}>
              Skapa
            </span>
          </Link>
          <Link href="/create-character" className="flex flex-col items-center p-2">
            <Users className={`h-5 w-5 ${isActive("/create-character") ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[10px] ${isActive("/create-character") ? "text-primary" : "text-muted-foreground"} mt-1`}>
              Flickvän
            </span>
          </Link>
          <Link href="/premium" className="flex flex-col items-center p-2">
            <Crown className={`h-5 w-5 ${isActive("/premium") ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[10px] ${isActive("/premium") ? "text-primary" : "text-muted-foreground"} mt-1`}>Premium</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center p-2">
            <User className={`h-5 w-5 ${isActive("/profile") ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[10px] ${isActive("/profile") ? "text-primary" : "text-muted-foreground"} mt-1`}>
              Profil
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
