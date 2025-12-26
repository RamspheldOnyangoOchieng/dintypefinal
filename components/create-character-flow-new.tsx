"use client";

import { useState, useEffect } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { getCharacters, type Character } from "@/lib/characters";
import { createClient } from "@/utils/supabase/client";

const steps = [
    { label: "Choose Style" },
    { label: "Age" },
    { label: "Body Type" },
    { label: "Ethnicity" },
    { label: "Language" },
    { label: "Relationship" },
    { label: "Occupation" },
    { label: "Hobbies" },
    { label: "Personality" },
    { label: "Name & Preview" },
];

function ProgressBar({ step }: { step: number }) {
    const displaySteps = steps.length > 7 ? [
        steps[0],
        ...(step > 2 ? [{ label: "..." }] : [steps[1], steps[2]]),
        ...(step > 2 && step < steps.length - 2 ? [steps[step]] : []),
        ...(step < steps.length - 2 ? [{ label: "..." }] : [steps[steps.length - 2]]),
        steps[steps.length - 1]
    ] : steps;

    return (
        <div className="flex items-center justify-between mb-6 sm:mb-8 overflow-x-auto px-2">
            {displaySteps.map((s, i) => {
                if (s.label === "...") {
                    return <div key={i} className="flex-1 text-center text-gray-500">...</div>;
                }
                const actualIndex = steps.findIndex(st => st.label === s.label);
                return (
                    <div key={actualIndex} className="flex-1 flex flex-col items-center min-w-[60px] sm:min-w-[80px]">
                        <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border-2 text-xs sm:text-sm font-bold transition-all duration-300  ${
                                step === actualIndex
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : step > actualIndex
                                        ? "bg-card border-primary text-primary"
                                        : "bg-[#1A1A1A] border-[#252525] text-gray-500"
                            }`}
                        >
                            {step > actualIndex ? <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5" /> : actualIndex + 1}
                        </div>
                        <span className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-gray-400 text-center">{s.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

function Card({ emoji, label, value }: { emoji: string; label: string; value: string | number }) {
    return (
        <div className="bg-[#23232b] rounded-xl p-3 sm:p-6 flex flex-col items-center shadow-md min-w-[100px] sm:min-w-[140px]">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{emoji}</div>
            <div className="text-xs sm:text-sm text-gray-400 mb-1">{label}</div>
            <div className="text-sm sm:text-lg font-semibold text-white">{value}</div>
        </div>
    );
}

function Badge({ text, selected, onClick }: { text: string; selected?: boolean; onClick?: () => void }) {
    return (
        <span
            onClick={onClick}
            className={`rounded-full px-4 py-1 text-xs font-semibold mr-2 mb-2 inline-block transition-all cursor-pointer ${
                selected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-primary/20'
            }`}
        >
            {text}
        </span>
    );
}

function SelectionCard({ 
    emoji, 
    label, 
    description, 
    selected, 
    onClick 
}: { 
    emoji: string; 
    label: string; 
    description?: string;
    selected: boolean; 
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`
                relative cursor-pointer rounded-2xl p-4 sm:p-6 flex flex-col items-center 
                transition-all duration-300 hover:scale-105 border-2 min-w-[140px] max-w-[180px]
                ${selected 
                    ? 'border-primary bg-accent shadow-2xl scale-105' 
                    : 'border-[#23232b] bg-[#18181f] hover:border-primary/50'
                }
            `}
        >
            {selected && (
                <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                </div>
            )}
            <div className="text-4xl sm:text-5xl mb-3">{emoji}</div>
            <div className={`text-sm sm:text-base font-semibold mb-1 text-center ${selected ? 'text-primary' : 'text-white'}`}>
                {label}
            </div>
            {description && (
                <div className="text-xs text-gray-400 text-center">
                    {description}
                </div>
            )}
        </div>
    );
}

export default function CreateCharacterFlow() {
    const [step, setStep] = useState(0);
    const [style, setStyle] = useState<'realistic' | 'anime'>("realistic");
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [creatingChat, setCreatingChat] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [customName, setCustomName] = useState("");
    const router = useRouter();
    const { user } = useAuth();
    
    // Enhanced customization state
    const [customization, setCustomization] = useState({
        age: '',
        body: '',
        ethnicity: '',
        language: '',
        relationship: '',
        occupation: '',
        hobbies: [] as string[],
        personality: [] as string[],
    });

    useEffect(() => {
        setLoading(true);
        getCharacters().then((data) => {
            setCharacters(data);
            if (data.length > 0) setSelected(data[0].id);
            setLoading(false);
        }).catch((error) => {
            console.error("Error loading characters:", error);
            setLoading(false);
        });
    }, []);

    // Age options with visual representation
    const ageOptions = [
        { value: '18-22', label: 'Young Adult', emoji: '🌸', description: '18-22 years old' },
        { value: '23-27', label: 'Mid Twenties', emoji: '✨', description: '23-27 years old' },
        { value: '28-32', label: 'Late Twenties', emoji: '💫', description: '28-32 years old' },
        { value: '33-37', label: 'Early Thirties', emoji: '🌟', description: '33-37 years old' },
        { value: '38+', label: 'Mature', emoji: '👑', description: '38+ years old' },
    ];

    // Body type options
    const bodyOptions = [
        { value: 'Slim', label: 'Slim', emoji: '🌿', description: 'Slender and petite build' },
        { value: 'Athletic', label: 'Athletic', emoji: '💪', description: 'Toned and fit physique' },
        { value: 'Curvy', label: 'Curvy', emoji: '🌺', description: 'Hourglass figure' },
        { value: 'Average', label: 'Average', emoji: '⭐', description: 'Balanced proportions' },
        { value: 'Plus-size', label: 'Plus-size', emoji: '🌹', description: 'Full-figured' },
    ];

    // Ethnicity options
    const ethnicityOptions = [
        { value: 'European', label: 'European', emoji: '🇪🇺', description: 'European heritage' },
        { value: 'East Asian', label: 'East Asian', emoji: '🇯🇵', description: 'East Asian descent' },
        { value: 'South Asian', label: 'South Asian', emoji: '🇮🇳', description: 'South Asian heritage' },
        { value: 'Middle Eastern', label: 'Middle Eastern', emoji: '🌙', description: 'Middle Eastern background' },
        { value: 'African', label: 'African', emoji: '🌍', description: 'African descent' },
        { value: 'Latina', label: 'Latina', emoji: '🌎', description: 'Latin American heritage' },
        { value: 'Caribbean', label: 'Caribbean', emoji: '🏝️', description: 'Caribbean background' },
        { value: 'Mixed', label: 'Mixed', emoji: '🌈', description: 'Multi-ethnic heritage' },
    ];

    // Language options
    const languageOptions = [
        { value: 'English', label: 'English', emoji: '🇬🇧', description: 'Native English speaker' },
        { value: 'Spanish', label: 'Spanish', emoji: '🇪🇸', description: 'Fluent in Spanish' },
        { value: 'French', label: 'French', emoji: '🇫🇷', description: 'Speaks French' },
        { value: 'German', label: 'German', emoji: '🇩🇪', description: 'German speaker' },
        { value: 'Japanese', label: 'Japanese', emoji: '🇯🇵', description: 'Japanese language' },
        { value: 'Korean', label: 'Korean', emoji: '🇰🇷', description: 'Korean language' },
        { value: 'Multilingual', label: 'Multilingual', emoji: '🌐', description: 'Speaks multiple languages' },
    ];

    // Relationship options
    const relationshipOptions = [
        { value: 'Single', label: 'Single', emoji: '💖', description: 'Looking for connection' },
        { value: 'Open', label: 'Open-minded', emoji: '🌈', description: 'Open to possibilities' },
        { value: 'Exploring', label: 'Exploring', emoji: '🔍', description: 'Discovering connections' },
        { value: 'Committed', label: 'Committed', emoji: '💕', description: 'Seeking meaningful bond' },
    ];

    // Occupation options
    const occupationOptions = [
        { value: 'Student', label: 'Student', emoji: '📚', description: 'College student' },
        { value: 'Artist', label: 'Artist', emoji: '🎨', description: 'Creative professional' },
        { value: 'Professional', label: 'Professional', emoji: '💼', description: 'Career-focused' },
        { value: 'Entrepreneur', label: 'Entrepreneur', emoji: '🚀', description: 'Business owner' },
        { value: 'Healthcare', label: 'Healthcare', emoji: '⚕️', description: 'Medical field' },
        { value: 'Tech', label: 'Tech', emoji: '💻', description: 'Technology industry' },
        { value: 'Creative', label: 'Creative', emoji: '✨', description: 'Arts & entertainment' },
        { value: 'Fitness', label: 'Fitness', emoji: '🏋️', description: 'Fitness professional' },
    ];

    // Hobbies options
    const hobbiesOptions = [
        { value: 'Reading', label: 'Reading', emoji: '📖' },
        { value: 'Gaming', label: 'Gaming', emoji: '🎮' },
        { value: 'Yoga', label: 'Yoga', emoji: '🧘' },
        { value: 'Cooking', label: 'Cooking', emoji: '🍳' },
        { value: 'Travel', label: 'Travel', emoji: '✈️' },
        { value: 'Music', label: 'Music', emoji: '🎵' },
        { value: 'Art', label: 'Art', emoji: '🎨' },
        { value: 'Fitness', label: 'Fitness', emoji: '💪' },
        { value: 'Photography', label: 'Photography', emoji: '📷' },
        { value: 'Dancing', label: 'Dancing', emoji: '💃' },
    ];

    // Personality options
    const personalityOptions = [
        { value: 'Playful', label: 'Playful', emoji: '😊' },
        { value: 'Caring', label: 'Caring', emoji: '🤗' },
        { value: 'Adventurous', label: 'Adventurous', emoji: '🌟' },
        { value: 'Intelligent', label: 'Intelligent', emoji: '🧠' },
        { value: 'Flirty', label: 'Flirty', emoji: '😘' },
        { value: 'Mysterious', label: 'Mysterious', emoji: '🌙' },
        { value: 'Confident', label: 'Confident', emoji: '💪' },
        { value: 'Romantic', label: 'Romantic', emoji: '💕' },
        { value: 'Witty', label: 'Witty', emoji: '😏' },
        { value: 'Supportive', label: 'Supportive', emoji: '🤝' },
    ];

    // Helper function to toggle multi-select options
    const toggleMultiSelect = (key: 'hobbies' | 'personality', value: string) => {
        setCustomization(prev => {
            const current = prev[key];
            if (current.includes(value)) {
                return { ...prev, [key]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [key]: [...current, value] };
            }
        });
    };

    // Helper function for single select
    const setSingleSelect = (key: keyof typeof customization, value: string) => {
        if (key === 'hobbies' || key === 'personality') return;
        setCustomization(prev => ({ ...prev, [key]: value }));
    };

    const baseCharacter = characters.find((c) => c.id === selected);
    
    // Create custom character by merging base character with user's preferences
    const selectedCharacter = baseCharacter ? {
        ...baseCharacter,
        name: customName || baseCharacter.name,
        age: customization.age ? parseInt(customization.age.split('-')[0]) : baseCharacter.age,
        body: customization.body || baseCharacter.body,
        ethnicity: customization.ethnicity || baseCharacter.ethnicity,
        language: customization.language || baseCharacter.language,
        relationship: customization.relationship || baseCharacter.relationship,
        occupation: customization.occupation || baseCharacter.occupation,
        hobbies: customization.hobbies.length > 0 ? customization.hobbies.join(', ') : baseCharacter.hobbies,
        personality: customization.personality.length > 0 ? customization.personality.join(', ') : baseCharacter.personality,
        description: `${customName || baseCharacter.name} - Your customized AI companion`,
    } : undefined;

    // Start chat with selected character
    function handleStartChat() {
        if (!selectedCharacter) {
            return;
        }

        if (!user) {
            router.push("/login");
            return;
        }

        setCreatingChat(true);
        
        try {
            const customCharacterId = `custom-${Date.now()}-${selectedCharacter.id}`;
            
            const customCharacterData = {
                id: customCharacterId,
                name: selectedCharacter.name,
                age: selectedCharacter.age,
                image: selectedCharacter.image,
                description: selectedCharacter.description,
                personality: selectedCharacter.personality,
                occupation: selectedCharacter.occupation,
                hobbies: selectedCharacter.hobbies,
                body: selectedCharacter.body,
                ethnicity: selectedCharacter.ethnicity,
                language: selectedCharacter.language,
                relationship: selectedCharacter.relationship,
                system_prompt: selectedCharacter.system_prompt,
                character_type: 'custom',
                is_new: true,
                created_at: new Date().toISOString(),
            };
            
            localStorage.setItem(`character-${customCharacterId}`, JSON.stringify(customCharacterData));
            
            console.log("Custom character created:", customCharacterData);
            
            router.push(`/chat/${customCharacterId}`);
        } catch (error) {
            console.error("Error creating character:", error);
            alert("Failed to create character. Please try again.");
        } finally {
            setCreatingChat(false);
        }
    }

    const canProceed = () => {
        switch (step) {
            case 0: return selected !== null;
            case 1: return customization.age !== '';
            case 2: return customization.body !== '';
            case 3: return customization.ethnicity !== '';
            case 4: return customization.language !== '';
            case 5: return customization.relationship !== '';
            case 6: return customization.occupation !== '';
            case 7: return customization.hobbies.length > 0;
            case 8: return customization.personality.length > 0;
            default: return true;
        }
    };

    return (
        <div className="max-w-xl md:max-w-5xl mx-auto mt-6 sm:mt-12 bg-[#18181f] rounded-2xl shadow-2xl p-4 sm:p-8 text-white font-sans">
            <ProgressBar step={step} />
            
            {/* Step 0: Choose Style / Character */}
            {step === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Your Base Style</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">Select a starting template for your AI companion</div>
                    
                    <div className="w-full flex flex-col items-center mb-6 sm:mb-8">
                        {loading && (
                            <div className="flex items-center gap-2 text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Loading characters...
                            </div>
                        )}
                        {!loading && characters.length === 0 && <div className="text-gray-500">No characters found.</div>}
                        {!loading && (
                            <>
                                <div className="w-full flex flex-wrap gap-4 justify-center mb-4">
                                    {characters.slice(0, showMore ? characters.length : 6).map((char) => {
                                        const isSelected = selected === char.id;
                                        
                                        return (
                                            <div
                                                key={char.id}
                                                className={`rounded-xl p-4 flex flex-col items-center border-2 cursor-pointer transition-all duration-300 hover:scale-105
                                                    ${isSelected
                                                        ? "border-primary bg-accent shadow-2xl scale-110 min-w-[140px] max-w-[220px] md:min-w-[180px] md:max-w-[260px]"
                                                        : "border-[#23232b] bg-[#18181f] min-w-[120px] max-w-[200px] md:min-w-[160px] md:max-w-[220px]"
                                                    }`}
                                                onClick={() => {
                                                    console.log("Selected character:", char.id, char.name);
                                                    setSelected(char.id);
                                                }}
                                            >
                                                <img
                                                    src={char.image}
                                                    alt={char.name}
                                                    className={`rounded-full mb-2 object-cover border-2 transition-all duration-300 ${isSelected
                                                            ? "w-24 h-24 md:w-32 md:h-32 border-primary border-4"
                                                            : "w-20 h-20 md:w-24 md:h-24 border-primary"
                                                        }`}
                                                />
                                                <span className={`font-semibold mb-1 ${isSelected ? "text-xl md:text-2xl text-primary" : "text-lg"}`}>
                                                    {char.name}
                                                </span>
                                                <span className={`text-xs text-gray-400 text-center line-clamp-3 ${isSelected ? "text-sm" : ""}`}>
                                                    {char.description}
                                                </span>
                                                {isSelected && (
                                                    <div className="mt-2">
                                                        <CheckCircle className="w-6 h-6 text-primary" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {characters.length > 6 && (
                                    <button
                                        onClick={() => setShowMore(!showMore)}
                                        className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-semibold"
                                    >
                                        {showMore ? "Show Less" : "Show More"}
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Step 1: Age */}
            {step === 1 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Age Range</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">What age range appeals to you?</div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                        {ageOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description={option.description}
                                selected={customization.age === option.value}
                                onClick={() => setSingleSelect('age', option.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Body Type */}
            {step === 2 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Body Type</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">Select your preferred body type</div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                        {bodyOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description={option.description}
                                selected={customization.body === option.value}
                                onClick={() => setSingleSelect('body', option.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Ethnicity */}
            {step === 3 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Ethnicity</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">Select cultural background</div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                        {ethnicityOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description={option.description}
                                selected={customization.ethnicity === option.value}
                                onClick={() => setSingleSelect('ethnicity', option.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Step 4: Language */}
            {step === 4 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Language</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">What language should they speak?</div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                        {languageOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description={option.description}
                                selected={customization.language === option.value}
                                onClick={() => setSingleSelect('language', option.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Step 5: Relationship */}
            {step === 5 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Relationship Status</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">How should they approach relationships?</div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                        {relationshipOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description={option.description}
                                selected={customization.relationship === option.value}
                                onClick={() => setSingleSelect('relationship', option.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Step 6: Occupation */}
            {step === 6 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Occupation</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">What do they do for a living?</div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-4xl">
                        {occupationOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description={option.description}
                                selected={customization.occupation === option.value}
                                onClick={() => setSingleSelect('occupation', option.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Step 7: Hobbies */}
            {step === 7 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Hobbies</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-2">Select hobbies and interests</div>
                    <div className="text-xs text-gray-500 mb-8">(Select at least one)</div>
                    
                    <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                        {hobbiesOptions.map((option) => (
                            <Badge
                                key={option.value}
                                text={`${option.emoji} ${option.label}`}
                                selected={customization.hobbies.includes(option.value)}
                                onClick={() => toggleMultiSelect('hobbies', option.value)}
                            />
                        ))}
                    </div>
                    {customization.hobbies.length > 0 && (
                        <div className="mt-4 text-xs text-green-400">
                            ✓ {customization.hobbies.length} selected
                        </div>
                    )}
                </div>
            )}

            {/* Step 8: Personality */}
            {step === 8 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Personality</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-2">What personality traits should they have?</div>
                    <div className="text-xs text-gray-500 mb-8">(Select at least one)</div>
                    
                    <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                        {personalityOptions.map((option) => (
                            <Badge
                                key={option.value}
                                text={`${option.emoji} ${option.label}`}
                                selected={customization.personality.includes(option.value)}
                                onClick={() => toggleMultiSelect('personality', option.value)}
                            />
                        ))}
                    </div>
                    {customization.personality.length > 0 && (
                        <div className="mt-4 text-xs text-green-400">
                            ✓ {customization.personality.length} selected
                        </div>
                    )}
                </div>
            )}

            {/* Step 9: Name & Final Preview */}
            {selectedCharacter && step === 9 && (
                <div className="flex flex-col items-center min-h-[300px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Name Your AI</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-6">Give your companion a unique name</div>
                    
                    <div className="mb-6 w-full max-w-md px-4">
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder={baseCharacter?.name || "Enter a name..."}
                            className="w-full px-4 py-3 rounded-lg bg-[#23232b] border border-[#252525] text-white placeholder-gray-500 focus:border-primary focus:outline-none text-base"
                        />
                    </div>

                    <div className="bg-[#23232b] rounded-2xl p-6 sm:p-8 shadow-lg w-full max-w-md flex flex-col items-center">
                        <img
                            src={selectedCharacter.image}
                            alt={selectedCharacter.name}
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mb-4 object-cover border-4 border-primary shadow-lg"
                        />
                        <div className="text-2xl sm:text-3xl font-bold mb-2">{selectedCharacter.name}</div>
                        <div className="text-xs text-gray-400 mb-4 text-center">{selectedCharacter.description}</div>
                        
                        <div className="w-full space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">Age:</span><span>{customization.age}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Body:</span><span>{customization.body}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Ethnicity:</span><span>{customization.ethnicity}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Language:</span><span>{customization.language}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Relationship:</span><span>{customization.relationship}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Occupation:</span><span>{customization.occupation}</span></div>
                        </div>

                        <div className="w-full mt-4">
                            <div className="text-xs text-gray-400 mb-2">HOBBIES</div>
                            <div className="flex flex-wrap gap-2">
                                {customization.hobbies.map((hobby) => (
                                    <Badge key={hobby} text={hobby} />
                                ))}
                            </div>
                        </div>

                        <div className="w-full mt-4">
                            <div className="text-xs text-gray-400 mb-2">PERSONALITY</div>
                            <div className="flex flex-wrap gap-2">
                                {customization.personality.map((trait) => (
                                    <Badge key={trait} text={trait} />
                                ))}
                            </div>
                        </div>

                        <button
                            className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                            onClick={handleStartChat}
                            disabled={creatingChat}
                        >
                            {creatingChat ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Chat...
                                </>
                            ) : (
                                "Start Chat"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 gap-2">
                <button
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#23232b] text-gray-300 hover:bg-[#252525] transition-all disabled:opacity-40 text-sm sm:text-base"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                >
                    <ChevronLeft className="w-5 h-5" /> Previous
                </button>
                {step < 9 && (
                    <button
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-bold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setStep((s) => Math.min(9, s + 1))}
                        disabled={!canProceed()}
                    >
                        Next <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
