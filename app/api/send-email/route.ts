import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/service"
import { EmailTemplate } from "@/lib/email/templates"

export async function POST(request: NextRequest) {
  try {
    const { to, template, data } = await request.json()

    if (!to || !template) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const success = await sendEmail({
      to,
      template: template as EmailTemplate,
      data: data || {},
    })

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Email API error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
