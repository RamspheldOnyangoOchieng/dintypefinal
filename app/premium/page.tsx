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
  Target,
  Trophy,
  PartyPopper
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [lastGrantedAmount, setLastGrantedAmount] = useState(0)

  const router = useRouter()
  const { user, refreshUser } = useAuth()
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
          setLastGrantedAmount(selectedPackage.tokens)
          await refreshUser()
          setShowSuccessDialog(true)
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

    if (!isPremium && !user.isAdmin) {
      toast.error("Endast Premium-användare kan köpa tokens")
      return
    }

    // New rule: Premium users can only buy tokens when they have used up their free ones
    if (isPremium && !user.isAdmin && tokenBalance > 0) {
      toast.error("Du har fortfarande tokens kvar. Du kan köpa mer när ditt saldo är 0.")
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
          await refreshUser()
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
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Dynamic Background Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[5%] -left-[5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute top-[10%] -right-[5%] w-[25%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-12 relative">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary bg-primary/5 backdrop-blur-sm">
            DINTYP.SE PREMIUM
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent italic leading-tight">
            Uppgradera din upplevelse
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Lås upp obegränsad potential, exklusivt innehåll och månatliga krediter.
          </p>

          {/* Balance Cards (Compact) */}
          {user && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <div className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-sm",
                user.isAdmin ? "border-red-500/30 bg-red-500/5" : isPremium ? "border-primary/30 bg-primary/5" : "border-border bg-card/40"
              )}>
                <div className={cn(
                  "p-1.5 rounded-lg",
                  user.isAdmin ? "bg-red-500/10 text-red-500" : isPremium ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {user.isAdmin ? <Lock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-0.5">Status</p>
                  <p className="text-sm font-bold leading-tight">
                    {user.isAdmin ? "Administrator" : isPremium ? "Premium Aktiv" : "Gratisversion"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-primary/20 bg-card/40 backdrop-blur-md shadow-sm">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-0.5">Krediter</p>
                  <p className="text-lg font-black tracking-tight leading-tight">
                    {user.isAdmin ? "∞" : creditBalance} <span className="text-[10px] font-medium text-muted-foreground italic">Credits</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-yellow-500/20 bg-card/40 backdrop-blur-md shadow-sm">
                <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-0.5">Tokens</p>
                  <p className="text-lg font-black tracking-tight leading-tight">
                    {tokenBalance} <span className="text-[10px] font-medium text-muted-foreground italic">Tokens</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comparison Section - Compact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch max-w-5xl mx-auto">
          {/* Free Tier */}
          <Card className="group relative overflow-hidden border-border/40 bg-card/30 backdrop-blur-lg flex flex-col transition-all hover:bg-card/40">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xl font-bold italic">Free Plan</CardTitle>
              <CardDescription className="text-2xl font-black text-foreground pt-1">
                0 € <span className="text-xs font-medium text-muted-foreground italic">per månad</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-4 space-y-4 flex-grow">
              <div className="space-y-3">
                {[
                  { icon: <CreditCard className="w-3.5 h-3.5" />, text: "Inga månatliga krediter" },
                  { icon: <MessageSquare className="w-3.5 h-3.5" />, text: "3 fria meddelanden per dag" },
                  { icon: <Lock className="w-3.5 h-3.5" />, text: "Kan ej skapa AI flickvän" },
                  { icon: <ImageIcon className="w-3.5 h-3.5" />, text: "Endast 1 gratis bild (SFW)" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-muted-foreground/80">
                    <div className="p-1 rounded-full bg-muted/50 text-muted-foreground">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button variant="outline" disabled className="w-full h-10 rounded-lg text-sm font-bold opacity-50">
                Nuvarande Plan
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Tier */}
          <Card className="group relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-card/40 to-blue-500/5 backdrop-blur-lg flex flex-col shadow-lg ring-1 ring-primary/10">
            <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground font-black text-[10px] tracking-wider px-2 py-0.5">
              MEST POPULÄR
            </Badge>

            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-xl font-bold flex items-center gap-2 italic">
                Premium Plan <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </CardTitle>
              <CardDescription className="text-3xl font-black text-foreground pt-1 flex items-baseline gap-2">
                11 € <span className="text-xs font-medium text-muted-foreground italic">/ 110 SEK per månad</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-4 space-y-4 flex-grow">
              <div className="h-px bg-gradient-to-r from-primary/30 to-transparent mb-4" />
              <div className="space-y-3">
                {[
                  { text: "110 Krediter ingår varje månad", highlight: "text-primary" },
                  { text: "Obegränsade textmeddelanden", highlight: "text-emerald-500" },
                  { text: "Skapa obegränsat med AI karaktärer", highlight: "text-emerald-500" },
                  { text: "Obegränsade bilder (NSFW/SFW)", highlight: "text-emerald-500" },
                  { text: "Köp tokens med dina krediter", highlight: "text-primary" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={cn("p-1 rounded-full bg-primary/10", item.highlight)}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className={cn("text-sm font-semibold tracking-tight", item.highlight || "text-foreground")}>{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="p-6 pt-0">
              {user?.isAdmin ? (
                <div className="w-full text-center py-2.5 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs text-primary font-bold italic flex items-center justify-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Admin-konto
                  </p>
                </div>
              ) : isPremium ? (
                <div className="w-full text-center py-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/10">
                  <p className="text-xs text-emerald-500 font-bold italic flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Prenumeration aktiv
                  </p>
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={handlePremiumPurchase}
                  disabled={isLoading}
                  className="w-full h-11 rounded-lg text-base font-black bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg transition-all"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "BLI PREMIUM"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Feature Highlights - Very Compact */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Chatt", value: "5 Tokens", desc: "per sms", icon: <MessageSquare className="w-5 h-5 text-blue-500" /> },
            { title: "Skapa AI", value: "2 Tokens", desc: "per profil", icon: <UserPlus className="w-5 h-5 text-primary" /> },
            { title: "Bilder", value: "5-10 Tokens", desc: "per bild", icon: <ImageIcon className="w-5 h-5 text-blue-500" /> }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-card/20 border border-border/40 backdrop-blur-sm">
              <div className="p-2.5 rounded-xl bg-muted/40">
                {item.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.title}</h4>
                <p className="text-lg font-black tracking-tight leading-none">{item.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Purchase Interface - Tighter Layout */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold italic">Tanka Tokens</h2>
            <p className="text-sm text-muted-foreground font-medium">Omvandla dina krediter till tokens för specialfunktioner</p>
          </div>

          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-xl relative overflow-hidden">
            {(!isPremium && !user?.isAdmin) && (
              <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
                  <Lock className="w-6 h-6 text-amber-500" />
                </div>
                <h4 className="text-lg font-bold">Premium Krävs</h4>
                <p className="text-xs text-muted-foreground mb-4">Du behöver Premium för att kunna använda tokens.</p>
                <Button onClick={handlePremiumPurchase} className="h-10 px-6 rounded-lg bg-primary font-bold text-sm">
                  UPPGRADERA MER
                </Button>
              </div>
            )}

            <CardHeader className="p-6 border-b border-border/10">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-bold italic tracking-tight">Välj ett paket</h3>
                <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-muted/40 border border-border/40">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-muted-foreground uppercase leading-none pb-0.5">Krediter</p>
                    <p className="text-sm font-black italic leading-none">{user?.isAdmin ? "∞" : creditBalance}</p>
                  </div>
                  <div className="w-px h-6 bg-border/40" />
                  <div className="text-center">
                    <p className="text-[8px] font-black text-muted-foreground uppercase leading-none pb-0.5">Tokens</p>
                    <p className="text-sm font-black italic leading-none">{tokenBalance}</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {tokenPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedTokenPackageId(pkg.id)}
                    className={cn(
                      "cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200",
                      selectedTokenPackageId === pkg.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border/50 hover:border-primary/20 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Coins className={cn("w-4 h-4", selectedTokenPackageId === pkg.id ? "text-primary" : "text-muted-foreground")} />
                      {selectedTokenPackageId === pkg.id && <Check className="w-3 h-3 text-primary" />}
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{pkg.name}</p>
                    <p className="text-2xl font-black tracking-tighter py-1">{pkg.tokens.toLocaleString()}</p>
                    <div className="pt-2 border-t border-border/20 mt-2 flex justify-between items-center">
                      <span className="text-[9px] font-bold text-muted-foreground">PRIS</span>
                      <span className="text-sm font-black text-primary italic">
                        {user?.isAdmin ? "GRATIS" : (pkg.priceDisplay || `${pkg.price} kr`)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 space-y-3">
                <Button
                  onClick={handleTokenPurchase}
                  className={cn(
                    "w-full h-12 rounded-xl text-lg font-black tracking-wide",
                    user?.isAdmin ? "bg-blue-600 hover:bg-blue-700" : "bg-gradient-to-r from-primary to-blue-600 shadow-md"
                  )}
                  disabled={!selectedTokenPackageId || isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : user?.isAdmin ? "BEVILJA TOKENS" : "KÖP TOKENS"}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground italic">
                  {user?.isAdmin
                    ? "Som administratör kan du lägga till tokens utan kostnad."
                    : "Krediter dras automatiskt från ditt saldo."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Trust - Minimalist */}
        <div className="flex flex-wrap items-center justify-center gap-8 py-4 opacity-40 text-[10px] font-bold tracking-widest uppercase">
          <div className="flex items-center gap-2"><Shield className="w-3 h-3" /> SECURE</div>
          <div className="flex items-center gap-2"><Lock className="w-3 h-3" /> PRIVATE</div>
          <div className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> UNLIMITED</div>
        </div>
      </div>

      {/* Admin Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md border-primary/20 bg-card/95 backdrop-blur-xl">
          <DialogHeader className="flex flex-col items-center justify-center pt-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/5 animate-bounce">
              <PartyPopper className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black text-center tracking-tight italic">
              TOKENS BEVILJADE!
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground font-medium pt-1">
              Ditt administratörskonto har uppdaterats framgångsrikt.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10">
              <span className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Nytt Saldo</span>
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-yellow-500" />
                <span className="text-4xl font-black tabular-nums">{tokenBalance}</span>
              </div>
              <div className="mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[10px] font-black text-emerald-500 uppercase">+{lastGrantedAmount} Tokens Tillagda</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <Shield className="w-4 h-4 text-primary" />
                <span>Systemloggar uppdaterade med administratörsåtgärd.</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>Din profil och balans har synkroniserats globalt.</span>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              variant="premium"
              className="w-full h-11 text-base font-black tracking-tight"
              onClick={() => setShowSuccessDialog(false)}
            >
              FORTSÄTT TILL DASHBOARD
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
