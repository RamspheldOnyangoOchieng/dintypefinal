import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { free, premium } = body

    if (!free || !premium) {
      return NextResponse.json({
        success: false,
        error: 'Missing free or premium restrictions'
      }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Update all restrictions
    const allRestrictions = [...free, ...premium]
    const updates = []

    for (const restriction of allRestrictions) {
      const { data, error } = await supabase
        .from('plan_restrictions')
        .upsert({
          plan_type: restriction.plan_type,
          restriction_key: restriction.restriction_key,
          restriction_value: restriction.restriction_value,
          description: restriction.description || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'plan_type,restriction_key' })

      if (error) {
        console.error(`Error upserting ${restriction.plan_type}.${restriction.restriction_key}:`, error)
        return NextResponse.json({
          success: false,
          error: `Failed to update ${restriction.restriction_key}`
        }, { status: 500 })
      }

      updates.push({
        plan_type: restriction.plan_type,
        restriction_key: restriction.restriction_key,
        new_value: restriction.restriction_value
      })
    }

    console.log(`✅ Updated ${updates.length} restrictions`)

    return NextResponse.json({
      success: true,
      updated: updates.length,
      changes: updates
    })

  } catch (error) {
    console.error('Error in update-restrictions:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
