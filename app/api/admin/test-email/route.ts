import { NextResponse } from "next/server"
import { getEmailConfig } from "@/lib/integration-config"
import { sendEmail } from "@/lib/email/service"

/**
 * Test email configuration
 */
export async function POST(request: Request) {
  try {
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json(
        { error: "Test email address required" },
        { status: 400 }
      )
    }

    // Get email configuration
    const emailConfig = await getEmailConfig()

    if (!emailConfig.apiKey || !emailConfig.fromAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured. Please add API key and from address.",
          config: {
            provider: emailConfig.provider,
            hasApiKey: !!emailConfig.apiKey,
            hasFromAddress: !!emailConfig.fromAddress,
          },
        },
        { status: 400 }
      )
    }

    // Send test email
    const success = await sendEmail({
      to: testEmail,
      template: "welcome",
      data: {
        username: "Test User",
        dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      },
    })

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        config: {
          provider: emailConfig.provider,
          fromAddress: emailConfig.fromAddress,
          fromName: emailConfig.fromName,
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send test email. Check API key and configuration.",
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error testing email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send test email",
      },
      { status: 500 }
    )
  }
}

// GET - Check email configuration status
export async function GET() {
  try {
    const emailConfig = await getEmailConfig()

    return NextResponse.json({
      configured: !!(emailConfig.apiKey && emailConfig.fromAddress),
      provider: emailConfig.provider,
      hasApiKey: !!emailConfig.apiKey,
      hasFromAddress: !!emailConfig.fromAddress,
      fromAddress: emailConfig.fromAddress || "",
      fromName: emailConfig.fromName || "",
    })
  } catch (error) {
    console.error("Error checking email config:", error)
    return NextResponse.json(
      { error: "Failed to check email configuration" },
      { status: 500 }
    )
  }
}
