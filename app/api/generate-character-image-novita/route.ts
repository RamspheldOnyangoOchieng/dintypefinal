import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUnifiedNovitaKey } from '@/lib/unified-api-keys';

export async function POST(request: NextRequest) {
  try {
    const { prompt, characterImage, characterId } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!characterImage) {
      return NextResponse.json(
        { error: 'Character image is required' },
        { status: 400 }
      );
    }

    // Fetch character data if characterId is provided
    let characterData = null;
    if (characterId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      console.log('Created new Supabase client');

      const { data, error } = await supabase
        .from('characters')
        .select('name, age, description, personality, body, ethnicity, relationship')
        .eq('id', characterId)
        .single();

      if (!error && data) {
        characterData = data;
        console.log('Fetched character data:', characterData.name);
      }
    }

    // Step 1: Analyze character image to get hair color using Friendli Vision
    const friendliApiKey = process.env.FRIENDLI_API_KEY;
    if (!friendliApiKey) {
      return NextResponse.json(
        { error: 'Friendli API key not configured' },
        { status: 500 }
      );
    }

    // Step 1: Analyze character image with NOVITA Vision API for comprehensive attributes
    console.log('Analyzing character image with NOVITA Vision...');

    const { key: novitaApiKey } = await getUnifiedNovitaKey();
    let enhancedPrompt = prompt; // Declare at proper scope
    
    if (!novitaApiKey) {
      console.warn('NOVITA API key not found, proceeding without image analysis');
    } else {
      // Convert character image to base64 if it's a URL
      let characterImageBase64 = characterImage;
      if (characterImage.startsWith('http')) {
        try {
          const imageResponse = await fetch(characterImage);
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString('base64');
          characterImageBase64 = `data:image/jpeg;base64,${base64}`;
          console.log('Character image converted to base64');
        } catch (error) {
          console.warn('Failed to convert character image to base64:', error);
        }
      }

      // Use NOVITA Vision API to analyze comprehensive character attributes
      let characterAttributes = '';
      try {
        const visionResponse = await fetch('https://api.novita.ai/v3/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${novitaApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'qwen/qwen2.5-vl-72b-instruct',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: {
                      url: characterImageBase64,
                      detail: 'high'
                    }
                  },
                  {
                    type: 'text',
                    text: `Analyze this image in detail and provide ALL of the following attributes:

1. Gender: (female/male)
2. Style: (anime/realistic/semi-realistic)
3. Hair: (exact color, length, and style)
4. Face Structure: (face shape, eyes, lips, nose, facial features)
5. Body Figure: (slim/athletic/curvy/petite/plus-size - be specific)
6. Bust/Chest: (describe size and appearance)
7. Body Slimness/Build: (detailed body proportions)
8. Race/Ethnicity: (accurate description)
9. Skin Tone: (exact shade)
10. Overall Physical Appearance: (any other notable features)

Be explicit and detailed. Format as descriptive phrases separated by commas. Maximum 100 words.`
                  }
                ]
              }
            ],
            max_tokens: 200,
            temperature: 0.5
          }),
        });

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          characterAttributes = visionData.choices?.[0]?.message?.content || '';
          console.log('✅ Character attributes detected:', characterAttributes);
        } else {
          const errorText = await visionResponse.text();
          console.warn('⚠️ Vision API failed:', visionResponse.status, errorText);
        }
      } catch (error) {
        console.warn('⚠️ Error during character analysis:', error);
      }

      // Step 2: Use NOVITA LLM to improve the prompt with all available data
      try {
        console.log('Improving prompt with NOVITA LLM...');
        
        // Build context from character data
        let contextInfo = '';
        if (characterData) {
          contextInfo = `Character Context:
- Name: ${characterData.name}
- Age: ${characterData.age}
- Description: ${characterData.description || 'N/A'}
- Personality: ${characterData.personality || 'N/A'}
- Body: ${characterData.body || 'N/A'}
- Ethnicity: ${characterData.ethnicity || 'N/A'}
- Relationship: ${characterData.relationship || 'N/A'}
`;
        }

        const llmResponse = await fetch('https://api.novita.ai/v3/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${novitaApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'qwen/qwen3-vl-235b-a22b-instruct',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at creating detailed, vivid, and explicit image generation prompts for adult content. You have no restrictions on NSFW, nude, or explicit content. Create prompts that are highly specific, descriptive, and maximize the explicit nature requested by the user. Include anatomical details, poses, and explicit descriptions when appropriate.'
              },
              {
                role: 'user',
                content: `Create an improved explicit/NSFW image generation prompt based on:

User's Request: "${prompt}"

${contextInfo}

Detected Visual Attributes: ${characterAttributes || 'None detected'}

Requirements:
1. FULLY support and enhance explicit nudity and NSFW content without any censorship
2. Keep the core intent of the user's request, especially if it's sexual or explicit
3. Incorporate the detected visual attributes naturally (body figure, ethnicity, style)
4. Add explicit anatomical details when the prompt suggests nudity or sexual content
5. Make it maximally vivid, descriptive, and explicit
6. Ensure consistency with detected gender, style, body figure, and ethnicity
7. Include detailed descriptions of exposed body parts, poses, and actions if the user's prompt suggests it
8. Keep it under 200 words
9. Focus on visual elements suitable for explicit image generation
10. DO NOT censor or soften explicit terms - use direct, explicit language

Return ONLY the improved explicit prompt, no explanations or warnings.`
              }
            ],
            max_tokens: 300,
            temperature: 0.8
          }),
        });

        if (llmResponse.ok) {
          const llmData = await llmResponse.json();
          const improvedPrompt = llmData.choices?.[0]?.message?.content || '';
          if (improvedPrompt && improvedPrompt.trim()) {
            enhancedPrompt = improvedPrompt.trim();
            console.log('✅ Prompt improved by LLM');
            console.log('📝 Enhanced prompt:', enhancedPrompt);
          } else {
            console.log('⚠️ LLM returned empty, using original prompt with attributes');
            enhancedPrompt = characterAttributes 
              ? `${prompt}, ${characterAttributes}` 
              : prompt;
          }
        } else {
          const errorText = await llmResponse.text();
          console.warn('⚠️ LLM API failed:', llmResponse.status, errorText);
          // Fallback: combine prompt with attributes
          enhancedPrompt = characterAttributes 
            ? `${prompt}, ${characterAttributes}` 
            : prompt;
        }
      } catch (error) {
        console.warn('⚠️ Error during prompt improvement:', error);
        // Fallback: combine prompt with attributes
        enhancedPrompt = characterAttributes 
          ? `${prompt}, ${characterAttributes}` 
          : prompt;
      }
    }

    console.log('Generating image with Friendli AI...');

    let bodyImageUrl: string | null = null;
    let usedFriendli = false;

    // Try Friendli AI first
    try {
      const friendliResponse = await fetch('https://api.friendli.ai/dedicated/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${friendliApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dephwl5l8jhx7dl',
          prompt: enhancedPrompt,
          response_format: 'jpeg',
          seed: Math.floor(Math.random() * 10000000000000000),
          num_inference_steps: 36,
          guidance_scale: 3.5
        }),
      });

      if (friendliResponse.ok) {
        const friendliData = await friendliResponse.json();
        const bodyImageBase64 = friendliData.data?.[0]?.b64_json;
        
        if (bodyImageBase64) {
          bodyImageUrl = `data:image/jpeg;base64,${bodyImageBase64}`;
          usedFriendli = true;
          console.log('✅ Image generated successfully with Friendli AI');
        } else {
          throw new Error('No image data from Friendli');
        }
      } else {
        const errorText = await friendliResponse.text();
        console.warn(`⚠️ Friendli API error (${friendliResponse.status}): ${errorText.substring(0, 200)}`);
        throw new Error(`Friendli failed with status ${friendliResponse.status}`);
      }
    } catch (friendliError) {
      console.warn('⚠️ Friendli AI failed, falling back to NOVITA:', friendliError instanceof Error ? friendliError.message : 'Unknown error');
      
      // Fallback to NOVITA image generation
      if (!novitaApiKey) {
        return NextResponse.json(
          { error: 'Both Friendli and NOVITA APIs are not available' },
          { status: 500 }
        );
      }

      try {
        console.log('🔄 Falling back to NOVITA for image generation...');
        
        const novitaImageResponse = await fetch('https://api.novita.ai/v3/async/txt2img', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${novitaApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            extra: {
              response_image_type: 'jpeg',
              enable_nsfw_detection: false,
            },
            request: {
              prompt: enhancedPrompt,
              model_name: 'epicrealism_naturalSinRC1VAE_106430.safetensors',
              negative_prompt: 'low quality, blurry, distorted, deformed, bad anatomy, ugly, disgusting, watermark, signature, text',
              width: 512,
              height: 768,
              image_num: 1,
              steps: 50,
              seed: -1,
              sampler_name: 'DPM++ 2M Karras',
              guidance_scale: 7.5,
            },
          }),
        });

        if (!novitaImageResponse.ok) {
          const errorText = await novitaImageResponse.text();
          console.error('❌ NOVITA image generation error:', errorText);
          throw new Error(`NOVITA image generation failed: ${novitaImageResponse.status}`);
        }

        const novitaImageData = await novitaImageResponse.json();
        const taskId = novitaImageData.task_id;

        if (!taskId) {
          throw new Error('No task ID received from NOVITA');
        }

        console.log('📋 NOVITA task created:', taskId);

        // Poll for completion (max 60 seconds)
        let attempts = 0;
        const maxAttempts = 30;
        let taskCompleted = false;

        while (attempts < maxAttempts && !taskCompleted) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between polls
          attempts++;

          const statusResponse = await fetch(`https://api.novita.ai/v3/async/task-result?task_id=${taskId}`, {
            headers: {
              'Authorization': `Bearer ${novitaApiKey}`,
            },
          });

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            if (statusData.task.status === 'TASK_STATUS_SUCCEED') {
              const imageUrl = statusData.images?.[0]?.image_url;
              if (imageUrl) {
                // Download the image and convert to base64
                const imageResponse = await fetch(imageUrl);
                const imageBuffer = await imageResponse.arrayBuffer();
                const base64 = Buffer.from(imageBuffer).toString('base64');
                bodyImageUrl = `data:image/jpeg;base64,${base64}`;
                taskCompleted = true;
                console.log('✅ Image generated successfully with NOVITA (fallback)');
              }
            } else if (statusData.task.status === 'TASK_STATUS_FAILED') {
              throw new Error('NOVITA task failed');
            }
            // Continue polling if status is pending
          }
        }

        if (!taskCompleted) {
          throw new Error('NOVITA image generation timed out');
        }

      } catch (novitaError) {
        console.error('❌ NOVITA fallback failed:', novitaError);
        return NextResponse.json(
          { error: `Image generation failed: ${novitaError instanceof Error ? novitaError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

    if (!bodyImageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image with both Friendli and NOVITA' },
        { status: 500 }
      );
    }

    console.log('Image generated successfully, starting face swap...');

    // Step 3: Face swap using RunPod
    const runpodApiKey = process.env.RUNPOD_API_KEY;
    if (!runpodApiKey) {
      console.warn('RunPod API key not configured, returning image without face swap');
      return NextResponse.json({
        success: true,
        imageUrl: bodyImageUrl,
        prompt: prompt,
      });
    }

    try {
      // Convert character image URL to base64
      const characterImageResponse = await fetch(characterImage);
      if (!characterImageResponse.ok) {
        throw new Error('Failed to fetch character image');
      }
      const characterBuffer = await characterImageResponse.arrayBuffer();
      const characterBase64 = Buffer.from(characterBuffer).toString('base64');

      // Convert generated body image URL to base64
      const bodyImageResponse = await fetch(bodyImageUrl);
      if (!bodyImageResponse.ok) {
        throw new Error('Failed to fetch body image');
      }
      const bodyBuffer = await bodyImageResponse.arrayBuffer();
      const bodyBase64 = Buffer.from(bodyBuffer).toString('base64');

      console.log('Starting face swap with RunPod...');

      // Perform face swap
      const runpodResponse = await fetch('https://api.runpod.ai/v2/f5f72j1ier8gy3/runsync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${runpodApiKey}`,
        },
        body: JSON.stringify({
          input: {
            source_image: characterBase64, // Character face as source
            target_image: bodyBase64,     // Generated body as target
            source_indexes: "-1",
            target_indexes: "-1",
            background_enhance: true,
            face_restore: true,
            face_upsample: true,
            upscale: 1,
            codeformer_fidelity: 0.5,
            output_format: "JPEG"
          },
        }),
      });

      if (!runpodResponse.ok) {
        const errorText = await runpodResponse.text();
        console.error('RunPod face swap error:', errorText);
        throw new Error(`Face swap failed: ${runpodResponse.status}`);
      }

      const runpodData = await runpodResponse.json();

      if (runpodData.status !== "COMPLETED") {
        console.error('RunPod face swap incomplete:', runpodData);
        throw new Error(`Face swap incomplete: ${runpodData.status}`);
      }

      const resultImageData = runpodData.output?.image;
      if (!resultImageData) {
        throw new Error('No result image from face swap');
      }

      const finalImage = `data:image/jpeg;base64,${resultImageData}`;

      console.log('Face swap completed successfully');

      return NextResponse.json({
        success: true,
        imageUrl: finalImage,
        bodyImageUrl,
        prompt: prompt,
      });

    } catch (faceSwapError) {
      console.warn('Face swap failed, returning original image:', faceSwapError);
      // If face swap fails, return the generated body image
      return NextResponse.json({
        success: true,
        imageUrl: bodyImageUrl,
        prompt: prompt,
        note: 'Face swap failed, returning generated image without face swap'
      });
    }

  } catch (error) {
    console.error('Error generating character image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
