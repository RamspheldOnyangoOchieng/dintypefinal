import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { uploadImageToSupabase } from '@/lib/storage-utils';
import { deductTokens, refundTokens, getUserTokenBalance } from '@/lib/token-utils';
import { checkActiveGirlfriendsLimit } from '@/lib/subscription-limits';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const groqApiKey = process.env.GROQ_API_KEY!;

// Token cost for creating a character (includes AI description generation)
const CHARACTER_CREATION_TOKEN_COST = 0;

export async function POST(request: NextRequest) {
    try {
        // Get user using standard server client which handles cookies correctly
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.log('❌ Authentication failed:', authError?.message || 'No user');
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const userId = user.id;
        console.log('✅ Authenticated user:', userId.substring(0, 8));

        const body = await request.json();
        const { characterName, imageUrl, characterDetails, gender, description: userDescription, promptTemplate, isPublic = false } = body;

        if (!characterName || !imageUrl) {
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
        
        // Token check removed from save as per user request (logic moved to page entry)
        // Cost is 0 anyway, so we just proceed to saving if they passed the premium gate



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

        // Use user-provided description or generate one
        let description = '';
        if (userDescription && userDescription.trim().length > 0) {
            description = userDescription.trim();
            console.log('📝 Using user-provided description');
        } else {
            console.log('🤖 Generating AI description...');
            description = await generateAIDescription(characterName, characterDetails);
            console.log('✅ Description generated');
        }

        // Use user-provided prompt template or build one
        let systemPrompt = '';
        if (promptTemplate && promptTemplate.trim().length > 0) {
            systemPrompt = promptTemplate.trim();
            console.log('📝 Using user-provided prompt template');
        } else {
            systemPrompt = buildSystemPrompt(characterDetails, characterName);
            console.log('🤖 System prompt built');
        }

        // Insert character into database with permanent image URL
        const { data, error } = await (supabase as any)
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
                is_public: isPublic,
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

        return NextResponse.json({
            success: true,
            character: data,
            tokens_used: CHARACTER_CREATION_TOKEN_COST
        });

    } catch (error) {
        console.error('❌ Error saving character:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to save character'
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
