"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { useCharacters } from "@/components/character-context";

export default function CreateCharacterGrouped() {
    const { user } = useAuth();
    const { refreshCharacters } = useCharacters();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedStyle, setSelectedStyle] = useState<'realistic' | 'anime' | null>(null);
    
    // Grouped selections from your original design
    const [selectedAttributes, setSelectedAttributes] = useState({
        ethnicity: null as string | null,
        age: null as string | null,
        eyeColor: null as string | null,
        hairStyle: null as string | null,
        hairLength: null as string | null,
        hairColor: null as string | null,
        bodyType: null as string | null,
        eyeShape: null as string | null,
        lipShape: null as string | null,
        personality: null as string | null,
        relationship: null as string | null,
    });
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [characterName, setCharacterName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showNameDialog, setShowNameDialog] = useState(false);

    // Image loading from API
    const [attributeImages, setAttributeImages] = useState<Record<string, string>>({});
    const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
    const [stylePreviewImages, setStylePreviewImages] = useState<{ realistic?: string; anime?: string }>({});

    const supabase = createClient();
    const router = useRouter();

    // Check authentication on mount
    useEffect(() => {
        if (!user) {
            // Redirect to login if not authenticated
            console.log('User not authenticated, redirecting to login...');
            router.push('/login?redirect=/create-character');
        }
    }, [user, router]);

    // Load style preview images on mount
    useEffect(() => {
        const loadStylePreviews = async () => {
            try {
                // Load realistic preview
                const realisticRes = await fetch('/api/attribute-images?category=ethnicity&value=caucasian&style=realistic');
                const realisticData = await realisticRes.json();
                if (realisticData.success && realisticData.image_url) {
                    setStylePreviewImages(prev => ({ ...prev, realistic: realisticData.image_url }));
                }

                // Load anime preview
                const animeRes = await fetch('/api/attribute-images?category=ethnicity&value=caucasian&style=anime');
                const animeData = await animeRes.json();
                if (animeData.success && animeData.image_url) {
                    setStylePreviewImages(prev => ({ ...prev, anime: animeData.image_url }));
                }
            } catch (error) {
                console.error('Error loading style previews:', error);
            }
        };

        loadStylePreviews();
    }, []);

    // Load images for a category
    const loadCategoryImages = async (category: string, values: string[], forceReload: boolean = false) => {
        if (!selectedStyle) return;
        
        const promises = values.map(async (value) => {
            const key = `${category}-${value}-${selectedStyle}`;
            // Force reload if explicitly requested (during regeneration)
            if (!forceReload && attributeImages[key]) return;

            try {
                setImageLoading(prev => ({ ...prev, [key]: true }));
                // Add cache-busting timestamp to force reload new images
                const timestamp = Date.now();
                const url = `/api/attribute-images?category=${category}&value=${encodeURIComponent(value)}&style=${selectedStyle}&t=${timestamp}`;
                console.log(`🖼️ Loading image: ${key} from ${url}`);
                const response = await fetch(url, {
                    cache: 'no-store', // Disable browser cache
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    }
                });
                const data = await response.json();
                
                if (response.ok && data.success && data.image_url) {
                    console.log(`✅ Loaded ${key}:`, data.image_url);
                    // Add timestamp to image URL to force browser reload
                    const imageUrlWithTimestamp = `${data.image_url}?v=${timestamp}`;
                    setAttributeImages(prev => ({ ...prev, [key]: imageUrlWithTimestamp }));
                } else {
                    console.warn(`❌ Failed to load ${key}:`, data);
                }
            } catch (error) {
                console.error(`💥 Error loading image for ${key}:`, error);
            } finally {
                setImageLoading(prev => ({ ...prev, [key]: false }));
            }
        });

        await Promise.all(promises);
    };

    // Preload images when step changes
    useEffect(() => {
        if (!selectedStyle) return;
        
        if (currentStep === 1) {
            // Grouped step: Ethnicity, Age, Eye Color
            loadCategoryImages('ethnicity', ['caucasian', 'latina', 'asian', 'african', 'indian', 'arab', 'mixed']);
            loadCategoryImages('age', ['18-19', '20s', '30s', '40s', '50s', '60s', '70+']);
            loadCategoryImages('eye_color', ['brown', 'blue', 'green', 'hazel', 'gray', 'amber', 'dark-brown', 'light-blue', 'violet', 'heterochromia']);
        } else if (currentStep === 2) {
            // Grouped step: Hair Style, Hair Length, Hair Color
            loadCategoryImages('hair_style', ['straight', 'wavy', 'curly', 'coily', 'braided', 'bun', 'ponytail', 'bob']);
            loadCategoryImages('hair_length', ['bald', 'buzz-cut', 'short', 'shoulder', 'mid-back', 'waist', 'hip', 'floor']);
            loadCategoryImages('hair_color', ['black', 'dark-brown', 'brown', 'light-brown', 'blonde', 'platinum', 'red', 'auburn', 'gray', 'white']);
        } else if (currentStep === 3) {
            // Grouped step: Body, Eye Shape, Lip Shape
            loadCategoryImages('body', ['slim', 'athletic', 'average', 'curvy', 'chubby', 'muscular', 'cub']);
            loadCategoryImages('eye_shape', ['almond', 'round', 'upturned', 'downturned', 'hooded', 'monolid', 'deep-set', 'prominent', 'close-set', 'wide-set']);
            loadCategoryImages('lip_shape', ['thin', 'full', 'bow-shaped', 'heart-shaped', 'round', 'wide', 'upturned', 'downturned', 'heavy-top', 'heavy-bottom']);
        } else if (currentStep === 4) {
            // Personality
            loadCategoryImages('personality', ['caregiver', 'sage', 'innocent', 'jester', 'temptress', 'dominant', 'submissive', 'lover', 'nympho', 'mean', 'confidant', 'experimenter']);
        } else if (currentStep === 5) {
            // Relationship
            loadCategoryImages('relationship', ['stranger', 'school-mate', 'colleague', 'mentor', 'girlfriend', 'sex-friend', 'wife', 'mistress', 'friend', 'best-friend', 'step-sister', 'step-mom']);
        }
    }, [currentStep, selectedStyle]);

    const getImageUrl = (category: string, value: string) => {
        if (!selectedStyle) return undefined;
        const key = `${category}-${value}-${selectedStyle}`;
        return attributeImages[key];
    };

    const getImageLoading = (category: string, value: string) => {
        if (!selectedStyle) return false;
        const key = `${category}-${value}-${selectedStyle}`;
        return imageLoading[key] || false;
    };

    // Steps - 8 total as per your original design
    const steps = [
        'Välj Stil',
        'Fysiska Funktioner',  // Ethnicity, Age, Eye Color
        'Hår',                 // Hair Style, Hair Color
        'Kropp',               // Body Type, Breasts, Butt
        'Personlighet',
        'Relation',
        'Sammanfattning',
        'Generera'
    ];

    const canProceed = () => {
        if (currentStep === 0) return selectedStyle !== null;
        if (currentStep === 1) return selectedAttributes.ethnicity && selectedAttributes.age && selectedAttributes.eyeColor;
        if (currentStep === 2) return selectedAttributes.hairStyle && selectedAttributes.hairLength && selectedAttributes.hairColor;
        if (currentStep === 3) return selectedAttributes.bodyType && selectedAttributes.eyeShape && selectedAttributes.lipShape;
        if (currentStep === 4) return selectedAttributes.personality;
        if (currentStep === 5) return selectedAttributes.relationship;
        return true;
    };

    const handleNext = () => {
        if (canProceed() && currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            
            // Auto-generate when reaching final step
            if (currentStep === 6) {
                handleGenerateImage();
            }
        }
    };

    const handleGenerateImage = async () => {
        setIsGenerating(true);

        try {
            const response = await fetch('/api/generate-character-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    characterDetails: {
                        style: selectedStyle,
                        ...selectedAttributes
                    }
                }),
            });

            const data = await response.json();
            if (data.success && data.imageUrl) {
                setGeneratedImageUrl(data.imageUrl);
                setShowNameDialog(true);
            } else {
                throw new Error('Failed to generate image');
            }
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate character. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveCharacter = async () => {
        if (!characterName.trim() || !generatedImageUrl) {
            alert('Please enter a character name');
            return;
        }
        
        if (!user) {
            console.error('No user found in auth context');
            // Redirect to login instead of showing alert
            router.push('/login?redirect=/create-character');
            return;
        }
        
        setIsSaving(true);
        try {
            console.log('💾 Saving character for user:', user.id);
            console.log('📸 Image URL:', generatedImageUrl);
            console.log('👤 Character name:', characterName);
            console.log('🎨 Character details:', selectedAttributes);
            
            const response = await fetch('/api/save-character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    characterName: characterName.trim(),
                    imageUrl: generatedImageUrl,
                    characterDetails: { style: selectedStyle, ...selectedAttributes }
                }),
            });

            const result = await response.json();
            console.log('💾 Save response:', result);

            if (response.ok && result.character) {
                console.log('✅ Character saved successfully!');
                console.log('   - ID:', result.character.id);
                console.log('   - Name:', result.character.name);
                console.log('   - Image:', result.character.image);
                console.log('   - Image URL:', result.character.image_url);
                console.log('   - Description:', result.character.description?.substring(0, 100) + '...');
                console.log('   - Tokens used:', result.tokens_used);
                
                // Refresh the characters list so the new character appears
                console.log('🔄 Refreshing characters list...');
                try {
                    await refreshCharacters();
                    console.log('✅ Characters list refreshed');
                    
                    // Wait a bit for the UI to update
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (refreshError) {
                    console.warn('⚠️ Failed to refresh characters:', refreshError);
                }
                
                // Close the name dialog
                setShowNameDialog(false);
                
                // Redirect to chat with the new character
                console.log('🚀 Redirecting to chat...');
                router.push(`/chat/${result.character.id}`);
            } else if (response.status === 402) {
                // Insufficient tokens
                const errorMessage = result.details || result.error || 'Insufficient tokens for character creation';
                console.error('❌ Insufficient tokens:', errorMessage);
                alert(`${errorMessage}\n\nYou need ${result.required_tokens || 2} tokens to create a character. Current balance: ${result.current_balance || 0} tokens.\n\nPlease purchase more tokens to continue.`);
                // Optionally redirect to token purchase page
                // router.push('/premium?tab=tokens');
            } else {
                throw new Error(result.error || 'Failed to save character');
            }
        } catch (error) {
            console.error('❌ Error saving character:', error);
            alert('Failed to save character: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Show loading while checking auth */}
            {!user ? (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Kontrollerar autentisering...</p>
                    </div>
                </div>
            ) : (
            <div className="max-w-4xl mx-auto pt-16 px-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">🧬 Skapa min AI</h1>
                    <p className="text-muted-foreground">Steg {currentStep + 1} av {steps.length}</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-8">
                    {steps.map((label, idx) => (
                        <div key={idx} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                                idx <= currentStep ? 'bg-primary border-primary text-primary-foreground' : 'bg-secondary border-secondary text-muted-foreground'
                            }`}>
                                {idx < currentStep ? '✓' : idx + 1}
                            </div>
                            {idx < steps.length - 1 && <div className={`w-12 h-1 ${idx < currentStep ? 'bg-primary' : 'bg-secondary'}`} />}
                        </div>
                    ))}
                </div>

                {/* Content Card */}
                <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border">
                    {/* Step 0: Choose Style */}
                    {currentStep === 0 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-center">Välj Stil</h2>
                            <div className="flex justify-center gap-6">
                                <div 
                                    className={`cursor-pointer rounded-xl p-2 transition-all border-2 ${
                                        selectedStyle === 'realistic' 
                                            ? 'bg-primary border-primary' 
                                            : 'border-border hover:border-primary'
                                    }`}
                                    onClick={() => setSelectedStyle('realistic')}
                                >
                                    <div className="w-[320px] h-[443px] rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                                        {stylePreviewImages.realistic ? (
                                            <img 
                                                src={stylePreviewImages.realistic} 
                                                alt="Realistic style" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                                <p className="text-sm text-muted-foreground mt-2">Laddar...</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center mt-2">
                                        <span className="text-lg font-semibold">Realistisk</span>
                                    </div>
                                </div>
                                <div 
                                    className={`cursor-pointer rounded-xl p-2 transition-all border-2 ${
                                        selectedStyle === 'anime' 
                                            ? 'bg-primary border-primary' 
                                            : 'border-border hover:border-primary'
                                    }`}
                                    onClick={() => setSelectedStyle('anime')}
                                >
                                    <div className="w-[320px] h-[443px] rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                                        {stylePreviewImages.anime ? (
                                            <img 
                                                src={stylePreviewImages.anime} 
                                                alt="Anime style" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                                <p className="text-sm text-muted-foreground mt-2">Laddar...</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center mt-2">
                                        <span className="text-lg font-semibold">Anime</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Physical Features (Ethnicity, Age, Eye Color) */}
                    {currentStep === 1 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-center">Fysiska Funktioner</h2>
                            
                            {/* Ethnicity */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Etnicitet *</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {['caucasian', 'latina', 'asian', 'african', 'indian', 'arab', 'mixed'].map(eth => {
                                        const imageUrl = getImageUrl('ethnicity', eth);
                                        const loading = getImageLoading('ethnicity', eth);
                                        
                                        return (
                                            <div key={eth} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                                selectedAttributes.ethnicity === eth ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                            }`} onClick={() => setSelectedAttributes({...selectedAttributes, ethnicity: eth})}>
                                                <div className="w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                                                    {loading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {imageUrl ? (
                                                        <img 
                                                            key={imageUrl}
                                                            src={imageUrl} 
                                                            alt={eth} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : !loading && (
                                                        <div className="text-xs text-muted-foreground">Laddar...</div>
                                                    )}
                                                </div>
                                                <p className="text-center mt-2 text-sm capitalize">{eth}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Age */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Ålder *</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {[
                                        { value: '18-19', label: 'Teen (18+)' },
                                        { value: '20s', label: '20s' },
                                        { value: '30s', label: '30s' },
                                        { value: '40s', label: '40s' },
                                        { value: '50s', label: '50s' },
                                        { value: '60s', label: '60s' },
                                        { value: '70+', label: '70+' }
                                    ].map(age => {
                                        const imageUrl = getImageUrl('age', age.value);
                                        const loading = getImageLoading('age', age.value);
                                        return (
                                            <div key={age.value} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                                selectedAttributes.age === age.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                            }`} onClick={() => setSelectedAttributes({...selectedAttributes, age: age.value})}>
                                                <div className="w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                                                    {loading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {imageUrl ? (
                                                        <img 
                                                            key={imageUrl}
                                                            src={imageUrl} 
                                                            alt={age.label} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    ) : !loading && (
                                                        <div className="text-xs text-muted-foreground">Laddar...</div>
                                                    )}
                                                </div>
                                                <p className="text-center mt-2 text-sm">{age.label}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Eye Color */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Ögonfärg *</h3>
                                <div className="grid grid-cols-5 gap-4">
                                    {['brown', 'blue', 'green', 'hazel', 'gray', 'amber', 'dark-brown', 'light-blue', 'violet', 'heterochromia'].map(eye => {
                                        const imageUrl = getImageUrl('eye_color', eye);
                                        const loading = getImageLoading('eye_color', eye);
                                        return (
                                            <div key={eye} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                                selectedAttributes.eyeColor === eye ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                            }`} onClick={() => setSelectedAttributes({...selectedAttributes, eyeColor: eye})}>
                                                <div className="w-full h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                                                    {loading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {imageUrl ? (
                                                        <img 
                                                            key={imageUrl}
                                                            src={imageUrl} 
                                                            alt={eye} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : !loading && (
                                                        <div className="text-xs text-muted-foreground">Laddar...</div>
                                                    )}
                                                </div>
                                                <p className="text-center mt-2 text-sm capitalize">{eye.replace('-', ' ')}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Hair */}
                    {currentStep === 2 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-center">Hår</h2>
                            
                            {/* Hair Style */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Hårstil *</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {['straight', 'wavy', 'curly', 'coily', 'braided', 'bun', 'ponytail', 'bob'].map(style => {
                                        const imageUrl = getImageUrl('hair_style', style);
                                        const loading = getImageLoading('hair_style', style);
                                        return (
                                            <div key={style} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                                selectedAttributes.hairStyle === style ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                            }`} onClick={() => setSelectedAttributes({...selectedAttributes, hairStyle: style})}>
                                                <div className="w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                                                    {loading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {imageUrl ? (
                                                        <img 
                                                            key={imageUrl}
                                                            src={imageUrl} 
                                                            alt={style} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : !loading && (
                                                        <div className="text-xs text-muted-foreground">Laddar...</div>
                                                    )}
                                                </div>
                                                <p className="text-center mt-2 text-sm capitalize">{style}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Hair Length */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Hårlängd *</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {['bald', 'buzz-cut', 'short', 'shoulder', 'mid-back', 'waist', 'hip', 'floor'].map(length => {
                                        const imageUrl = getImageUrl('hair_length', length);
                                        const loading = getImageLoading('hair_length', length);
                                        return (
                                            <div key={length} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                                selectedAttributes.hairLength === length ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                            }`} onClick={() => setSelectedAttributes({...selectedAttributes, hairLength: length})}>
                                                <div className="w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                                                    {loading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {imageUrl ? (
                                                        <img 
                                                            key={imageUrl}
                                                            src={imageUrl} 
                                                            alt={length} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : !loading && (
                                                        <div className="text-xs text-muted-foreground">Laddar...</div>
                                                    )}
                                                </div>
                                                <p className="text-center mt-2 text-sm capitalize">{length.replace('-', ' ')}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Hair Color */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Hårfärg *</h3>
                                <div className="grid grid-cols-5 gap-4">
                                    {['black', 'dark-brown', 'brown', 'light-brown', 'blonde', 'platinum', 'red', 'auburn', 'gray', 'white'].map(color => {
                                        const imageUrl = getImageUrl('hair_color', color);
                                        const loading = getImageLoading('hair_color', color);
                                        return (
                                            <div key={color} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                                selectedAttributes.hairColor === color ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                            }`} onClick={() => setSelectedAttributes({...selectedAttributes, hairColor: color})}>
                                                <div className="w-full h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                                                    {loading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {imageUrl ? (
                                                        <img 
                                                            key={imageUrl}
                                                            src={imageUrl} 
                                                            alt={color} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : !loading && (
                                                        <div className="text-xs text-muted-foreground">Laddar...</div>
                                                    )}
                                                </div>
                                                <p className="text-center mt-2 text-sm capitalize">{color.replace('-', ' ')}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Body */}
                    {currentStep === 3 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-center">Kropp</h2>
                            
                            {/* Body Type */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Kroppstyp *</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {['slim', 'athletic', 'average', 'curvy', 'chubby', 'muscular', 'cub'].map(body => {
                                        const imageUrl = getImageUrl('body', body);
                                        const loading = getImageLoading('body', body);
                                        return (
                                            <div key={body} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                                selectedAttributes.bodyType === body ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                            }`} onClick={() => setSelectedAttributes({...selectedAttributes, bodyType: body})}>
                                                <div className="w-full h-32 rounded-lg overflow-hidden bg-secondary flex items-center justify-center relative">
                                                    {loading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
                                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {imageUrl ? (
                                                        <img 
                                                            key={imageUrl}
                                                            src={imageUrl} 
                                                            alt={body} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    ) : !loading && (
                                                        <div className="text-xs text-muted-foreground">Laddar...</div>
                                                    )}
                                                </div>
                                                <p className="text-center mt-2 text-sm capitalize">{body}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Eye Shape */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Ögonform *</h3>
                                <div className="grid grid-cols-5 gap-4">
                                    {['almond', 'round', 'upturned', 'downturned', 'hooded', 'monolid', 'deep-set', 'prominent', 'close-set', 'wide-set'].map(shape => {
                                        const imageUrl = getImageUrl('eye_shape', shape);
                                        const loading = getImageLoading('eye_shape', shape);
                                        return (
                                            <div key={shape} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                                selectedAttributes.eyeShape === shape ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                            }`} onClick={() => setSelectedAttributes({...selectedAttributes, eyeShape: shape})}>
                                                <div className="w-full h-32 rounded-lg overflow-hidden bg-secondary flex items-center justify-center relative">
                                                    {loading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
                                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {imageUrl ? (
                                                        <img 
                                                            key={imageUrl}
                                                            src={imageUrl} 
                                                            alt={shape} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    ) : !loading && (
                                                        <div className="text-xs text-muted-foreground">Laddar...</div>
                                                    )}
                                                </div>
                                                <p className="text-center mt-2 text-sm capitalize">{shape.replace('-', ' ')}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Lip Shape */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Läppform *</h3>
                                <div className="grid grid-cols-5 gap-4">
                                    {['thin', 'full', 'bow-shaped', 'heart-shaped', 'round', 'wide', 'upturned', 'downturned', 'heavy-top', 'heavy-bottom'].map(shape => {
                                        const imageUrl = getImageUrl('lip_shape', shape);
                                        const loading = getImageLoading('lip_shape', shape);
                                        return (
                                            <div key={shape} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                                selectedAttributes.lipShape === shape ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                            }`} onClick={() => setSelectedAttributes({...selectedAttributes, lipShape: shape})}>
                                                <div className="w-full h-32 rounded-lg overflow-hidden bg-secondary flex items-center justify-center relative">
                                                    {loading && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
                                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    {imageUrl ? (
                                                        <img 
                                                            key={imageUrl}
                                                            src={imageUrl} 
                                                            alt={shape} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    ) : !loading && (
                                                        <div className="text-xs text-muted-foreground">Laddar...</div>
                                                    )}
                                                </div>
                                                <p className="text-center mt-2 text-sm capitalize">{shape.replace('-', ' ')}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Personality */}
                    {currentStep === 4 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-center">Personlighet</h2>
                            <div className="grid grid-cols-3 gap-4">
                                {['caregiver', 'sage', 'innocent', 'jester', 'temptress', 'dominant', 'submissive', 'lover', 'nympho', 'mean', 'confidant', 'experimenter'].map(p => {
                                    const imageUrl = getImageUrl('personality', p);
                                    const loading = getImageLoading('personality', p);
                                    return (
                                        <div key={p} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                            selectedAttributes.personality === p ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                        }`} onClick={() => setSelectedAttributes({...selectedAttributes, personality: p})}>
                                            <div className="w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                                                {loading && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                                {imageUrl ? (
                                                    <img 
                                                        key={imageUrl}
                                                        src={imageUrl} 
                                                        alt={p} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : !loading && (
                                                    <div className="text-xs text-muted-foreground">Laddar...</div>
                                                )}
                                            </div>
                                            <p className="text-center mt-2 text-sm capitalize">{p}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Relationship */}
                    {currentStep === 5 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-center">Relation</h2>
                            <div className="grid grid-cols-3 gap-4">
                                {['stranger', 'school-mate', 'colleague', 'mentor', 'girlfriend', 'sex-friend', 'wife', 'mistress', 'friend', 'best-friend', 'step-sister', 'step-mom'].map(r => {
                                    const imageUrl = getImageUrl('relationship', r);
                                    const loading = getImageLoading('relationship', r);
                                    return (
                                        <div key={r} className={`cursor-pointer rounded-xl p-2 border-2 transition-all ${
                                            selectedAttributes.relationship === r ? 'border-primary bg-primary/10' : 'border-border hover:border-primary'
                                        }`} onClick={() => setSelectedAttributes({...selectedAttributes, relationship: r})}>
                                            <div className="w-full h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                                                {loading && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                                {imageUrl ? (
                                                    <img 
                                                        key={imageUrl}
                                                        src={imageUrl} 
                                                        alt={r} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : !loading && (
                                                    <div className="text-xs text-muted-foreground">Laddar...</div>
                                                )}
                                            </div>
                                            <p className="text-center mt-2 text-sm capitalize">{r.replace('-', ' ')}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Summary */}
                    {currentStep === 6 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-center">Granska Din AI-Karaktär</h2>
                            
                            {/* Preview Images Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {/* Ethnicity Preview */}
                                {selectedAttributes.ethnicity && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('ethnicity', selectedAttributes.ethnicity)} 
                                                alt={selectedAttributes.ethnicity} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold capitalize">{selectedAttributes.ethnicity}</p>
                                        <p className="text-xs text-muted-foreground">Etnicitet</p>
                                    </div>
                                )}
                                
                                {/* Age Preview */}
                                {selectedAttributes.age && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('age', selectedAttributes.age)} 
                                                alt={selectedAttributes.age} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold">{selectedAttributes.age}</p>
                                        <p className="text-xs text-muted-foreground">Ålder</p>
                                    </div>
                                )}
                                
                                {/* Eye Color Preview */}
                                {selectedAttributes.eyeColor && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('eye_color', selectedAttributes.eyeColor)} 
                                                alt={selectedAttributes.eyeColor} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold capitalize">{selectedAttributes.eyeColor.replace('-', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">Ögonfärg</p>
                                    </div>
                                )}
                                
                                {/* Hair Style Preview */}
                                {selectedAttributes.hairStyle && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('hair_style', selectedAttributes.hairStyle)} 
                                                alt={selectedAttributes.hairStyle} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold capitalize">{selectedAttributes.hairStyle}</p>
                                        <p className="text-xs text-muted-foreground">Hårstil</p>
                                    </div>
                                )}
                                
                                {/* Hair Color Preview */}
                                {selectedAttributes.hairColor && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('hair_color', selectedAttributes.hairColor)} 
                                                alt={selectedAttributes.hairColor} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold capitalize">{selectedAttributes.hairColor.replace('-', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">Hårfärg</p>
                                    </div>
                                )}
                                
                                {/* Body Type Preview */}
                                {selectedAttributes.bodyType && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('body', selectedAttributes.bodyType)} 
                                                alt={selectedAttributes.bodyType} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold capitalize">{selectedAttributes.bodyType}</p>
                                        <p className="text-xs text-muted-foreground">Kroppstyp</p>
                                    </div>
                                )}
                                
                                {/* Hair Length Preview */}
                                {selectedAttributes.hairLength && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('hair_length', selectedAttributes.hairLength)} 
                                                alt={selectedAttributes.hairLength} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold capitalize">{selectedAttributes.hairLength.replace('-', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">Hårlängd</p>
                                    </div>
                                )}
                                
                                {/* Eye Shape Preview */}
                                {selectedAttributes.eyeShape && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('eye_shape', selectedAttributes.eyeShape)} 
                                                alt={selectedAttributes.eyeShape} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold capitalize">{selectedAttributes.eyeShape.replace('-', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">Ögonform</p>
                                    </div>
                                )}
                                
                                {/* Lip Shape Preview */}
                                {selectedAttributes.lipShape && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('lip_shape', selectedAttributes.lipShape)} 
                                                alt={selectedAttributes.lipShape} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold capitalize">{selectedAttributes.lipShape.replace('-', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">Läppform</p>
                                    </div>
                                )}
                                
                                {/* Personality Preview */}
                                {selectedAttributes.personality && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('personality', selectedAttributes.personality)} 
                                                alt={selectedAttributes.personality} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold capitalize">{selectedAttributes.personality}</p>
                                        <p className="text-xs text-muted-foreground">Personlighet</p>
                                    </div>
                                )}
                                
                                {/* Relationship Preview */}
                                {selectedAttributes.relationship && (
                                    <div className="text-center">
                                        <div className="w-full h-40 rounded-lg overflow-hidden bg-muted mb-2">
                                            <img 
                                                src={getImageUrl('relationship', selectedAttributes.relationship)} 
                                                alt={selectedAttributes.relationship} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-semibold capitalize">{selectedAttributes.relationship.replace('-', ' ')}</p>
                                        <p className="text-xs text-muted-foreground">Relation</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Style Info */}
                            <div className="text-center mt-6">
                                <div className="inline-block bg-primary/10 px-6 py-3 rounded-lg border-2 border-primary">
                                    <strong className="text-primary">Stil:</strong> <span className="capitalize">{selectedStyle === 'realistic' ? 'Realistisk' : 'Anime'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 7: Generate */}
                    {currentStep === 7 && (
                        <div>
                            {isGenerating ? (
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold mb-4">Skapar din AI</h2>
                                    <div className="flex justify-center items-center mb-8">
                                        <div className="w-32 h-32 border-4 border-border rounded-full animate-spin border-t-primary"></div>
                                    </div>
                                    <p className="text-lg text-muted-foreground">Genererar din karaktär...</p>
                                </div>
                            ) : generatedImageUrl ? (
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold mb-4">Din AI är Redo!</h2>
                                    <div className="mb-8 flex justify-center">
                                        <img src={generatedImageUrl} alt="Generated Character" className="rounded-2xl border-4 border-primary shadow-2xl max-w-md" />
                                    </div>
                                    
                                    {showNameDialog && (
                                        <div className="max-w-md mx-auto bg-card p-6 rounded-xl border-2 border-border shadow-xl">
                                            <h3 className="text-xl font-bold mb-4 text-center">Namnge Din Karaktär</h3>
                                            <div className="mb-4 p-3 bg-primary/10 rounded-lg text-sm text-center">
                                                <p className="text-muted-foreground">
                                                    💰 <span className="font-semibold">Kostnad:</span> 2 tokens
                                                    <br />
                                                    <span className="text-xs">(Inkluderar AI-beskrivningsgenerering)</span>
                                                </p>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Ange ett namn..."
                                                value={characterName}
                                                onChange={(e) => setCharacterName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && characterName.trim() && !isSaving) {
                                                        handleSaveCharacter();
                                                    }
                                                }}
                                                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all mb-4 text-lg"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSaveCharacter}
                                                disabled={!characterName.trim() || isSaving}
                                                className="w-full px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg font-bold text-lg hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        <span>Sparar...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>💬</span>
                                                        <span>Starta Chatt</span>
                                                    </>
                                                )}
                                            </button>
                                            <p className="text-sm text-muted-foreground text-center mt-3">Tryck Enter för att börja chatta</p>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setCurrentStep(currentStep - 1)}
                            disabled={currentStep === 0}
                            className="px-6 py-2 border-2 border-border rounded-lg hover:border-primary disabled:opacity-50"
                        >
                            ← Tillbaka
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={!canProceed() || currentStep === steps.length - 1}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            {currentStep === 6 ? 'Generera Karaktär →' : 'Nästa →'}
                        </button>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
}
