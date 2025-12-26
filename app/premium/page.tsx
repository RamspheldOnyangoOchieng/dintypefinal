"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, Shield, Lock, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { createClient } from "@/utils/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface TokenPackage {
  id: string
  name: string
  tokens: number
  price: number
  description: string
  active: boolean
}

interface TokenCost {
  id: string
  feature_key: string
  feature_name_sv: string
  cost_tokens: number
  description_sv: string
  active: boolean
}

export default function PremiumPage() {
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([])
  const [tokenCosts, setTokenCosts] = useState<TokenCost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedTokenPackageId, setSelectedTokenPackageId] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    
    const fetchData = async () => {
      try {
        const [packagesResult, costsResult] = await Promise.all([
           supabase
            .from('token_packages')
            .select('*')
            .eq('active', true)
            .order('tokens', { ascending: true }),
           supabase
            .from('token_costs')
            .select('*')
            .eq('active', true)
            .order('feature_name_sv', { ascending: true })
        ])

        if (packagesResult.error) throw packagesResult.error
        if (costsResult.error) throw costsResult.error

        setTokenPackages(packagesResult.data || [])
        setTokenCosts(costsResult.data || [])
      } catch (error) {
        console.error("Error fetching premium data:", error)
        toast.error("Kunde inte ladda premiumdata")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handlePremiumPurchase = async () => {
    if (!user) {
      toast.error("Vänligen logga in för att köpa Premium")
      router.push("/login?redirect=/premium")
      return
    }

    try {
      setIsProcessing(true)

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
      setIsProcessing(false)
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

    try {
      setIsProcessing(true)

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
      setIsProcessing(false)
    }
  }

  if (isLoading) {
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
      </div>

      {/* Subscription Comparison */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Jämför Planer</CardTitle>
          <CardDescription>Vad får du som Premium-medlem?</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="col-span-1 font-semibold p-4 text-left">Funktion</div>
              <div className="col-span-1 font-semibold p-4 text-center bg-muted/50 rounded-t-lg">Gratis</div>
              <div className="col-span-1 font-semibold p-4 text-center bg-primary/10 text-primary rounded-t-lg border-t-2 border-primary">Premium</div>
            </div>
            
            <div className="space-y-2">
              {[
                { label: "Pris", free: "0 kr", premium: "110 kr / månad" },
                { label: "Chattmeddelanden", free: "Begränsat (3/dag)", premium: "Obegränsat" },
                { label: "AI Karaktärer", free: "Begränsat utbud", premium: "Tillgång till alla" },
                { label: "Bildgenerering", free: "1 gratis SFW", premium: "Obegränsat (SFW & NSFW)" },
                { label: "Startbonus", free: "-", premium: "100 Tokens" },
                { label: "Köpa Tokens", free: "Ej tillgängligt", premium: "Tillgängligt" },
              ].map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 items-center border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <div className="col-span-1 p-4 font-medium">{item.label}</div>
                  <div className="col-span-1 p-4 text-center text-muted-foreground">{item.free}</div>
                  <div className="col-span-1 p-4 text-center font-bold bg-primary/5">{item.premium}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center p-8 bg-muted/20">
          <Button 
            size="lg" 
            onClick={handlePremiumPurchase} 
            disabled={isProcessing}
            className="w-full md:w-auto min-w-[200px] text-lg"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-5 w-5" /> Bli Premium Nu</>}
          </Button>
        </CardFooter>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Token Usage Table */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Vad kostar det?</CardTitle>
            <CardDescription>Token-kostnader för olika funktioner</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                {tokenCosts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Kunde inte ladda priser.</p>
                ) : (
                    tokenCosts.map((cost) => (
                        <div key={cost.id} className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col">
                                <span className="font-medium">{cost.feature_name_sv}</span>
                                <span className="text-xs text-muted-foreground">{cost.description_sv}</span>
                            </div>
                            <Badge variant="secondary" className="ml-2 whitespace-nowrap">
                                {cost.cost_tokens} tokens
                            </Badge>
                        </div>
                    ))
                )}
             </div>
          </CardContent>
        </Card>

        {/* Buy Tokens Section */}
        <Card className="h-full border-primary/20 shadow-lg">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Köp Tokens
             </CardTitle>
             <CardDescription>
                Fyll på ditt saldo. Endast för Premium-medlemmar.
             </CardDescription>
           </CardHeader>
           <CardContent>
             {tokenPackages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    Inga paket tillgängliga just nu.
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tokenPackages.map((pkg) => (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedTokenPackageId(pkg.id)}
                          className={`
                            cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
                            ${selectedTokenPackageId === pkg.id 
                                ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                                : "border-border hover:border-primary/50 hover:bg-muted/50"}
                          `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-lg">{pkg.tokens} Tokens</span>
                                {selectedTokenPackageId === pkg.id && <Check className="h-5 w-5 text-primary" />}
                            </div>
                            <div className="text-2xl font-bold text-primary mb-1">
                                {pkg.price} kr
                            </div>
                            {pkg.description && (
                                <p className="text-xs text-muted-foreground">{pkg.description}</p>
                            )}
                        </div>
                    ))}
                </div>
             )}
           </CardContent>
           <CardFooter>
             <Button 
                onClick={handleTokenPurchase} 
                className="w-full" 
                size="lg"
                disabled={!selectedTokenPackageId || isProcessing}
             >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Gå till betalning"}
             </Button>
           </CardFooter>
        </Card>
      </div>

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
