"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, Shield, Lock, Sparkles, Loader2, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"

interface TokenPackage {
  id: string
  name: string
  tokens: number
  price: number
  priceDisplay: string
}

export default function PremiumPage() {
  // Hardcoded packages to match the specific text request
  const tokenPackages: TokenPackage[] = [
    { id: 'pack_200', name: '200 tokens', tokens: 200, price: 99, priceDisplay: '9,99 € / 99 kr' },
    { id: 'pack_550', name: '550 tokens', tokens: 550, price: 249, priceDisplay: '€24.99 / 249 kr' },
    { id: 'pack_1550', name: '1,550 tokens', tokens: 1550, price: 499, priceDisplay: '€49.99 / 499 kr' },
    { id: 'pack_5800', name: '5,800 tokens', tokens: 5800, price: 1499, priceDisplay: '€149.99 / 1,499 kr' },
  ]

  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [selectedTokenPackageId, setSelectedTokenPackageId] = useState<string | null>(null)
  
  const router = useRouter()
  const { user } = useAuth()
  const statusCheckRef = useRef<boolean>(false)

  useEffect(() => {
    const checkPremiumStatus = async () => {
        if (statusCheckRef.current) return
        statusCheckRef.current = true

        try {
            setIsCheckingStatus(true)
            if (!user) {
                setIsPremium(false)
                setTokenBalance(0)
                setIsCheckingStatus(false)
                return
            }

            const response = await fetch("/api/check-premium-status")
            const data = await response.json()
            setIsPremium(!!data.isPremium)
            setTokenBalance(data.tokenBalance || 0)
        } catch (error) {
            console.error("Error checking premium status:", error)
        } finally {
            setIsCheckingStatus(false)
            statusCheckRef.current = false
        }
    }

    checkPremiumStatus()
  }, [user])

  const handlePremiumPurchase = async () => {
    if (!user) {
      toast.error("Vänligen logga in för att köpa Premium")
      router.push("/login?redirect=/premium")
      return
    }

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

    if (!user) {
      toast.error("Vänligen logga in för att köpa tokens")
      router.push("/login?redirect=/premium")
      return
    }

    // Double check premium logic if needed, but UI hides/disables it mostly.
    if (!isPremium) {
        toast.error("Endast Premium-användare kan köpa tokens")
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
          planId: selectedTokenPackageId, // Passing our hardcoded ID (e.g. 'pack_200')
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
      <div className="container max-w-6xl mx-auto py-12 px-4 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Premium & Tokens
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Uppgradera din upplevelse med Premium eller fyll på med tokens för mer innehåll.
        </p>
        
        {/* Display current status and balance */}
        {user && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Badge variant={isPremium ? "default" : "secondary"} className="text-base px-4 py-2">
              {isPremium ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Premium Active
                </>
              ) : (
                "Free User"
              )}
            </Badge>
            <Badge variant="outline" className="text-base px-4 py-2">
              <Coins className="w-4 h-4 mr-2" />
              {tokenBalance} Tokens
            </Badge>
          </div>
        )}
      </div>

      {/* ISSUE 1: Pricing Comparison Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="text-center">
            <CardTitle className="text-3xl">Jämför Planer</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
                <thead>
                    <tr className="border-b">
                        <th className="text-left p-4 font-bold text-lg">Function</th>
                        <th className="text-center p-4 font-bold text-lg">Free User</th>
                        <th className="text-center p-4 font-bold text-lg text-primary bg-primary/5 rounded-t-lg">Premium User<br/><span className="text-sm font-normal text-muted-foreground">1 month subscription</span></th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">Pris (Price)</td>
                        <td className="p-4 text-center">0 EUR / 0 SEK</td>
                        <td className="p-4 text-center font-bold bg-primary/5">11 EUR / 110 SEK month</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">Textmeddelanden (text messages)</td>
                        <td className="p-4 text-center">3 fria meddelanden</td>
                        <td className="p-4 text-center font-bold text-green-600 bg-primary/5">Obegränsat</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">Skapa AI flickvän (Create AI girlfriend)</td>
                        <td className="p-4 text-center text-muted-foreground">Inte möjligt</td>
                        <td className="p-4 text-center font-bold text-green-600 bg-primary/5">Obegränsat</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">Skapa bilder (Create images)</td>
                        <td className="p-4 text-center">1 gratis SFW</td>
                        <td className="p-4 text-center font-bold text-green-600 bg-primary/5">Obegränsat (NSFW & SFW)</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">Gratis tokens (Free tokens)</td>
                        <td className="p-4 text-center text-muted-foreground">Ingår ej</td>
                        <td className="p-4 text-center font-bold text-green-600 bg-primary/5">100 gratis tokens</td>
                    </tr>
                    <tr className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">Köpa tokens (buy tokens)</td>
                        <td className="p-4 text-center text-red-500">Nej</td>
                        <td className="p-4 text-center font-bold text-green-600 bg-primary/5">Ja</td>
                    </tr>
                </tbody>
            </table>
        </CardContent>
        <CardFooter className="justify-center p-8 bg-muted/20">
          {!isPremium ? (
            <Button 
              size="lg" 
              onClick={handlePremiumPurchase} 
              disabled={isLoading}
              className="w-full md:w-auto min-w-[200px] text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-5 w-5" /> Bli Premium Nu</>}
            </Button>
          ) : (
            <div className="text-center">
              <Badge className="text-lg px-6 py-3 bg-green-500">
                <Check className="w-5 h-5 mr-2" />
                You are Premium!
              </Badge>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* ISSUE 2: Token Usage Table */}
      <Card className="h-full">
        <CardHeader>
           <CardTitle>Hur tokens används</CardTitle>
           <CardDescription>Kostnad för att använda olika funktioner</CardDescription>
        </CardHeader>
        <CardContent>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b">
                        <th className="text-left p-4 font-bold">Funktion</th>
                        <th className="text-right p-4 font-bold">Token Kostnad</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">Textmeddelanden (text messages)</td>
                        <td className="p-4 text-right">5 tokens per message</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">Skapa AI flickvän (Create AI girlfriend)</td>
                        <td className="p-4 text-right">2 tokens per flickvän</td>
                    </tr>
                    <tr className="hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">Skapa bilder (Create images)</td>
                        <td className="p-4 text-right">5–10 tokens (Stability: 5, Flux: 10)</td>
                    </tr>
                </tbody>
            </table>
        </CardContent>
      </Card>

      {/* ISSUE 3: Buy Tokens Section */}
      <Card className="h-full border-primary/20 shadow-lg">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Buy tokens for premium users only
             </CardTitle>
             <CardDescription>
                If you use all your tokens before your subscription period ends, you can purchase additional token packs as needed.
             </CardDescription>
           </CardHeader>
           
           <CardContent className="space-y-6">
                {/* Information Table */}
                <div className="rounded-md border">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-3 font-semibold">Köpa Tokens</th>
                                <th className="text-right p-3 font-semibold">Kostnad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Note: The '100 tokens' row had no price key in the prompt examples except inferred, leaving blank or 'Ingår' */}
                            <tr className="border-b">
                                <td className="p-3">100 tokens</td>
                                <td className="p-3 text-right text-muted-foreground">-</td> 
                            </tr>
                            {tokenPackages.map(pkg => (
                                <tr key={pkg.id} className="border-b last:border-0 hover:bg-muted/20">
                                    <td className="p-3 font-medium">{pkg.name}</td>
                                    <td className="p-3 text-right">{pkg.priceDisplay}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Purchase Functional Block - Only if Premium */}
                {isPremium ? (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">Välj paket att köpa:</h3>
                          <Badge variant="outline" className="text-base px-3 py-1">
                            <Coins className="w-4 h-4 mr-2" />
                            Current: {tokenBalance} tokens
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {tokenPackages.map((pkg) => (
                                <div
                                key={pkg.id}
                                onClick={() => setSelectedTokenPackageId(pkg.id)}
                                className={`
                                    cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 text-center
                                    ${selectedTokenPackageId === pkg.id 
                                        ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                                        : "border-border hover:border-primary/50 hover:bg-muted/50"}
                                `}
                                >
                                    <div className="font-bold text-lg mb-1">{pkg.tokens} Tokens</div>
                                    <div className="text-sm font-medium text-muted-foreground">{pkg.price} kr</div>
                                    {selectedTokenPackageId === pkg.id && <div className="mt-2 text-primary flex justify-center"><Check className="w-4 h-4"/></div>}
                                </div>
                            ))}
                        </div>
                        <Button 
                            onClick={handleTokenPurchase} 
                            className="w-full bg-gradient-to-r from-primary to-purple-600" 
                            size="lg"
                            disabled={!selectedTokenPackageId || isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Gå till betalning"}
                        </Button>
                    </div>
                ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-md">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                             <Lock className="h-4 w-4" />
                             Du måste vara Premium-medlem för att köpa tokens.
                        </p>
                    </div>
                )}
           </CardContent>
      </Card>

       {/* Trust Badges */}
       <div className="flex justify-center gap-8 py-8 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="text-sm font-medium">Säker betalning</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <span className="text-sm font-medium">SSL-krypterad</span>
        </div>
      </div>
    </div>
  )
}
