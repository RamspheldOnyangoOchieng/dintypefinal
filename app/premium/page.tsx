"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, Shield, Lock, Sparkles, Loader2, Coins, Activity } from "lucide-react"
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
  const [creditBalance, setCreditBalance] = useState(0)
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
          setCreditBalance(0)
          setIsCheckingStatus(false)
          return
        }

        const response = await fetch("/api/check-premium-status")
        const data = await response.json()
        setIsPremium(!!data.isPremium)
        setTokenBalance(data.tokenBalance || 0)
        setCreditBalance(data.creditBalance || 0)
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

    if (!isPremium) {
      toast.error("Endast Premium-användare kan köpa tokens")
      return
    }

    const selectedPackage = tokenPackages.find((pkg) => pkg.id === selectedTokenPackageId)
    if (!selectedPackage) {
      toast.error("Valt token-paket kunde inte hittas")
      return
    }

    // Logic: If user has enough credits, use credits. Otherwise, go to Stripe?
    // User said: "use this credit to buy tokens ... if they top up and the top up should reduce the credit balance"
    // This implies using credits is the primary way.

    if (creditBalance >= selectedPackage.price) {
      // Use credits
      try {
        setIsLoading(true)
        const response = await fetch("/api/convert-credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creditAmount: selectedPackage.price,
            tokenAmount: selectedPackage.tokens,
            description: `Top up ${selectedPackage.tokens} tokens using credits`
          })
        })

        const data = await response.json()
        if (response.ok) {
          toast.success(`Framgång! Du har köpt ${selectedPackage.tokens} tokens.`)
          setTokenBalance(prev => prev + selectedPackage.tokens)
          setCreditBalance(prev => prev - selectedPackage.price)
        } else {
          throw new Error(data.error || "Misslyckades att konvertera krediter")
        }
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setIsLoading(false)
      }
    } else {
      // Not enough credits, maybe offer to buy credits or go direct to Stripe (Old behavior)
      toast.error("Inte tillräckligt med krediter. Din prenumeration ger dig månatliga krediter.")

      // Optionally fallback to Stripe:
      /*
      try {
        setIsLoading(true)
        const response = await fetch("/api/create-checkout-session", { ... })
        ...
      } catch (error) { ... }
      */
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
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
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
            <Badge variant="outline" className="text-base px-4 py-2 border-primary/50 text-primary bg-primary/5">
              <Shield className="w-4 h-4 mr-2" />
              {creditBalance} Credits
            </Badge>
            <Badge variant="outline" className="text-base px-4 py-2">
              <Coins className="w-4 h-4 mr-2" />
              {tokenBalance} Tokens
            </Badge>
          </div>
        )}
      </div>

      {/* ISSUE 1: Pricing Comparison Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="text-center bg-muted/30">
          <CardTitle className="text-3xl">Jämför Planer</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b bg-muted/10">
                <th className="text-left p-4 font-bold text-lg">Funktion</th>
                <th className="text-center p-4 font-bold text-lg">Free User</th>
                <th className="text-center p-4 font-bold text-lg text-primary bg-primary/5 rounded-t-lg">Premium User<br /><span className="text-sm font-normal text-muted-foreground">1 month subscription</span></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/20 transition-colors">
                <td className="p-4 font-medium">Pris (Price)</td>
                <td className="p-4 text-center">0 EUR / 0 SEK</td>
                <td className="p-4 text-center font-bold bg-primary/5">11 EUR / 110 SEK month</td>
              </tr>
              <tr className="border-b hover:bg-muted/20 transition-colors">
                <td className="p-4 font-medium">Månatliga Krediter (Monthly Credits)</td>
                <td className="p-4 text-center text-muted-foreground">0 Credits</td>
                <td className="p-4 text-center font-bold text-green-600 bg-primary/5">110 Credits included</td>
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
              <tr className="hover:bg-muted/20 transition-colors">
                <td className="p-4 font-medium">Använd krediter för tokens</td>
                <td className="p-4 text-center text-red-500">Nej</td>
                <td className="p-4 text-center font-bold text-green-600 bg-primary/5">Ja</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
        <CardFooter className="justify-center p-8 bg-muted/20 border-t">
          {!isPremium ? (
            <Button
              size="lg"
              onClick={handlePremiumPurchase}
              disabled={isLoading}
              className="w-full md:w-auto min-w-[200px] text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-md"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-5 w-5" /> Bli Premium Nu</>}
            </Button>
          ) : (
            <div className="text-center">
              <Badge className="text-lg px-6 py-3 bg-green-500 hover:bg-green-600 transition-colors">
                <Check className="w-5 h-5 mr-2" />
                Premium-medlemskap är aktivt!
              </Badge>
            </div>
          )}
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ISSUE 2: Token Usage Table */}
        <Card className="h-full border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Hur tokens används
            </CardTitle>
            <CardDescription>Kostnad för att använda olika funktioner</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
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
                  <td className="p-4 text-right font-semibold">5–10 tokens</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* ISSUE 3: Buy Tokens Section */}
        <Card className="h-full border-primary/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1">
            <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
              Premium Only
            </div>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Fyll på tokens (Top up)
            </CardTitle>
            <CardDescription>
              Använd dina månatliga krediter för att köpa fler tokens när du behöver dem.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Purchase Functional Block - Only if Premium */}
            {isPremium ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div>
                    <div className="text-sm text-muted-foreground">Ditt saldo</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      {creditBalance} <span className="text-sm font-normal text-muted-foreground">Credits</span>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-border hidden sm:block"></div>
                  <div>
                    <div className="text-sm text-muted-foreground">Nuvarande tokens</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-500" />
                      {tokenBalance} <span className="text-sm font-normal text-muted-foreground">Tokens</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="font-semibold text-base">Välj ett paket:</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {tokenPackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedTokenPackageId(pkg.id)}
                        className={`
                          cursor-pointer rounded-xl border-2 p-3 transition-all duration-200 
                          ${selectedTokenPackageId === pkg.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/30 hover:bg-muted/50"}
                        `}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold">{pkg.tokens} Tokens</span>
                          {selectedTokenPackageId === pkg.id && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="text-sm font-medium text-primary">{pkg.price} Credits</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleTokenPurchase}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg text-lg h-12"
                  disabled={!selectedTokenPackageId || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>Tanka Tokens ({tokenPackages.find(p => p.id === selectedTokenPackageId)?.price || 0} Credits)</>
                  )}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground italic">
                  Varje gång du fyller på (top up), minskas ditt kredit-saldo.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-xl flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-900 dark:text-amber-100">Endast för Premium</h4>
                  <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                    Bli premium-medlem för att få månatliga krediter och möjligheten att köpa tokens.
                  </p>
                </div>
                <Button onClick={handlePremiumPurchase} variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white transition-all">
                  Uppgradera nu
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 py-8 border-t border-border/50 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">Säker betalning med Stripe</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-blue-500" />
          <span className="text-sm font-medium">SSL-krypterad anslutning</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <span className="text-sm font-medium">Exklusiva Premium-funktioner</span>
        </div>
      </div>
    </div>
  )
}
