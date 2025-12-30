"use client"

import AppSidebar from "@/components/app-sidebar"
import { BannerProvider } from "@/components/banner-context"
import { CharacterProvider } from "@/components/character-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { ImageSuggestionsProvider } from "@/components/image-suggestions-context"
import { LanguageProvider } from "@/components/language-context"
import { SidebarProvider, useSidebar } from "@/components/sidebar-context"
import { SiteProvider } from "@/components/site-context"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { AnalyticsLoader } from "@/components/use-consent"
import { usePathname } from "next/navigation"
import type React from "react"
import "./globals.css"
import { useAuth } from "@/components/auth-context"
import { PremiumUpgradeModal } from "@/components/premium-upgrade-modal"
import { useState, useEffect } from "react"

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [showExpiredModal, setShowExpiredModal] = useState(false)

  useEffect(() => {
    if (!isLoading && user?.isExpired && !sessionStorage.getItem('expired_modal_shown')) {
      setShowExpiredModal(true)
      sessionStorage.setItem('expired_modal_shown', 'true')
    }
  }, [user?.isExpired, isLoading])

  const noHeaderPaths = ["/chat", "/generate", "/premium", "/affiliate", "/admin"]
  const noFooterPaths = ["/chat"]
  const showHeader = !noHeaderPaths.some((path) => pathname.startsWith(path))
  const showFooter = !noFooterPaths.some((path) => pathname.startsWith(path))

  return (
    <div
      className="flex bg-background min-h-screen overflow-x-hidden"
      style={{ position: 'relative', top: 0 }}
      suppressHydrationWarning
    >
      <AppSidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden ${isOpen ? "md:ml-64" : "md:ml-20"}`}>
        <div key="layout-main-content" className="flex-1 flex flex-col overflow-x-hidden">
          <div className="flex-none">
            {showHeader ? <SiteHeader /> : null}
          </div>
          <main className="flex-1 overflow-x-hidden relative">
            <div key={`route-wrapper-${pathname.split('/')[1] || 'home'}`} suppressHydrationWarning>
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
        </div>
        <div className="flex-none">
          {showFooter ? <SiteFooter /> : null}
        </div>
      </div>

      <PremiumUpgradeModal
        isOpen={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        mode="expired"
        feature="Premium Expired"
        description="Premium Plan expired. Renew your Premium Plan."
      />
    </div>
  )
}

export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteProvider>
      <LanguageProvider>
        <SidebarProvider>
          <CharacterProvider>
            <BannerProvider>
              <ImageSuggestionsProvider>
                <RootLayoutContent>{children}</RootLayoutContent>
              </ImageSuggestionsProvider>
            </BannerProvider>
          </CharacterProvider>
        </SidebarProvider>
      </LanguageProvider>
    </SiteProvider>
  )
}
