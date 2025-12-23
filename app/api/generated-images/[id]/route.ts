import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await cookies()
  
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { id } = params
    
    // Fetch specific image
    const { data: image, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      console.error('Error fetching image:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    return NextResponse.json({ image })
  } catch (error) {
    console.error('Error in generated-images/[id] route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
