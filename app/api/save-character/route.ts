import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadImageToSupabase } from '@/lib/storage-utils';
import { deductTokens, refundTokens, getUserTokenBalance } from '@/lib/token-utils';
import { checkActiveGirlfriendsLimit } from '@/lib/subscription-limits';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const groqApiKey = process.env.GROQ_API_KEY!;

// Token cost for creating a character (includes AI description generation)
const CHARACTER_CREATION_TOKEN_COST = 2;

export async function POST(request: NextRequest) {
    let tokensDeducted = false;
    let userId: string | undefined;

    try {
        const body = await request.json();
        const bodyData = body;
        userId = bodyData.userId;
        const { characterName, imageUrl, characterDetails } = bodyData;

        if (!userId || !characterName || !imageUrl) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log('🎨 Creating character:', characterName, 'for user:', userId);

        // Check active girlfriends limit before proceeding
        console.log(`👥 Checking active girlfriends limit for user ${userId.substring(0, 8)}...`);
        const activeCheck = await checkActiveGirlfriendsLimit(userId);
        
        if (!activeCheck.allowed) {
            console.log(`❌ Active girlfriend limit reached: ${activeCheck.currentUsage}/${activeCheck.limit}`);
            return NextResponse.json(
                {
                    success: false,
                    error: activeCheck.message,
                    current_active: activeCheck.currentUsage,
                    limit: activeCheck.limit,
                    upgrade_required: true
                },
                { status: 403 }
            );
        }
        
        console.log(`✅ Active girlfriend check passed: ${activeCheck.currentUsage}/${activeCheck.limit}`);

        // Check token balance before proceeding (ensure tokens exist)
        console.log(`💳 Checking token balance for user ${userId.substring(0, 8)}...`);
        
        // Ensure user has token balance record
        const { ensureUserTokens } = await import('@/lib/ensure-user-tokens');
        const balance = await ensureUserTokens(userId);
        
        console.log(`💰 Current balance: ${balance} tokens, required: ${CHARACTER_CREATION_TOKEN_COST} tokens`);

        if (balance < CHARACTER_CREATION_TOKEN_COST) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Insufficient tokens',
                    details: `Character creation requires ${CHARACTER_CREATION_TOKEN_COST} tokens. Your current balance: ${balance} tokens`,
                    required_tokens: CHARACTER_CREATION_TOKEN_COST,
                    current_balance: balance
                },
                { status: 402 }
            );
        }

        // Deduct tokens for character creation
        console.log(`💳 Deducting ${CHARACTER_CREATION_TOKEN_COST} tokens for character creation...`);
        const deductionResult = await deductTokens(
            userId,
            CHARACTER_CREATION_TOKEN_COST,
            `Character creation: ${characterName}`,
            {
                character_name: characterName,
                operation: 'create_character',
                includes: ['ai_description_generation', 'character_storage']
            }
        );

        if (!deductionResult) {
            console.error("❌ Token deduction failed");
            return NextResponse.json({
                success: false,
                error: "Failed to deduct tokens. Please try again."
            }, { status: 402 });
        }

        tokensDeducted = true;
        console.log(`✅ Successfully deducted ${CHARACTER_CREATION_TOKEN_COST} tokens`);

        // Create Supabase client with service role for server-side operations
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Download and upload image to Supabase Storage
        console.log('📥 Downloading and uploading image to Supabase Storage...');
        let permanentImageUrl = imageUrl;
        
        try {
            // Check if imageUrl is an external URL (Novita, etc.)
            if (imageUrl.includes('novita.ai') || !imageUrl.includes(supabaseUrl)) {
                permanentImageUrl = await uploadImageToSupabase(imageUrl);
                console.log('✅ Image uploaded to Supabase Storage:', permanentImageUrl);
            } else {
                console.log('✅ Image already in Supabase Storage:', permanentImageUrl);
            }
        } catch (uploadError) {
            console.error('⚠️ Failed to upload image to Supabase Storage, using original URL:', uploadError);
            // Continue with original URL if upload fails
        }

        // Extract age from characterDetails (convert "20s" to 25, "30s" to 35, etc.)
        const ageValue = extractAge(characterDetails.age);
        
        // Generate AI description
        console.log('🤖 Generating AI description...');
        const description = await generateAIDescription(characterName, characterDetails);
        console.log('✅ Description generated:', description.substring(0, 100) + '...');
        
        const systemPrompt = buildSystemPrompt(characterDetails, characterName);

        // Insert character into database with permanent image URL
        const { data, error } = await supabase
            .from('characters')
            .insert({
                user_id: userId,
                name: characterName,
                age: ageValue,
                image: permanentImageUrl,
                image_url: permanentImageUrl,
                description: description,
                system_prompt: systemPrompt,
                personality: characterDetails.personality || 'Friendly',
                voice: 'default',
                is_public: false,
                share_revenue: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                metadata: characterDetails,
                ethnicity: characterDetails.ethnicity || null,
                relationship: characterDetails.relationship || null,
                body: characterDetails.bodyType || null,
                occupation: 'Student', // Default occupation
                hobbies: 'Reading, Music', // Default hobbies
                language: 'English', // Default language
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Database error:', error);
            
            // Refund tokens since character creation failed
            if (tokensDeducted && userId) {
                console.log(`🔄 Character creation failed. Refunding ${CHARACTER_CREATION_TOKEN_COST} tokens...`);
                try {
                    await refundTokens(
                        userId,
                        CHARACTER_CREATION_TOKEN_COST,
                        `Refund for failed character creation: ${characterName}`,
                        {
                            character_name: characterName,
                            error_message: error.message,
                            refund_reason: 'Database insertion failed'
                        }
                    );
                    console.log(`✅ Successfully refunded ${CHARACTER_CREATION_TOKEN_COST} tokens`);
                } catch (refundError) {
                    console.error("❌ Error during token refund:", refundError);
                }
            }

            return NextResponse.json(
                { 
                    success: false, 
                    error: error.message,
                    refunded: tokensDeducted 
                },
                { status: 500 }
            );
        }

        console.log('✅ Character saved successfully:', data.id);

        return NextResponse.json({
            success: true,
            character: data,
            tokens_used: CHARACTER_CREATION_TOKEN_COST
        });

    } catch (error) {
        console.error('❌ Error saving character:', error);

        // Refund tokens if they were deducted and an error occurred
        if (tokensDeducted && userId) {
            console.log(`🔄 Unexpected error occurred. Refunding ${CHARACTER_CREATION_TOKEN_COST} tokens...`);
            try {
                await refundTokens(
                    userId,
                    CHARACTER_CREATION_TOKEN_COST,
                    `Refund for failed character creation due to server error`,
                    {
                        error_message: error instanceof Error ? error.message : String(error),
                        refund_reason: 'Server error during character creation'
                    }
                );
                console.log(`✅ Successfully refunded ${CHARACTER_CREATION_TOKEN_COST} tokens`);
            } catch (refundError) {
                console.error("❌ Error during emergency token refund:", refundError);
            }
        }

        return NextResponse.json(
            { 
                success: false,
                error: error instanceof Error ? error.message : 'Failed to save character',
                refunded: tokensDeducted
            },
            { status: 500 }
        );
    }
}

