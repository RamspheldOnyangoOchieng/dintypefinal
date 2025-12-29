import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { createClient } from "@/utils/supabase/server"
import { getAnonymousUserId } from "@/lib/anonymous-user"
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, imageUrl, modelUsed = "novita", characterId, userId: passedUserId } = body

    if (!prompt || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields: prompt and imageUrl" }, { status: 400 })
    }

    console.log("📥 Saving generated image to collection...");
    if (characterId) console.log("   Associating with character:", characterId);
    console.log("   Novita URL:", imageUrl);

    // Get user ID (authenticated or anonymous)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userId: string

    if (user?.id) {
      console.log("✅ User is authenticated:", user.id.substring(0, 8))
      userId = user.id
    } else if (passedUserId) {
      // Use the ID passed from the client (useful for anonymous localStorage based sessions)
      console.log("👤 Using userId passed from client:", passedUserId.substring(0, 8))
      userId = passedUserId
    } else {
      userId = getAnonymousUserId()
      console.log("👤 Falling back to server-side anonymous ID:", userId.substring(0, 8))
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = await createAdminClient()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Failed to initialize database client" }, { status: 500 })
    }

    // Check if this permanent URL already exists for this user
    // We check against permanent URLs (Cloudinary), not temporary ones (Novita)
    let permanentImageUrl = imageUrl;

    const isNovita = imageUrl.includes('novita.ai') || imageUrl.includes('task-result');
    const isCloudinary = imageUrl.includes('cloudinary.com');

    // Only upload if it's NOT already on our permanent storage
    if (isNovita || !isCloudinary) {
      console.log("🔄 Downloading image for permanent storage in Cloudinary...");

      try {
        const { uploadImageToCloudinary } = await import("@/lib/cloudinary-upload");
        permanentImageUrl = await uploadImageToCloudinary(imageUrl, 'generated-images');
        console.log("✅ Uploaded to Cloudinary:", permanentImageUrl);
      } catch (uploadError) {
        console.error("❌ Failed to upload to Cloudinary:", uploadError);
        return NextResponse.json(
          {
            error: "Failed to upload image to permanent storage",
            details: "Cloudinary upload failed"
          },
          { status: 500 }
        );
      }
    } else {
      console.log("ℹ️  URL already appears to be permanent");
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

    // Check premium status
    const { getUserPlanInfo } = await import("@/lib/subscription-limits");
    const planInfo = await getUserPlanInfo(userId);
    const { data: adminUser } = await supabaseAdmin.from('admin_users').select('id').eq('user_id', userId).maybeSingle();
    const isAdmin = !!adminUser;
    const isPremium = planInfo.planType === 'premium';

    const { data, error } = await supabaseAdmin
      .from("generated_images")
      .insert({
        user_id: userId,
        prompt,
        image_url: permanentImageUrl, // Permanent Cloudinary URL
        model_used: modelUsed,
        character_id: characterId && !characterId.startsWith("custom-") ? characterId : null,
        created_at: new Date().toISOString(),
        metadata: {
          created_during_subscription: isPremium || isAdmin,
          plan_type: planInfo.planType,
        },
      } as any)
      .select()
      .single()

    if (error) {
      console.error("❌ Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (data && characterId) {
      try {
        console.log("👤 Updating character profile images...");
        // Get existing images
        const { data: characterData, error: fetchError } = await supabaseAdmin
          .from("characters")
          .select("images")
          .eq("id", characterId)
          .single();

        if (fetchError) {
          console.error("❌ Failed to fetch character:", fetchError);
        } else {
          const currentImages = characterData.images || [];
          // Avoid duplicates
          if (!currentImages.includes(permanentImageUrl)) {
            const updatedImages = [...currentImages, permanentImageUrl];
            const { error: updateError } = await supabaseAdmin
              .from("characters")
              .update({ images: updatedImages } as any)
              .eq("id", characterId);

            if (updateError) {
              console.error("❌ Failed to update character images:", updateError);
            } else {
              console.log("✅ Character profile images updated!");
            }
          } else {
            console.log("ℹ️  Image already in character profile");
          }
        }
      } catch (charError) {
        console.error("❌ Error in character update logic:", charError);
      }
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
