"use client"

import { useCharacters } from "@/components/character-context"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserTokenBalance } from "@/components/user-token-balance"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "./auth-context"
import { Badge } from "@/components/ui/badge"

export function SiteHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-hidden">
      <div className="container flex h-16 items-center justify-between px-4 max-w-full">
        <div className="flex items-center gap-6">
          <span className="font-bold text-xl text-primary">DINTYP.SE</span>
          {/* Character Type Tabs - Removed for future implementation */}
        </div>

        <div className="flex items-center justify-end space-x-2 flex-nowrap">
          {user && <UserTokenBalance userId={user.id} className="hidden md:flex" />}
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground/90 hidden lg:inline">Hej, {user.username || ""}!</span>
              {user.isPremium && (
                <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-[10px] h-5 px-1.5 uppercase font-bold">
                  Pro
                </Badge>
              )}
              <UserNav />
            </div>
          ) : (
            <UserNav />
          )}
        </div>
      </div>
    </header>
  )
}