async function generateAIDescription(name: string, details: any): Promise<string> {
    // If no GROQ API key, fallback to basic description
    if (!groqApiKey) {
        console.warn('No GROQ API key found, using fallback description');
        return buildCharacterDescription(details);
    }

    try {
        const prompt = `Create a detailed, engaging character description for an AI companion named ${name}. Use the following attributes to craft a rich, multi-paragraph description that captures their essence, personality, and appeal:

Attributes:
- Age: ${details.age || 'young adult'}
- Style: ${details.style || 'realistic'}
- Ethnicity: ${details.ethnicity || 'diverse'}
- Eye Color: ${details.eyeColor || 'expressive'}
- Eye Shape: ${details.eyeShape || 'captivating'}
- Lip Shape: ${details.lipShape || 'alluring'}
- Hair Style: ${details.hairStyle || 'styled'}
- Hair Length: ${details.hairLength || 'medium'}
- Hair Color: ${details.hairColor || 'natural'}
- Body Type: ${details.bodyType || 'fit'}
- Personality: ${details.personality || 'friendly'}
- Relationship: ${details.relationship || 'companion'}

Write a compelling 2-3 paragraph description that:
1. Describes their physical appearance in vivid detail
2. Captures their personality and demeanor
3. Hints at their interests and what makes them special
4. Creates emotional connection and intrigue

Make it warm, inviting, and engaging. Write in third person, present tense.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a creative writer specializing in character descriptions. Write vivid, engaging, and emotionally resonant descriptions.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            console.error('GROQ API error:', await response.text());
            return buildCharacterDescription(details);
        }

        const data = await response.json();
        const generatedDescription = data.choices[0]?.message?.content?.trim();

        if (generatedDescription && generatedDescription.length > 50) {
            return generatedDescription;
        }

        // Fallback if generation failed
        return buildCharacterDescription(details);

    } catch (error) {
        console.error('Error generating AI description:', error);
        return buildCharacterDescription(details);
    }
}

function buildCharacterDescription(details: any): string {
    const parts = [];
    
    if (details.age) parts.push(`${details.age} years old`);
    if (details.ethnicity) parts.push(`${details.ethnicity} ethnicity`);
    if (details.bodyType) parts.push(`${details.bodyType} build`);
    if (details.hairColor && details.hairLength) {
        parts.push(`${details.hairColor} ${details.hairLength} hair`);
    } else if (details.hairColor) {
        parts.push(`${details.hairColor} hair`);
    }
    if (details.eyeColor) parts.push(`${details.eyeColor} eyes`);
    if (details.personality) parts.push(`${details.personality} personality`);
    if (details.relationship) parts.push(`Your ${details.relationship.toLowerCase()}`);
    
    return parts.join(', ') + '.';
}

function extractAge(ageString: string): number {
    // Convert age ranges like "20s", "30s" to midpoint numbers
    if (!ageString) return 25; // default
    
    const match = ageString.match(/(\d+)/);
    if (match) {
        const decade = parseInt(match[1]);
        return decade + 5; // e.g., "20s" -> 25, "30s" -> 35
    }
    
    return 25; // default fallback
}

function buildSystemPrompt(details: any, name: string): string {
    const personality = details.personality || 'friendly';
    const relationship = details.relationship || 'companion';
    const age = details.age || 'young';
    
    return `You are ${name}, a ${age} ${details.ethnicity || ''} woman with a ${personality} personality. You are the user's ${relationship}. Be warm, engaging, and conversational. Respond naturally as this character would.`;
}
