"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Home, Sparkles, Crown, Users, MessageSquare, Heart, FolderHeart, DollarSign } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { useTheme } from "next-themes"
import { useAuthModal } from "@/components/auth-modal-context"
import { CharacterPreviewModal } from "@/components/character-preview-modal"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const { openLoginModal } = useAuthModal()
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewModalPath, setPreviewModalPath] = useState("")

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

  const isActive = (p: string) => {
    if (p === "/") return normalizedPath === "/"
    return normalizedPath === p || normalizedPath.startsWith(`${p}/`)
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // Check if this is a protected route that should show preview modal
    if (href === "/my-ai" || href === "/collections") {
      if (!user) {
        e.preventDefault()
        setPreviewModalPath(href)
        setShowPreviewModal(true)
        return
      }
    }

    // Check for other protected routes
    if ((href === "/generate" || href === "/create-character") && !user) {
      e.preventDefault()
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('postLoginRedirect', href)
      }
      openLoginModal()
      return
    }
  }

  const navItems = [
    { name: "Hem", href: "/", icon: Home },
    { name: "Chatta", href: "/chat", icon: MessageSquare },
    { name: "Skapa bild", href: "/generate", icon: Sparkles },
    { name: "Skapa flickvän", href: "/create-character", icon: Users },
    { name: "Min AI flickvän", href: "/my-ai", icon: Heart, requiresAuth: true },
    { name: "Mina bilder", href: "/collections", icon: FolderHeart, requiresAuth: true },
    { name: "Premium", href: "/premium", icon: DollarSign },
  ]

  if (user?.isAdmin) {
    navItems.push({ name: "Admin Panel", href: "/admin/dashboard", icon: Crown })
  }

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${isVisible ? "translate-y-0" : "translate-y-full"
          }`}
      >
        <div className="bg-card/95 backdrop-blur-sm border-t border-border shadow-[0_-5px_10px_rgba(0,0,0,0.1)] pb-safe-area-bottom">
          <div className="flex overflow-x-auto no-scrollbar py-2 px-1 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`flex flex-col items-center justify-center min-w-[68px] p-2 rounded-lg flex-shrink-0 transition-colors ${isActive(item.href)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
              >
                <item.icon className={`h-5 w-5 mb-1 ${isActive(item.href) ? "text-primary" : "text-current"}`} />
                <span className="text-[10px] font-medium whitespace-nowrap">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .pb-safe-area-bottom {
              padding-bottom: env(safe-area-inset-bottom);
          }
        `}</style>
      </div>

      {/* Character Preview Modal */}
      <CharacterPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        redirectPath={previewModalPath}
      />
    </>
  )
}
