"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Coins, 
  CreditCard, 
  Activity, 
  Settings, 
  LogOut, 
  Trash2, 
  AlertTriangle,
  ChevronRight,
  Clock,
  Sparkles,
  Save,
  Loader2,
  Lock,
  Globe,
  Bell
} from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import DeleteFeedbackModal from "@/components/delete-feedback-modal"
import DeleteConfirmationModal from "@/components/delete-confirmation-modal"
import { TokenTransactionHistory } from "@/components/token-transaction-history"
import { TokenUsageStats } from "@/components/token-usage-stats"

const rules = [
  "Illegal Activities & Criminal Behavior",
  "Commercial sexual activities (including prostitution)",
  "Human trafficking",
  "Sexual exploitation and pornography",
  "Creation or depiction of underage characters",
  "Violence & Harm incitement",
  "Hate Speech & Discrimination",
  "Privacy violations & Impersonation",
  "Misinformation & Political Interference",
]

export default function ProfilePage() {
  const { user, isLoading, logout, refreshUser } = useAuth()
  const router = useRouter()
  
  // Profile Data State
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
    gender: "Male",
    language: "sv",
    notifications: true,
  })
  
  const [tokenBalance, setTokenBalance] = useState(0)
  const [creditBalance, setCreditBalance] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteFeedback, setDeleteFeedback] = useState({ reason: "", description: "" })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/profile")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!user) return
      
      try {
        setIsDataLoading(true)
        const supabase = createClient()
        
        // Fetch from profiles table
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
          
        if (profile) {
          const p = profile as any
          setProfileData({
            username: p.username || user.username || "",
            email: p.email || user.email || "",
            phone: p.phone || "",
            gender: p.gender || "Male",
            language: p.language || "sv",
            notifications: p.notifications !== false,
          })
          setIsPremium(p.is_premium || false)
        } else {
          // Fallback if profile row doesn't exist yet
          setProfileData(prev => ({
            ...prev,
            username: user.username || "",
            email: user.email || "",
          }))
        }

        // Fetch balances
        const response = await fetch("/api/check-premium-status")
        if (response.ok) {
          const data = await response.json()
          setTokenBalance(data.tokenBalance || 0)
          setCreditBalance(data.creditBalance || 0)
          setIsPremium(data.isPremium || false)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsDataLoading(false)
      }
    }

    fetchFullProfile()
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    
    try {
      setIsSaving(true)
      const supabase = createClient()
      
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profileData.username,
          email: profileData.email,
          phone: profileData.phone,
          gender: profileData.gender,
          language: profileData.language,
          notifications: profileData.notifications,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", user.id)
        
      if (error) throw error
      
      // Update auth metadata if username changed
      await supabase.auth.updateUser({
        data: { username: profileData.username }
      })
      
      await refreshUser()
      toast.success("Profilen har uppdaterats!")
    } catch (error: any) {
      console.error("Error saving profile:", error)
      toast.error("Kunde inte spara profilen: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    try {
      const response = await fetch('/api/delete-account', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          userId: user.id, 
          reason: deleteFeedback.reason, 
          description: deleteFeedback.description 
        }) 
      })
      
      if (response.ok) {
        toast.success('Ditt konto kommer att raderas inom kort.')
        logout()
        router.push("/")
      } else {
        throw new Error("Failed to submit deletion")
      }
    } catch (e: any) {
      toast.error('Kunde inte begära radering')
    } finally {
      setShowDeleteConfirm(false)
      setShowDeleteModal(false)
    }
  }

  if (isLoading || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Dynamic Header */}
      <div className="relative h-64 w-full bg-gradient-to-r from-primary/20 via-primary/5 to-purple-500/10 overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="container max-w-6xl mx-auto h-full flex items-end pb-8 px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background shadow-2xl ring-4 ring-primary/10">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-4xl bg-muted text-muted-foreground uppercase">
                  {(user.username || user.email || "?").charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isPremium && (
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg ring-2 ring-background">
                  PRO
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{profileData.username || "Välkommen"}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </div>
                {user.isAdmin && (
                  <Badge variant="destructive" className="uppercase font-black tracking-widest text-[10px]">ADMIN</Badge>
                )}
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  Gick med {new Date(user.createdAt).toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-background/60 backdrop-blur-md border border-border/50 shadow-sm">
                 <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                       <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-0.5">Tokens</p>
                      <p className="text-xl font-black leading-none">{tokenBalance}</p>
                    </div>
                 </div>
                 <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => router.push("/premium")}>
                   <ChevronRight className="w-4 h-4" />
                 </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto pt-10 px-4">
        <Tabs defaultValue="account" className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-4">
            <TabsList className="bg-muted/50 p-1 rounded-xl h-11 border border-border/40">
              <TabsTrigger value="account" className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 h-9">
                <User className="w-4 h-4 mr-2" /> Konto
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 h-9">
                <Activity className="w-4 h-4 mr-2" /> Historik
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg font-bold text-xs uppercase tracking-widest px-6 h-9">
                <Shield className="w-4 h-4 mr-2" /> Säkerhet
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
               <Badge variant="outline" className="h-9 px-4 rounded-xl border-primary/20 bg-primary/5 text-primary">
                 ID: {user.id.substring(0, 8)}...
               </Badge>
            </div>
          </div>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <Settings className="w-5 h-5 text-primary" /> Profilinställningar
                    </CardTitle>
                    <CardDescription>Hantera dina personliga uppgifter och hur du visas på plattformen.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Användarnamn</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="username" 
                            className="pl-10 h-11 bg-background/50" 
                            value={profileData.username} 
                            onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kön</Label>
                        <div className="relative">
                          <select 
                            id="gender" 
                            className="w-full pl-3 pr-10 h-11 bg-background/50 border border-input rounded-md flex items-center appearance-none"
                            value={profileData.gender}
                            onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                          >
                            <option value="Male">Man</option>
                            <option value="Female">Kvinna</option>
                            <option value="Other">Annat</option>
                          </select>
                          <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground rotate-90 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-postadress</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="email" 
                            type="email" 
                            className="pl-10 h-11 bg-background/50" 
                            value={profileData.email} 
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">OBS: Ändring av e-post kräver verifiering.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefonnummer</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="phone" 
                            type="tel" 
                            className="pl-10 h-11 bg-background/50" 
                            value={profileData.phone} 
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            placeholder="+46 XXX XX XX XX"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/40" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Språk / Language</Label>
                        <div className="flex items-center gap-3">
                           <Globe className="w-5 h-5 text-muted-foreground" />
                           <div className="flex gap-2">
                              {["sv", "en"].map((lang) => (
                                <Button 
                                  key={lang}
                                  variant={profileData.language === lang ? "default" : "outline"}
                                  size="sm"
                                  className="uppercase text-[10px] font-black w-20"
                                  onClick={() => setProfileData({...profileData, language: lang})}
                                >
                                  {lang === "sv" ? "Svenska" : "English"}
                                </Button>
                              ))}
                           </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifikationer</Label>
                        <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border/40">
                           <Bell className={cn("w-5 h-5", profileData.notifications ? "text-primary" : "text-muted-foreground")} />
                           <div className="flex-1">
                              <p className="text-xs font-bold">Automatiska aviseringar</p>
                              <p className="text-[10px] text-muted-foreground">Visa statusuppdateringar och nyheter</p>
                           </div>
                           <input 
                              type="checkbox" 
                              checked={profileData.notifications}
                              onChange={(e) => setProfileData({...profileData, notifications: e.target.checked})}
                              className="w-5 h-5 accent-primary"
                           />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t border-border/40 p-4">
                     <Button 
                       className="ml-auto bg-primary hover:bg-primary/90 font-black tracking-wide"
                       onClick={handleSaveProfile}
                       disabled={isSaving}
                     >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        SPARA ÄNDRINGAR
                     </Button>
                  </CardFooter>
                </Card>

                {/* Rules Section */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-primary italic font-black">
                       <Lock className="w-5 h-5" /> REGLER & BEGRÄNSNINGAR
                    </CardTitle>
                    <CardDescription className="text-primary/70">Dessa regler gäller för alla användare på plattformen för att säkerställa en trygg miljö.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                       {rules.map((rule, i) => (
                         <div key={i} className="flex items-start gap-2 text-[11px] font-bold text-primary/80">
                            <div className="mt-1 w-1 h-1 rounded-full bg-primary shrink-0" />
                            {rule}
                         </div>
                       ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                 <Card className="border-border/40 bg-card/30 backdrop-blur-sm">
                   <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-wider">Plan & Status</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                         <div className="flex items-center gap-2">
                            <Sparkles className={cn("w-4 h-4", isPremium ? "text-yellow-500" : "text-muted-foreground")} />
                            <span className="text-sm font-bold">Medlemskap</span>
                         </div>
                         <Badge variant={isPremium ? "default" : "secondary"} className={cn(isPremium && "bg-yellow-500 text-black")}>
                           {isPremium ? "PREMIUM" : "GRATIS"}
                         </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 text-sm font-bold">
                         <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" />
                            <span>Månatliga Krediter</span>
                         </div>
                         <span>{creditBalance} kr</span>
                      </div>

                      <div className="pt-2">
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-purple-600 font-black tracking-wide"
                          onClick={() => router.push("/premium")}
                        >
                          {isPremium ? "HANTERA PRENUMERATION" : "UPPGRADERA NU"}
                        </Button>
                      </div>
                   </CardContent>
                 </Card>

                 <Card className="border-border/40 bg-card/30 backdrop-blur-sm">
                   <CardHeader>
                     <CardTitle className="text-sm font-bold uppercase tracking-wider">Statistik Överblick</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                           <span>Generationer</span>
                           <span>Prosent av limit</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-primary w-[30%]" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        Du har använt ca 30% av dina inkluderade gratisförsök denna månad.
                      </p>
                   </CardContent>
                 </Card>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <Card className="border-border/40 bg-card/30 backdrop-blur-sm">
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-500" /> Transaktionshistorik
                   </CardTitle>
                   <CardDescription>Dina senaste köp och token-användning.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <TokenTransactionHistory userId={user.id} />
                 </CardContent>
               </Card>
               
               <div className="space-y-8">
                  <TokenUsageStats userId={user.id} initialData={null} />
               </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-red-500 flex items-center gap-2 italic font-black uppercase tracking-wider">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </CardTitle>
                <CardDescription className="text-red-500/70">
                  Åtgärder här kan inte ångras. Var försiktig när du hanterar radering av data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-red-500/20">
                  <div>
                    <p className="text-sm font-black uppercase">Radera konto permanent</p>
                    <p className="text-xs text-muted-foreground max-w-sm">Detta kommer att ta bort alla dina karaktärer, meddelanden, tokens och personuppgifter.</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="font-black"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> RADERA KONTO
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Account Sidebar Footer */}
      <div className="container max-w-6xl mx-auto mt-12 px-4 flex justify-center">
         <Button 
           variant="ghost" 
           className="text-muted-foreground hover:text-red-500 font-bold flex items-center gap-2"
           onClick={logout}
         >
           <LogOut className="w-4 h-4" /> Logga ut från alla enheter
         </Button>
      </div>

      {/* Modals */}
      <DeleteFeedbackModal
        open={showDeleteModal && !showDeleteConfirm}
        onClose={() => setShowDeleteModal(false)}
        lang={profileData.language as any}
        onNext={(reason, description) => { 
          setDeleteFeedback({ reason, description }); 
          setShowDeleteConfirm(true); 
        }}
      />
      <DeleteConfirmationModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        lang={profileData.language as any}
        onDelete={handleDeleteAccount}
      />
    </div>
  )
}
