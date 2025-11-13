"use client"

import { AdminOnlyPage } from "@/components/admin-only-page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Mail, Save, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase-browser"
import { formatSEK } from "@/lib/currency"

interface EmailTemplate {
  id?: string
  template_key: string
  subject: string
  html_body: string
  text_body: string
  variables?: string[]
  description?: string
  updated_at?: string
}

export default function EmailTemplatesPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({
    account_welcome: {
      template_key: "account_welcome",
      subject: "Välkommen till {{app_name}}! Ditt konto är skapat",
      html_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Välkommen {{username}}!</h1>
          <p>Tack för att du skapade ett konto hos oss. Vi är glada att ha dig här!</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Kom igång direkt</h2>
            <ul style="line-height: 1.8;">
              <li>Utforska våra AI-karaktärer</li>
              <li>Starta din första konversation</li>
              <li>Anpassa din profil</li>
              <li>Upptäck nya funktioner</li>
            </ul>
          </div>

          <p style="margin-top: 30px;">
            <a href="{{app_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Utforska Nu
            </a>
          </p>

          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 30px;">
            <p style="margin: 0; font-size: 14px;">
              <strong>Tips:</strong> Uppgradera till Premium för obegränsade konversationer, 
              3 aktiva karaktärer och månatliga token-krediter för bara 119 kr/månad!
            </p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Om du har några frågor, kontakta oss på support@example.com
          </p>
        </div>
      `,
      text_body: `Välkommen {{username}}!\n\nTack för att du skapade ett konto hos oss. Vi är glada att ha dig här!\n\nKom igång direkt:\n- Utforska våra AI-karaktärer\n- Starta din första konversation\n- Anpassa din profil\n- Upptäck nya funktioner\n\nUtforska nu: {{app_url}}\n\nTips: Uppgradera till Premium för 119 kr/månad!`,
      description: "Skickas när en ny användare skapar ett konto",
      variables: ["username", "app_url", "app_name"]
    },
    premium_welcome: {
      template_key: "premium_welcome",
      subject: "Välkommen till Premium! Dina fördelar aktiverade",
      html_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Välkommen till Premium, {{username}}! 🎉</h1>
          <p>Tack för att du blev Premium-medlem. Vi är glada att ha dig här!</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h2 style="margin-top: 0; color: #10b981;">Dina Premium-fördelar</h2>
            <ul style="line-height: 2;">
              <li>✅ <strong>Obegränsade meddelanden</strong> med alla AI-karaktärer</li>
              <li>✅ <strong>3 aktiva karaktärer</strong> samtidigt</li>
              <li>✅ <strong>50 arkiverade karaktärer</strong></li>
              <li>✅ <strong>Månatliga token-krediter</strong> för bildgenerering</li>
              <li>✅ <strong>Prioriterad support</strong></li>
              <li>✅ <strong>Tidiga tillgång</strong> till nya funktioner</li>
            </ul>
          </div>

          <p style="margin-top: 30px;">
            <a href="{{app_url}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Kom igång nu
            </a>
          </p>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 30px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Prenumerationsdetaljer:</strong><br>
              Plan: Premium Månadsprenumeration<br>
              Pris: 119 kr/månad<br>
              Nästa förnyelse: {{renewal_date}}
            </p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Om du har några frågor om ditt Premium-konto, kontakta oss på support@example.com
          </p>
        </div>
      `,
      text_body: `Välkommen till Premium, {{username}}!\n\nTack för att du blev Premium-medlem!\n\nDina Premium-fördelar:\n✅ Obegränsade meddelanden\n✅ 3 aktiva karaktärer\n✅ 50 arkiverade karaktärer\n✅ Månatliga token-krediter\n✅ Prioriterad support\n✅ Tidig tillgång till nya funktioner\n\nKom igång: {{app_url}}\n\nPrenumeration: 119 kr/månad\nNästa förnyelse: {{renewal_date}}`,
      description: "Skickas när en användare blir Premium-medlem",
      variables: ["username", "app_url", "renewal_date"]
    },
    payment_confirmation: {
      template_key: "payment_confirmation",
      subject: "Betalningsbekräftelse - Order {{order_id}}",
      html_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Betalning mottagen! ✅</h1>
          <p>Hej {{username}},</p>
          <p>Tack för ditt köp! Vi har mottagit din betalning.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Orderdetaljer</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0;"><strong>Order-ID:</strong></td>
                <td style="text-align: right; padding: 12px 0;">{{order_id}}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0;"><strong>Datum:</strong></td>
                <td style="text-align: right; padding: 12px 0;">{{order_date}}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0;"><strong>Artikel:</strong></td>
                <td style="text-align: right; padding: 12px 0;">{{item_name}}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0;"><strong>Belopp:</strong></td>
                <td style="text-align: right; padding: 12px 0; font-size: 20px; color: #10b981; font-weight: bold;">{{amount}}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0;">{{purchase_details}}</p>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <a href="{{app_url}}/invoices" style="color: #4F46E5; text-decoration: none; font-size: 14px;">
              Se alla dina fakturor →
            </a>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Vid frågor om din order, kontakta support@example.com med ditt order-ID.
          </p>
        </div>
      `,
      text_body: `Betalning mottagen!\n\nHej {{username}},\n\nTack för ditt köp!\n\nOrderdetaljer:\n━━━━━━━━━━━━━━━━\nOrder-ID: {{order_id}}\nDatum: {{order_date}}\nArtikel: {{item_name}}\nBelopp: {{amount}}\n━━━━━━━━━━━━━━━━\n\n{{purchase_details}}\n\nSe dina fakturor: {{app_url}}/invoices\n\nVid frågor, kontakta support@example.com`,
      description: "Skickas efter lyckad betalning",
      variables: ["username", "order_id", "order_date", "item_name", "amount", "purchase_details", "app_url"]
    },
    subscription_renewal_success: {
      template_key: "subscription_renewal_success",
      subject: "Din Premium-prenumeration har förnyats",
      html_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Prenumeration förnyad! ✅</h1>
          <p>Hej {{username}},</p>
          <p>Din Premium-prenumeration har förnyats framgångsrikt.</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h2 style="margin-top: 0; color: #10b981;">Förnyelseinformation</h2>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0;"><strong>Plan:</strong></td>
                <td style="text-align: right;">Premium Månadsprenumeration</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Belopp:</strong></td>
                <td style="text-align: right; font-size: 18px; color: #10b981;">{{amount}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Förnyad den:</strong></td>
                <td style="text-align: right;">{{renewal_date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Nästa förnyelse:</strong></td>
                <td style="text-align: right;">{{next_renewal_date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Betalningsmetod:</strong></td>
                <td style="text-align: right;">{{payment_method}}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px;">
              <strong>Du har fortfarande tillgång till:</strong><br>
              • Obegränsade meddelanden<br>
              • 3 aktiva karaktärer<br>
              • Månatliga token-krediter<br>
              • Prioriterad support
            </p>
          </div>

          <p style="margin-top: 30px;">
            <a href="{{app_url}}/settings" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Hantera Prenumeration
            </a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            För att avsluta din prenumeration, besök inställningssidan eller kontakta support@example.com
          </p>
        </div>
      `,
      text_body: `Prenumeration förnyad!\n\nHej {{username}},\n\nDin Premium-prenumeration har förnyats framgångsrikt.\n\nFörnyelseinformation:\n━━━━━━━━━━━━━━━━\nPlan: Premium Månadsprenumeration\nBelopp: {{amount}}\nFörnyad den: {{renewal_date}}\nNästa förnyelse: {{next_renewal_date}}\nBetalningsmetod: {{payment_method}}\n━━━━━━━━━━━━━━━━\n\nDu har fortfarande tillgång till alla Premium-fördelar!\n\nHantera prenumeration: {{app_url}}/settings`,
      description: "Skickas när prenumeration förnyas framgångsrikt",
      variables: ["username", "amount", "renewal_date", "next_renewal_date", "payment_method", "app_url"]
    },
    subscription_payment_failed: {
      template_key: "subscription_payment_failed",
      subject: "⚠️ Problem med din Premium-betalning",
      html_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Betalning misslyckades</h1>
          <p>Hej {{username}},</p>
          <p>Vi kunde tyvärr inte behandla din Premium-prenumerationsbetalning.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h2 style="margin-top: 0; color: #dc2626;">Betalningsdetaljer</h2>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0;"><strong>Plan:</strong></td>
                <td style="text-align: right;">Premium Månadsprenumeration</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Belopp:</strong></td>
                <td style="text-align: right;">{{amount}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Försöksdatum:</strong></td>
                <td style="text-align: right;">{{attempt_date}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Betalningsmetod:</strong></td>
                <td style="text-align: right;">{{payment_method}}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;" colspan="2">
                  <div style="background-color: #fee; padding: 10px; border-radius: 4px; margin-top: 10px;">
                    <strong style="color: #dc2626;">Anledning:</strong> {{failure_reason}}
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Vad händer nu?</strong><br>
              • Vi försöker igen om {{retry_days}} dagar<br>
              • Din Premium-tillgång fortsätter tills {{grace_period_end}}<br>
              • Efter det pausas din Premium-prenumeration
            </p>
          </div>

          <h3 style="margin-top: 30px;">Åtgärda problemet</h3>
          <p style="color: #666;">För att undvika avbrott i din Premium-tjänst, vänligen:</p>
          <ul style="color: #666; line-height: 1.8;">
            <li>Kontrollera att ditt kort har tillräckligt med medel</li>
            <li>Bekräfta att kortet inte har gått ut</li>
            <li>Uppdatera din betalningsmetod om nödvändigt</li>
          </ul>

          <p style="margin-top: 30px; text-align: center;">
            <a href="{{app_url}}/settings/billing" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Uppdatera Betalningsmetod
            </a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Behöver du hjälp? Kontakta oss på support@example.com så hjälper vi dig!
          </p>
        </div>
      `,
      text_body: `⚠️ Betalning misslyckades\n\nHej {{username}},\n\nVi kunde tyvärr inte behandla din Premium-prenumerationsbetalning.\n\nBetalningsdetaljer:\n━━━━━━━━━━━━━━━━\nPlan: Premium Månadsprenumeration\nBelopp: {{amount}}\nFörsöksdatum: {{attempt_date}}\nBetalningsmetod: {{payment_method}}\nAnledning: {{failure_reason}}\n━━━━━━━━━━━━━━━━\n\nVad händer nu?\n• Vi försöker igen om {{retry_days}} dagar\n• Din Premium-tillgång fortsätter tills {{grace_period_end}}\n• Efter det pausas din prenumeration\n\nÅtgärda problemet:\n- Kontrollera att ditt kort har medel\n- Bekräfta att kortet inte har gått ut\n- Uppdatera din betalningsmetod\n\nUppdatera betalning: {{app_url}}/settings/billing\n\nBehöver hjälp? Kontakta support@example.com`,
      description: "Skickas när prenumerationsbetalning misslyckas",
      variables: ["username", "amount", "attempt_date", "payment_method", "failure_reason", "retry_days", "grace_period_end", "app_url"]
    },
    password_reset: {
      template_key: "password_reset",
      subject: "Återställ ditt lösenord",
      html_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Återställ ditt lösenord</h1>
          <p>Hej {{username}},</p>
          <p>Vi har mottagit en begäran om att återställa lösenordet för ditt konto.</p>
          
          <p style="margin: 30px 0;">
            <a href="{{reset_link}}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Återställ lösenord
            </a>
          </p>

          <p style="color: #666; font-size: 14px;">
            Om du inte begärde denna återställning kan du ignorera detta e-postmeddelande.
            Länken är giltig i 24 timmar.
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:<br>
            {{reset_link}}
          </p>
        </div>
      `,
      text_body: `Återställ ditt lösenord\n\nHej {{username}},\n\nVi har mottagit en begäran om att återställa lösenordet för ditt konto.\n\nKlicka på länken för att återställa: {{reset_link}}\n\nOm du inte begärde denna återställning kan du ignorera detta e-postmeddelande.\nLänken är giltig i 24 timmar.`,
      description: "Skickas när användare begär lösenordsåterställning",
      variables: ["username", "reset_link"]
    }
  })

  const [activeTab, setActiveTab] = useState("account_welcome")

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")

      if (error) {
        console.error("Error fetching templates:", error)
        // Use default templates if table doesn't exist
        return
      }

      if (data && data.length > 0) {
        const templatesMap: Record<string, EmailTemplate> = {}
        data.forEach((template: any) => {
          templatesMap[template.template_key] = template
        })
        setTemplates(prev => ({ ...prev, ...templatesMap }))
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveTemplate = async (templateKey: string) => {
    try {
      setIsSaving(true)
      const supabase = createClient()
      const template = templates[templateKey]

      const { error } = await supabase
        .from("email_templates")
        .upsert({
          template_key: templateKey,
          subject: template.subject,
          html_body: template.html_body,
          text_body: template.text_body,
          description: template.description,
          variables: template.variables,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'template_key'
        })

      if (error) {
        throw error
      }

      toast({
        title: "Sparat!",
        description: "E-postmallen har uppdaterats.",
      })

      await fetchTemplates()
    } catch (error: any) {
      console.error("Error saving template:", error)
      toast({
        title: "Fel",
        description: error.message || "Kunde inte spara mallen. Försök igen.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateTemplate = (key: string, field: keyof EmailTemplate, value: string) => {
    setTemplates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }

  const previewTemplate = (key: string) => {
    const template = templates[key]
    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      previewWindow.document.write(template.html_body)
      previewWindow.document.close()
    }
  }

  if (isLoading) {
    return (
      <AdminOnlyPage>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminOnlyPage>
    )
  }

  return (
    <AdminOnlyPage>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">E-postmallar</h1>
          <p className="text-muted-foreground">
            Hantera e-postmallar som skickas till användare. Använd variabler som {`{{username}}`} för dynamiskt innehåll.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="account_welcome">
              <Mail className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Konto Välkommen</span>
              <span className="sm:hidden">Konto</span>
            </TabsTrigger>
            <TabsTrigger value="premium_welcome">
              <Mail className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Premium Välkommen</span>
              <span className="sm:hidden">Premium</span>
            </TabsTrigger>
            <TabsTrigger value="payment_confirmation">
              <Mail className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Betalning</span>
              <span className="sm:hidden">Betalt</span>
            </TabsTrigger>
            <TabsTrigger value="subscription_renewal_success">
              <Mail className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Förnyelse</span>
              <span className="sm:hidden">Förnya</span>
            </TabsTrigger>
            <TabsTrigger value="subscription_payment_failed">
              <Mail className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Betalning Misslyckad</span>
              <span className="sm:hidden">Fel</span>
            </TabsTrigger>
            <TabsTrigger value="password_reset">
              <Mail className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Lösenord</span>
              <span className="sm:hidden">Lösen</span>
            </TabsTrigger>
          </TabsList>

          {Object.entries(templates).map(([key, template]) => (
            <TabsContent key={key} value={key}>
              <Card>
                <CardHeader>
                  <CardTitle>{template.description}</CardTitle>
                  <CardDescription>
                    Tillgängliga variabler: {template.variables?.map(v => `{{${v}}}`).join(", ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor={`${key}-subject`}>Ämnesrad</Label>
                    <Input
                      id={`${key}-subject`}
                      value={template.subject}
                      onChange={(e) => updateTemplate(key, "subject", e.target.value)}
                      placeholder="E-postämne..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${key}-html`}>HTML-innehåll</Label>
                    <Textarea
                      id={`${key}-html`}
                      value={template.html_body}
                      onChange={(e) => updateTemplate(key, "html_body", e.target.value)}
                      placeholder="HTML-mall..."
                      className="font-mono text-sm min-h-[400px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${key}-text`}>Textversion (fallback)</Label>
                    <Textarea
                      id={`${key}-text`}
                      value={template.text_body}
                      onChange={(e) => updateTemplate(key, "text_body", e.target.value)}
                      placeholder="Textversion..."
                      className="font-mono text-sm min-h-[150px]"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => saveTemplate(key)} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sparar...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Spara mall
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => previewTemplate(key)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Förhandsgranska
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Prissättning i e-postmallar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              All prissättning visas automatiskt i <strong>Svenska kronor (SEK)</strong>.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Exempel på prisformatering:</h4>
              <ul className="space-y-1 text-sm">
                <li>• 99 kr → {formatSEK(99)}</li>
                <li>• 249 kr → {formatSEK(249)}</li>
                <li>• 1,499 kr → {formatSEK(1499)}</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Variabeln {`{{amount}}`} formateras automatiskt med svensk valuta i webhooks.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminOnlyPage>
  )
}
