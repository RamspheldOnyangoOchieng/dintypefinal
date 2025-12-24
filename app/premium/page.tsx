"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, Shield, Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { createClient } from "@/utils/supabase/client"

interface TokenPackage {
  id: string
  name: string
  tokens: number
  price: number
  priceEUR: number
  priceSEK: number
}

export default function PremiumPage() {
  const [tokenPackages] = useState<TokenPackage[]>([
    { id: '1', name: '200 tokens', tokens: 200, price: 99, priceEUR: 9.99, priceSEK: 99 },
    { id: '2', name: '550 tokens', tokens: 550, price: 249, priceEUR: 24.99, priceSEK: 249 },
    { id: '3', name: '1,550 tokens', tokens: 1550, price: 499, priceEUR: 49.99, priceSEK: 499 },
    { id: '4', name: '5,800 tokens', tokens: 5800, price: 1499, priceEUR: 149.99, priceSEK: 1499 },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [statusError, setStatusError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const statusCheckRef = useRef<boolean>(false)
  const [selectedTokenPackageId, setSelectedTokenPackageId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (statusCheckRef.current) return
      statusCheckRef.current = true

      try {
        setIsCheckingStatus(true)
        setStatusError(null)

        if (!user) {
          setIsCheckingStatus(false)
          statusCheckRef.current = false
          return
        }

        try {
          const response = await fetch("/api/check-premium-status")
          const data = await response.json()

          if (data.error) {
            console.error("Premium status error:", data.error)
            setStatusError(`Fel vid kontroll av premiumstatus`)
          }
        } catch (error) {
          console.error("Error checking premium status:", error)
          setStatusError("Det gick inte att kontrollera premiumstatus")
        }
      } finally {
        setIsCheckingStatus(false)
        statusCheckRef.current = false
      }
    }

    checkPremiumStatus()
  }, [user?.id])

  const handlePremiumPurchase = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: "premium_monthly",
          userId: user?.id,
          email: user?.email,
          metadata: {
            type: "premium_subscription",
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Misslyckades att skapa betalningssession")
      }

      window.location.href = data.url
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Kunde inte genomföra köpet. Försök igen.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTokenPurchase = async () => {
    if (!selectedTokenPackageId) {
      toast.error("Välj ett token-paket")
      return
    }

    try {
      setIsLoading(true)

      const selectedPackage = tokenPackages.find((pkg) => pkg.id === selectedTokenPackageId)
      if (!selectedPackage) {
        throw new Error("Valt token-paket kunde inte hittas")
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedTokenPackageId,
          userId: user?.id,
          email: user?.email,
          metadata: {
            type: "token_purchase",
            tokens: selectedPackage.tokens,
            price: selectedPackage.price,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Misslyckades att skapa betalningssession")
      }

      window.location.href = data.url
    } catch (error) {
      console.error("Payment error:", error)
      toast.error("Kunde inte genomföra token-köpet. Försök igen.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingStatus) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Inloggning krävs</h1>
            <p className="text-muted-foreground">Logga in för att få åtkomst till premiumfunktioner</p>
          </div>
          <Button className="w-full" onClick={() => router.push("/login?redirect=/premium")}>
            Logga in
          </Button>
        </Card>
      </div>
    )
  }

  if (statusError) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Fel</h1>
            <p className="text-muted-foreground">Ett fel inträffade vid kontroll av din premiumstatus</p>
            {process.env.NODE_ENV === "development" && <p className="text-xs text-destructive mt-2">{statusError}</p>}
          </div>
          <Button className="w-full" onClick={() => window.location.reload()}>
            Försök igen
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          Premium Priser
        </h1>
        <p className="text-xl text-muted-foreground">
          Välj den plan som passar dig bäst
        </p>
      </div>

      {/* ISSUE 1: PRICING COMPARISON TABLE */}
      <Card className="p-8 mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">Jämför planer</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                <th className="text-left px-6 py-4 font-semibold">Funktion</th>
                <th className="text-left px-6 py-4 font-semibold">Free User</th>
                <th className="text-left px-6 py-4 font-semibold">Premium User<br /><span className="text-sm font-normal">1 month subscription</span></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4 font-medium">Pris</td>
                <td className="px-6 py-4">0 EUR / 0 SEK</td>
                <td className="px-6 py-4 font-bold text-primary">11 EUR / 110 SEK månad</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-muted/30">
                <td className="px-6 py-4 font-medium">Textmeddelanden</td>
                <td className="px-6 py-4">3 fria meddelanden</td>
                <td className="px-6 py-4 font-bold text-green-600">Obegränsat</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4 font-medium">Skapa AI flickvän</td>
                <td className="px-6 py-4 text-red-500">Inte möjligt</td>
                <td className="px-6 py-4 font-bold text-green-600">Obegränsat</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-muted/30">
                <td className="px-6 py-4 font-medium">Skapa bilder</td>
                <td className="px-6 py-4">1 gratis SFW</td>
                <td className="px-6 py-4 font-bold text-green-600">Obegränsat (NSFW & SFW)</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4 font-medium">Gratis tokens</td>
                <td className="px-6 py-4 text-red-500">Ingår ej</td>
                <td className="px-6 py-4 font-bold text-green-600">100 gratis tokens</td>
              </tr>
              <tr className="bg-muted/30">
                <td className="px-6 py-4 font-medium">Köpa tokens</td>
                <td className="px-6 py-4 text-red-500">Nej</td>
                <td className="px-6 py-4 font-bold text-green-600">Ja</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12 py-6 text-lg font-bold"
            onClick={handlePremiumPurchase}
            disabled={isLoading}
          >
            {isLoading ? "Bearbetar..." : "Bli Premium Nu"}
          </Button>
        </div>
      </Card>

      {/* ISSUE 2: TOKEN USAGE TABLE */}
      <Card className="p-8 mb-12">
        <h2 className="text-3xl font-bold mb-6">Hur tokens används</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="text-left px-6 py-4 font-semibold">Funktion</th>
                <th className="text-left px-6 py-4 font-semibold">Token Kostnad</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4 font-medium">Textmeddelanden</td>
                <td className="px-6 py-4">5 tokens per message</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-muted/30">
                <td className="px-6 py-4 font-medium">Skapa AI flickvän</td>
                <td className="px-6 py-4">2 tokens per flickvän</td>
              </tr>
              <tr className="bg-muted/30">
                <td className="px-6 py-4 font-medium">Skapa bilder</td>
                <td className="px-6 py-4">5–10 tokens (Stability: 5, Flux: 10)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ISSUE 3: TOKEN PURCHASE TABLE */}
      <Card className="p-8 mb-12 border-2 border-primary/50">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-yellow-500" />
          Buy tokens for premium users only
        </h2>
        <p className="text-muted-foreground mb-6">
          If you use all your tokens before your subscription period ends, you can purchase additional token packs as needed.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <th className="text-left px-6 py-4 font-semibold">Köpa Tokens</th>
                <th className="text-left px-6 py-4 font-semibold">Kostnad</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4 font-medium">100 tokens</td>
                <td className="px-6 py-4 text-green-600 font-bold">GRATIS (med Premium)</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-muted/30">
                <td className="px-6 py-4 font-medium">200 tokens</td>
                <td className="px-6 py-4 font-semibold">9,99 € / 99 kr</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4 font-medium">550 tokens</td>
                <td className="px-6 py-4 font-semibold">€24.99 / 249 kr</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-muted/30">
                <td className="px-6 py-4 font-medium">1,550 tokens</td>
                <td className="px-6 py-4 font-semibold">€49.99 / 499 kr</td>
              </tr>
              <tr className="bg-muted/30">
                <td className="px-6 py-4 font-medium">5,800 tokens</td>
                <td className="px-6 py-4 font-semibold">€149.99 / 1,499 kr</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>Observera:</strong> Endast Premium-användare som har betalat för 1 månads prenumeration kan köpa tokens.
          </p>
        </div>

        <h3 className="text-xl font-bold mb-4">Välj ett token-paket:</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {tokenPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-lg p-4 cursor-pointer transition-all duration-300 border-2 ${
                selectedTokenPackageId === pkg.id
                  ? "bg-primary text-primary-foreground shadow-lg border-primary transform scale-105"
                  : "bg-card hover:bg-primary/5 border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedTokenPackageId(pkg.id)}
            >
              <div className="font-bold text-lg mb-2">{pkg.name}</div>
              <div className="text-2xl font-bold mb-1">
                {pkg.priceEUR} € / {pkg.priceSEK} kr
              </div>
              {selectedTokenPackageId === pkg.id && (
                <div className="mt-2 flex items-center text-sm">
                  <Check className="h-4 w-4 mr-1" />
                  Valt paket
                </div>
              )}
            </div>
          ))}
        </div>

        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
          onClick={handleTokenPurchase}
          disabled={isLoading || !selectedTokenPackageId}
        >
          {isLoading ? "Bearbetar..." : "Köp Tokens"}
        </Button>
      </Card>

      {/* Security Badges */}
      <div className="flex justify-center mt-8 space-x-8">
        <div className="flex items-center text-muted-foreground">
          <Shield className="h-5 w-5 mr-2" />
          <span>Säker betalning</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Lock className="h-5 w-5 mr-2" />
          <span>SSL-krypterad</span>
        </div>
      </div>
    </div>
  )
}
