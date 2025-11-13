import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

// GET - Fetch all email templates
export async function GET() {
  try {
    const supabase = await createAdminClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const { data: templates, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching email templates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(templates || [])
  } catch (error) {
    console.error("Error in GET /api/admin/email-templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    )
  }
}

// POST - Create or update email template
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, template_key, name, description, subject, html_content, text_content, available_variables, is_active } = body

    // Validation
    if (!template_key || !name || !subject || !html_content || !text_content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    if (id) {
      // Update existing template
      const { data, error } = await supabase
        .from("email_templates")
        .update({
          name,
          description,
          subject,
          html_content,
          text_content,
          available_variables,
          is_active: is_active ?? true,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating email template:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, template: data })
    } else {
      // Create new template
      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          template_key,
          name,
          description,
          subject,
          html_content,
          text_content,
          available_variables,
          is_active: is_active ?? true,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating email template:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, template: data })
    }
  } catch (error) {
    console.error("Error in POST /api/admin/email-templates:", error)
    return NextResponse.json(
      { error: "Failed to save email template" },
      { status: 500 }
    )
  }
}

// DELETE - Delete email template
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 })
    }

    const supabase = await createAdminClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting email template:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/email-templates:", error)
    return NextResponse.json(
      { error: "Failed to delete email template" },
      { status: 500 }
    )
  }
}
