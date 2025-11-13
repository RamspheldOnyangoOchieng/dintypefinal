import { renderTemplate, EmailTemplate, EmailData } from "./templates"
import { getEmailConfig } from "@/lib/integration-config"
import { createAdminClient } from "@/lib/supabase-admin"

// This is a basic email service implementation
// You can swap this with SendGrid, Mailgun, AWS SES, etc.

export interface EmailOptions {
  to: string
  template: EmailTemplate
  data: EmailData
}

// Fetch template from database (admin-editable)
async function getEmailTemplate(templateKey: string) {
  try {
    const supabase = await createAdminClient()
    if (!supabase) {
      console.warn("Database not available, using hardcoded templates")
      return null
    }

    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", templateKey)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      console.warn(`Template ${templateKey} not found in database, using fallback`)
      return null
    }

    return {
      subject: data.subject,
      html: data.html_content,
      text: data.text_content,
    }
  } catch (error) {
    console.error("Error fetching email template:", error)
    return null
  }
}

export async function sendEmail({ to, template, data }: EmailOptions): Promise<boolean> {
  try {
    const emailConfig = await getEmailConfig()
    
    // Try to get template from database first, fallback to hardcoded
    const dbTemplate = await getEmailTemplate(template)
    const templateToUse = dbTemplate || renderTemplate(template, {
      ...data,
      year: new Date().getFullYear().toString(),
      siteName: data.siteName || emailConfig.fromName || process.env.NEXT_PUBLIC_SITE_NAME || "Dintyp",
    })

    // Replace variables in the template
    const replaceVars = (text: string): string => {
      const allData = {
        ...data,
        year: new Date().getFullYear().toString(),
        siteName: data.siteName || emailConfig.fromName || process.env.NEXT_PUBLIC_SITE_NAME || "Dintyp",
      }
      
      return text.replace(/{{(\w+)}}/g, (match, key) => {
        return allData[key]?.toString() || match
      })
    }

    const subject = replaceVars(templateToUse.subject)
    const html = replaceVars(templateToUse.html)
    const text = replaceVars(templateToUse.text)

    // If no email configuration, just log
    if (!emailConfig.apiKey || !emailConfig.fromAddress) {
      console.log("📧 Email service not configured - would send:")
      console.log("To:", to)
      console.log("Subject:", subject)
      console.log("Template:", template)
      console.log("---")
      return true
    }

    // Send with configured provider
    if (emailConfig.provider === "resend") {
      const { Resend } = await import("resend")
      const resend = new Resend(emailConfig.apiKey)
      
      await resend.emails.send({
        from: `${emailConfig.fromName} <${emailConfig.fromAddress}>`,
        to,
        subject,
        html,
      })
      
      console.log(`✅ Email sent via Resend to ${to}`)
    } else if (emailConfig.provider === "sendgrid") {
      const sgMail = await import("@sendgrid/mail")
      sgMail.default.setApiKey(emailConfig.apiKey)
      
      await sgMail.default.send({
        to,
        from: {
          email: emailConfig.fromAddress,
          name: emailConfig.fromName,
        },
        subject,
        text,
        html,
      })
      
      console.log(`✅ Email sent via SendGrid to ${to}`)
    }

    return true
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

// Helper functions for specific email types
export async function sendWelcomeEmail(to: string, username: string) {
  return sendEmail({
    to,
    template: "welcome",
    data: {
      username,
      dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    },
  })
}

export async function sendPaymentConfirmation(
  to: string,
  username: string,
  orderDetails: {
    orderId: string
    orderDate: string
    itemName: string
    amount: string
    purchaseDetails: string
  }
) {
  return sendEmail({
    to,
    template: "paymentConfirmation",
    data: {
      username,
      ...orderDetails,
      invoiceUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/invoices/${orderDetails.orderId}`,
    },
  })
}

export async function sendPasswordReset(to: string, username: string, resetToken: string) {
  return sendEmail({
    to,
    template: "passwordReset",
    data: {
      username,
      resetLink: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`,
    },
  })
}

export async function sendSubscriptionRenewalReminder(
  to: string,
  username: string,
  subscriptionDetails: {
    planName: string
    expiryDate: string
    daysRemaining: number
  }
) {
  return sendEmail({
    to,
    template: "subscriptionRenewal",
    data: {
      username,
      ...subscriptionDetails,
      renewalUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/premium`,
    },
  })
}
