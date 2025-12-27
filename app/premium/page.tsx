"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Check, 
  Shield, 
  Lock, 
  Sparkles, 
  Loader2, 
  Coins, 
  Activity, 
  Zap, 
  MessageSquare, 
  UserPlus, 
  Image as ImageIcon,
  ChevronRight,
  Star,
  ZapOff,
  CreditCard,
  Target
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TokenPackage {
  id: string
  name: string
  tokens: number
  price: number
  priceDisplay: string
}

export default function PremiumPage() {
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [creditBalance, setCreditBalance] = useState(0)
  const [selectedTokenPackageId, setSelectedTokenPackageId] = useState<string | null>(null)

  const router = useRouter()
  const { user } = useAuth()
  const statusCheckRef = useRef<boolean>(false)

  // Fetch token packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch("/api/token-packages")
        const data = await response.json()
        if (data.success) {
          setTokenPackages(data.packages)
        }
      } catch (error) {
        console.error("Error fetching packages:", error)
      }
    }
    fetchPackages()
  }, [])

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

    const selectedPackage = tokenPackages.find((pkg) => pkg.id === selectedTokenPackageId)
    if (!selectedPackage) {
      toast.error("Valt token-paket kunde inte hittas")
      return
    }

    // Admin skip credits check and just grant tokens
    if (user.isAdmin) {
      try {
        setIsLoading(true)
        const response = await fetch("/api/admin/grant-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenAmount: selectedPackage.tokens,
            description: `Admin self-grant: ${selectedPackage.tokens} tokens`
          })
        })

        const data = await response.json()
        if (response.ok) {
          toast.success(`Administratör! Du har lagt till ${selectedPackage.tokens} tokens till ditt konto.`)
          setTokenBalance(prev => prev + selectedPackage.tokens)
        } else {
          throw new Error(data.error || "Misslyckades att lägga till tokens")
        }
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!isPremium) {
      toast.error("Endast Premium-användare kan köpa tokens")
      return
    }

    if (creditBalance >= selectedPackage.price) {
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
      toast.error("Inte tillräckligt med krediter. Din prenumeration ger dig månatliga krediter.")
    }
  }

  if (isCheckingStatus) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Dynamic Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="container max-w-7xl mx-auto py-12 px-4 space-y-20 relative">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <Badge variant="outline" className="px-4 py-1.5 border-primary/20 text-primary bg-primary/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-700">
            DINTYP.SE PREMIUM
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent italic">
            Uppgradera din upplevelse
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Lås upp obegränsad potential, exklusivt innehåll och månatliga krediter för att förgylla din digitala värld.
          </p>

          {/* Balance Cards (Mobile & Desktop) */}
          {user && (
            <div className="flex flex-wrap items-center justify-center gap-4 pt-6 animate-in zoom-in duration-1000">
              <div className={cn(
                "group relative overflow-hidden flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all duration-300 backdrop-blur-md shadow-lg",
                user.isAdmin ? "border-red-500/50 bg-red-500/5" : isPremium ? "border-primary/50 bg-primary/5" : "border-border bg-card/50"
              )}>
                <div className={cn(
                  "p-2 rounded-xl",
                  user.isAdmin ? "bg-red-500/10 text-red-500" : isPremium ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {user.isAdmin ? <Lock className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-tight">Status</p>
                  <p className="text-lg font-bold">
                    {user.isAdmin ? "Administrator" : isPremium ? "Premium Active" : "Free User"}
                  </p>
                </div>
              </div>

              <div className="group relative overflow-hidden flex items-center gap-4 px-6 py-4 rounded-2xl border border-primary/30 bg-card/50 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-primary/60">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-tight">Saldo</p>
                  <p className="text-2xl font-black tracking-tighter">
                    {user.isAdmin ? "∞" : creditBalance} <span className="text-xs font-medium text-muted-foreground italic">Credits</span>
                  </p>
                </div>
              </div>

              <div className="group relative overflow-hidden flex items-center gap-4 px-6 py-4 rounded-2xl border border-yellow-500/30 bg-card/50 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-yellow-500/60">
                <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
                  <Coins className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold leading-tight">Tokens</p>
                  <p className="text-2xl font-black tracking-tighter">
                    {tokenBalance} <span className="text-xs font-medium text-muted-foreground italic">Tokens</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comparison Section - Redesigned Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Free Tier */}
          <Card className="group relative overflow-hidden border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-500 hover:translate-y-[-4px] hover:shadow-2xl flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ZapOff className="w-24 h-24" />
            </div>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-bold italic">Free Plan</CardTitle>
              <CardDescription className="text-3xl font-black text-foreground pt-2">
                0 € <span className="text-sm font-medium text-muted-foreground italic">per månad</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-6 space-y-6 flex-grow">
              <div className="space-y-4">
                {[
                  { icon: <CreditCard className="w-4 h-4" />, text: "Inga månatliga krediter" },
                  { icon: <MessageSquare className="w-4 h-4" />, text: "3 fria meddelanden per dag" },
                  { icon: <Lock className="w-4 h-4" />, text: "Kan ej skapa AI flickvän" },
                  { icon: <ImageIcon className="w-4 h-4" />, text: "Endast 1 gratis bild (SFW)" },
                  { icon: <Shield className="w-4 h-4" />, text: "Ingen token-konvertering" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">
                    <div className="p-1 rounded-full bg-muted/50 text-muted-foreground scale-75 group-hover:scale-100 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0">
              <Button variant="outline" className="w-full h-12 rounded-xl text-lg font-bold grayscale opacity-50 cursor-default">
                Nuvarande Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Tier */}
          <Card className="group relative overflow-hidden border-primary/40 bg-gradient-to-br from-primary/10 via-card/50 to-purple-500/10 backdrop-blur-xl transition-all duration-500 hover:translate-y-[-8px] hover:shadow-[0_0_50px_-12px_rgba(var(--primary-rgb),0.3)] shadow-xl ring-1 ring-primary/20 flex flex-col">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-[40px] animate-pulse" />
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Star className="w-24 h-24 text-primary fill-primary" />
            </div>
            
            <Badge className="absolute top-6 right-6 bg-primary text-primary-foreground font-black tracking-widest px-3 py-1 shadow-md">
              MOST POPULAR
            </Badge>

            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-bold flex items-center gap-2 italic">
                Premium Plan <Sparkles className="w-5 h-5 text-primary animate-bounce shadow-glow" />
              </CardTitle>
              <CardDescription className="text-4xl font-black text-foreground pt-2 flex items-baseline gap-2">
                11 € <span className="text-sm font-medium text-muted-foreground italic">/ 110 SEK per månad</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-6 space-y-6 flex-grow">
              <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mb-6" />
              <div className="space-y-4">
                {[
                  { icon: <Shield className="w-4 h-4" />, text: "110 Krediter ingår varje månad", highlight: "text-primary" },
                  { icon: <MessageSquare className="w-4 h-4" />, text: "Obegränsade textmeddelanden", highlight: "text-green-500" },
                  { icon: <UserPlus className="w-4 h-4" />, text: "Skapa obegränsat med AI karaktärer", highlight: "text-green-500" },
                  { icon: <ImageIcon className="w-4 h-4" />, text: "Alltid obegränsade bilder (NSFW/SFW)", highlight: "text-green-500" },
                  { icon: <Zap className="w-4 h-4" />, text: "Möjlighet att köpa tokens med krediter", highlight: "text-primary" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={cn("p-1.5 rounded-full bg-primary/20 shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]", item.highlight)}>
                      <Check className="w-4 h-4" />
                    </div>
                    <span className={cn("text-base font-semibold tracking-tight", item.highlight || "text-foreground")}>{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="p-8 pt-0">
              {user?.isAdmin ? (
                <div className="w-full text-center py-4 bg-primary/5 rounded-xl border border-primary/20">
                   <p className="text-primary font-bold italic flex items-center justify-center gap-2">
                     <Shield className="w-4 h-4" /> Admin Access Locked
                   </p>
                </div>
              ) : isPremium ? (
                <div className="w-full text-center py-4 bg-green-500/10 rounded-xl border border-green-500/20">
                   <p className="text-green-500 font-bold italic flex items-center justify-center gap-2">
                     <Check className="w-5 h-5" /> Din prenumeration är aktiv
                   </p>
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={handlePremiumPurchase}
                  disabled={isLoading}
                  className="w-full h-14 rounded-xl text-xl font-black bg-gradient-to-r from-primary to-purple-600 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)] transition-all animate-shimmer"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "BLI PREMIUM NU"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight italic">Hur tokens används</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Texting", value: "5 Tokens", desc: "per sms", icon: <MessageSquare className="w-6 h-6 text-blue-500" /> },
              { title: "Creation", value: "2 Tokens", desc: "per girlfriend", icon: <UserPlus className="w-6 h-6 text-pink-500" /> },
              { title: "Images", value: "5-10 Tokens", desc: "per generation", icon: <ImageIcon className="w-6 h-6 text-purple-500" /> }
            ].map((item, i) => (
              <div key={i} className="group relative p-8 rounded-3xl bg-card/40 border border-border/50 backdrop-blur-md hover:border-primary/40 transition-all duration-300">
                <div className="absolute top-4 right-4 text-xs font-mono text-muted-foreground opacity-30 tracking-tighter">0{i+1}</div>
                <div className="mb-6 p-3 rounded-2xl bg-muted/50 w-fit mx-auto transition-transform group-hover:scale-110 group-hover:bg-primary/5">
                  {item.icon}
                </div>
                <h4 className="text-lg font-bold text-muted-foreground group-hover:text-foreground transition-colors italic">{item.title}</h4>
                <p className="text-3xl font-black tracking-tighter pt-1">{item.value}</p>
                <p className="text-sm text-muted-foreground border-t border-border/30 mt-3 pt-3">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase Interface */}
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold italic">Tanka Tokens</h2>
            <p className="text-muted-foreground pt-2 font-medium">Använd dina månatliga krediter för att fylla på din plånbok</p>
          </div>

          <Card className="border-border/50 bg-card/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
             {(!isPremium && !user?.isAdmin) && (
               <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Lock className="w-10 h-10 text-amber-500" />
                  </div>
                  <div className="max-w-xs">
                    <h4 className="text-xl font-bold tracking-tight">Ett steg kvar...</h4>
                    <p className="text-sm text-muted-foreground pt-1 pb-6">Du behöver Premium för att kunna köpa och använda tokens.</p>
                    <Button onClick={handlePremiumPurchase} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold">
                       UPPGRADERA NU
                    </Button>
                  </div>
               </div>
             )}

             <CardHeader className="p-8 border-b border-border/10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black tracking-[0.2em] text-primary">SELECT PACKAGE</p>
                      <h3 className="text-2xl font-bold italic">Välj ett paket</h3>
                   </div>
                   <div className="flex items-center gap-6 p-4 rounded-2xl bg-muted/30 border border-border/50">
                      <div>
                        <p className="text-[9px] font-black text-muted-foreground tracking-widest leading-none pb-1">KREDITS</p>
                        <p className="text-xl font-black italic">{user?.isAdmin ? "∞" : creditBalance}</p>
                      </div>
                      <div className="w-px h-8 bg-border/50" />
                      <div>
                        <p className="text-[9px] font-black text-muted-foreground tracking-widest leading-none pb-1">TOKENS</p>
                        <p className="text-xl font-black italic">{tokenBalance}</p>
                      </div>
                   </div>
                </div>
             </CardHeader>

             <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tokenPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedTokenPackageId(pkg.id)}
                      className={cn(
                        "group relative cursor-pointer rounded-3xl border-2 p-6 transition-all duration-300 overflow-hidden",
                        selectedTokenPackageId === pkg.id
                          ? "border-primary bg-primary/5 shadow-[0_0_30px_-5px_rgba(var(--primary-rgb),0.4)]"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                           <Coins className={cn("w-5 h-5", selectedTokenPackageId === pkg.id ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        {selectedTokenPackageId === pkg.id && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-300">
                             <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm font-bold text-muted-foreground italic">{pkg.name}</p>
                      <p className="text-3xl font-black tracking-tighter pt-1">{pkg.tokens.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground font-medium pb-4">Tokens total</p>
                      
                      <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-muted-foreground tracking-widest leading-none uppercase">Pris</span>
                        <span className="text-lg font-black italic text-primary">
                           {user?.isAdmin ? "GRATIS" : (pkg.priceDisplay || `${pkg.price} kr`)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-4">
                  <Button
                    onClick={handleTokenPurchase}
                    className={cn(
                      "w-full h-14 rounded-2xl text-xl font-black shadow-xl tracking-wide",
                      user?.isAdmin ? "bg-blue-600 hover:bg-blue-700" : "bg-gradient-to-r from-primary to-purple-600 hover:shadow-primary/20"
                    )}
                    disabled={!selectedTokenPackageId || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <div className="flex items-center gap-2">
                         <Target className="w-5 h-5" />
                         {user?.isAdmin ? "BEVILJA TOKENS" : (
                           <>TANKA TOKENS <span className="text-sm opacity-50 px-2 font-medium">({tokenPackages.find(p => p.id === selectedTokenPackageId)?.price || 0} Credits)</span></>
                         )}
                      </div>
                    )}
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground italic font-medium">
                     {user?.isAdmin 
                      ? "Som administratör kan du lägga till tokens utan att spendera krediter." 
                      : "Ditt kreditsaldo minskas med motsvarande belopp vid godkännande."}
                  </p>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Footer Trust Section */}
        <div className="flex flex-wrap items-center justify-center gap-12 pt-12 opacity-50 hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm font-bold tracking-tight">SECURE PAYMENTS</span>
           </div>
           <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-bold tracking-tight">PRIVATE BILLING</span>
           </div>
           <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-bold tracking-tight">LIMITLESS AI</span>
           </div>
        </div>
      </div>
    </div>
  )
}
