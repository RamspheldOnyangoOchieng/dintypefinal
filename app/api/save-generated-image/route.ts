import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { createClient } from "@/lib/supabase/client"
import { getAnonymousUserId } from "@/lib/anonymous-user"
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload"

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageUrl, modelUsed = "novita" } = await request.json()

    if (!prompt || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields: prompt and imageUrl" }, { status: 400 })
    }

    console.log("📥 Saving generated image to collection...");
    console.log("   Novita URL:", imageUrl);

    // Get user ID (authenticated or anonymous)
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    let userId: string

    if (session?.user?.id) {
      console.log("✅ User is authenticated:", session.user.id.substring(0, 8))
      userId = session.user.id
    } else {
      userId = getAnonymousUserId()
      console.log("👤 Using anonymous ID:", userId.substring(0, 8))
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = await createAdminClient()

    // Check if this permanent URL already exists for this user
    // We check against Cloudinary URLs, not Novita URLs (Novita URLs are temporary)
    let permanentImageUrl = imageUrl;
    
    // Only upload to Cloudinary if it's a Novita URL (temporary)
    if (imageUrl.includes('novita.ai') || imageUrl.includes('task-result')) {
      console.log("🔄 Downloading image from Novita...");
      
      try {
        // Upload to Cloudinary for permanent storage
        permanentImageUrl = await uploadImageToCloudinary(imageUrl, 'generated-images');
        console.log("✅ Uploaded to Cloudinary:", permanentImageUrl);
      } catch (uploadError) {
        console.error("❌ Failed to upload to Cloudinary:", uploadError);
        return NextResponse.json(
          { 
            error: "Failed to upload image to permanent storage",
            details: uploadError instanceof Error ? uploadError.message : "Unknown error"
          },
          { status: 500 }
        );
      }
    } else {
      console.log("ℹ️  URL already appears to be permanent (not Novita)");
    }

    // Check if this permanent image URL already exists for this user
    const { data: existingImages } = await supabaseAdmin
      .from("generated_images")
      .select("id")
      .eq("user_id", userId)
      .eq("image_url", permanentImageUrl)
      .limit(1)

    if (existingImages && existingImages.length > 0) {
      console.log("ℹ️  Image already exists in collection:", existingImages[0].id)
      return NextResponse.json({ message: "Image already saved", imageId: existingImages[0].id }, { status: 200 })
    }

    // Insert the new image with permanent Cloudinary URL
    console.log("💾 Saving to database...");
    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .insert({
        user_id: userId,
        prompt,
        image_url: permanentImageUrl, // Permanent Cloudinary URL
        model_used: modelUsed,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("✅ Image saved to collection successfully!");
    console.log("   Image ID:", data.id);
    console.log("   Permanent URL:", permanentImageUrl);

    return NextResponse.json({ 
      success: true, 
      image: data,
      permanentUrl: permanentImageUrl
    })
  } catch (error) {
    console.error("❌ Unexpected error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
