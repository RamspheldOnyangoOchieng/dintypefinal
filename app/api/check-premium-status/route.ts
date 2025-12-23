import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

// Simple in-memory cache with expiration
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute cache

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated using getUser() (more secure)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ authenticated: false, isPremium: false }, { status: 200 })
    }

    const userId = user.id

    // Direct query to profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("user_id", userId)
      .maybeSingle()

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json(
        {
          authenticated: true,
          isPremium: false,
          error: "profile_fetch_failed",
        },
        { status: 200 },
      )
    }

    // If profile not found, try to create one
    if (!profile) {
      try {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert([{ user_id: userId, is_premium: false }])
          .select()

        if (insertError) {
          console.error("Error creating profile:", insertError)
          return NextResponse.json(
            {
              authenticated: true,
              isPremium: false,
              error: "profile_creation_failed",
            },
            { status: 200 },
          )
        }

        return NextResponse.json({
          authenticated: true,
          isPremium: false,
          profileStatus: "created",
        })
      } catch (err) {
        console.error("Exception creating profile:", err)
        return NextResponse.json(
          {
            authenticated: true,
            isPremium: false,
            error: "profile_creation_exception",
          },
          { status: 200 },
        )
      }
    }

    return NextResponse.json({
      authenticated: true,
      isPremium: !!profile?.is_premium,
    })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json(
      {
        authenticated: false,
        error: "server_error",
        message: error instanceof Error ? error.message : "Unknown error",
        isPremium: false,
      },
      { status: 200 },
    )
  }
}
