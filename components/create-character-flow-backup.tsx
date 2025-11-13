"use client";

import { useState, useEffect } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { getCharacters, type Character } from "@/lib/characters";
import { createClient } from "@/lib/supabase/client";

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
    return (
        <div className="flex items-center justify-between mb-6 sm:mb-8 overflow-x-auto px-2">
            {steps.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center min-w-[60px] sm:min-w-[80px]">
                    <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border-2 text-xs sm:text-sm font-bold transition-all duration-300  ${step === i
                            ? "bg-primary border-primary text-primary-foreground"
                            : step > i
                                ? "bg-card border-primary text-primary"
                                : "bg-[#1A1A1A] border-[#252525] text-gray-500"
                            }`}
                    >
                        {step > i ? <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5" /> : i + 1}
                    </div>
                    <span className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-gray-400 text-center">{s.label}</span>
                    {i < steps.length - 1 && (
                        <div className="hidden sm:block w-full h-1 bg-[#252525] mt-2 mb-2">
                            <div
                                className={`h-1 transition-all duration-300 ${step > i ? "bg-primary w-full" : "bg-muted w-0"
                                    }`}
                            />
                        </div>
                    )}
                </div>
            ))}
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

function Badge({ text }: { text: string }) {
    return (
    <span className="bg-muted text-primary rounded-full px-4 py-1 text-xs font-semibold mr-2 mb-2 inline-block">
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

    // Get unique values for each filter
    const unique = (key: keyof Character) => Array.from(new Set(characters.map((c) => c[key]).filter(Boolean)));

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
        if (key === 'hobbies' || key === 'personality') return; // Use toggleMultiSelect for these
        setCustomization(prev => ({ ...prev, [key]: value }));
    };


    // Instead of filtering out, highlight matches but always show all models
    function isMatch(char: Character) {
        return (
            (!customization.age || String(char.age) === customization.age) &&
            (!customization.body || char.body === customization.body) &&
            (!customization.ethnicity || char.ethnicity === customization.ethnicity) &&
            (!customization.language || char.language === customization.language) &&
            (!customization.relationship || char.relationship === customization.relationship) &&
            (!customization.occupation || char.occupation === customization.occupation) &&
            (customization.hobbies.length === 0 || customization.hobbies.some(h => char.hobbies.includes(h))) &&
            (customization.personality.length === 0 || customization.personality.some(p => char.personality.includes(p)))
        );
    }

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

    // Debug logging
    useEffect(() => {
        if (selected && selectedCharacter) {
            console.log("Selected character with user preferences:", {
                id: selectedCharacter.id,
                name: selectedCharacter.name,
                customization: customization,
            });
        }
    }, [selected, selectedCharacter, baseCharacter, customization]);

    // Start chat with selected character
    function handleStartChat() {
        if (!selectedCharacter) {
            return;
        }

        if (!user) {
            // Redirect to login if not authenticated
            router.push("/login");
            return;
        }

        setCreatingChat(true);
        
        try {
            // Create a unique ID for the custom character
            const customCharacterId = `custom-${Date.now()}-${selectedCharacter.id}`;
            
            // Save the customized character to localStorage
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
            
            // Store in localStorage
            localStorage.setItem(`character-${customCharacterId}`, JSON.stringify(customCharacterData));
            
            console.log("Custom character created:", customCharacterData);
            
            // Navigate to chat with the custom character
            router.push(`/chat/${customCharacterId}`);
        } catch (error) {
            console.error("Error creating character:", error);
            alert("Failed to create character. Please try again.");
        } finally {
            setCreatingChat(false);
        }
    }

    return (
        <div className="max-w-xl md:max-w-5xl mx-auto mt-6 sm:mt-12 bg-[#18181f] rounded-2xl shadow-2xl p-4 sm:p-8 text-white font-sans">
            <ProgressBar step={step} />
            {/* Step Content */}
            {step === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full mb-4 sm:mb-6 gap-4">
                        <div className="flex-1">
                            <div className="text-2xl sm:text-3xl font-bold mb-2">Create my AI</div>
                            <div className="text-sm sm:text-base text-gray-400">Let's build your AI companion.</div>
                        </div>
                        <button
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold text-base sm:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            onClick={() => {
                                if (selectedCharacter && selected) {
                                    console.log("Moving to step 2 with character:", selectedCharacter.name);
                                    setStep(1);
                                }
                            }}
                            disabled={!selectedCharacter || !selected}
                        >
                            Next &rarr;
                        </button>
                    </div>
                    {/* Filter Controls */}
                    <div className="w-full flex flex-wrap gap-2 mb-4 sm:mb-6 justify-center">
                        <select className="rounded bg-[#23232b] px-2 sm:px-3 py-1 text-xs sm:text-sm" value={filters.age} onChange={e => handleFilterChange('age', e.target.value)}>
                            <option value="">AGE</option>
                            {unique('age').map((v) => <option key={v} value={v as string}>{v}</option>)}
                        </select>
                        <select className="rounded bg-[#23232b] px-2 sm:px-3 py-1 text-xs sm:text-sm" value={filters.body} onChange={e => handleFilterChange('body', e.target.value)}>
                            <option value="">BODY</option>
                            {unique('body').map((v) => <option key={v} value={v as string}>{v}</option>)}
                        </select>
                        <select className="rounded bg-[#23232b] px-2 sm:px-3 py-1 text-xs sm:text-sm" value={filters.ethnicity} onChange={e => handleFilterChange('ethnicity', e.target.value)}>
                            <option value="">ETHNICITY</option>
                            <option value="European">European</option>
                            <option value="East Asian">East Asian</option>
                            <option value="South Asian">South Asian</option>
                            <option value="Middle Eastern">Middle Eastern</option>
                            <option value="African">African</option>
                            <option value="Latina">Latina</option>
                            <option value="Caribbean">Caribbean</option>
                            <option value="Pacific Islander">Pacific Islander</option>
                            <option value="Indigenous">Indigenous</option>
                            <option value="Mixed">Mixed</option>
                        </select>
                        <select className="rounded bg-[#23232b] px-2 sm:px-3 py-1 text-xs sm:text-sm" value={filters.language} onChange={e => handleFilterChange('language', e.target.value)}>
                            <option value="">LANGUAGE</option>
                            {unique('language').map((v) => <option key={v} value={v as string}>{v}</option>)}
                        </select>
                        <select className="rounded bg-[#23232b] px-2 sm:px-3 py-1 text-xs sm:text-sm" value={filters.relationship} onChange={e => handleFilterChange('relationship', e.target.value)}>
                            <option value="">RELATIONSHIP</option>
                            {unique('relationship').map((v) => <option key={v} value={v as string}>{v}</option>)}
                        </select>
                        <select className="rounded bg-[#23232b] px-2 sm:px-3 py-1 text-xs sm:text-sm" value={filters.occupation} onChange={e => handleFilterChange('occupation', e.target.value)}>
                            <option value="">OCCUPATION</option>
                            {unique('occupation').map((v) => <option key={v} value={v as string}>{v}</option>)}
                        </select>
                        <select className="rounded bg-[#23232b] px-2 sm:px-3 py-1 text-xs sm:text-sm" value={filters.hobbies} onChange={e => handleFilterChange('hobbies', e.target.value)}>
                            <option value="">HOBBIES</option>
                            {Array.from(new Set(characters.flatMap((c) => c.hobbies.split(',').map(h => h.trim())))).map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <select className="rounded bg-[#23232b] px-2 sm:px-3 py-1 text-xs sm:text-sm" value={filters.personality} onChange={e => handleFilterChange('personality', e.target.value)}>
                            <option value="">PERSONALITY</option>
                            {Array.from(new Set(characters.flatMap((c) => c.personality.split(',').map(p => p.trim())))).map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
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
                                    {characters.slice(0, showMore ? characters.length : 3).map((char) => {
                                        const isSelected = selected === char.id;
                                        const matchesFilter = isMatch(char);
                                        
                                        return (
                                            <div
                                                key={char.id}
                                                className={`rounded-xl p-4 flex flex-col items-center border-2 cursor-pointer transition-all duration-300 hover:scale-105
                  ${isSelected
                                                        ? "border-primary bg-accent shadow-2xl scale-110 min-w-[140px] max-w-[220px] md:min-w-[180px] md:max-w-[260px]"
                                                        : matchesFilter
                                                            ? "border-primary/50 bg-accent/50 opacity-90 min-w-[120px] max-w-[200px] md:min-w-[160px] md:max-w-[220px]"
                                                            : "border-[#23232b] bg-[#18181f] opacity-40 min-w-[120px] max-w-[200px] md:min-w-[160px] md:max-w-[220px]"
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
                                {characters.length > 3 && (
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
            {selectedCharacter && step === 1 && (
                <div className="flex flex-col items-center min-h-[300px]">
                    <div className="mb-4 sm:mb-6 flex flex-col items-center">
                        <img
                            src={selectedCharacter.image}
                            alt={selectedCharacter.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-2 sm:mb-3 object-cover border-2 border-primary"
                        />
                        <div className="text-xs sm:text-sm text-primary mb-2">Your AI's Core Info</div>
                        
                        {/* Custom Name Input */}
                        <div className="mb-4 w-full max-w-md px-4">
                            <label className="block text-xs sm:text-sm text-gray-400 mb-2">Give your AI a name</label>
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder={baseCharacter?.name || "Enter name..."}
                                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-[#23232b] border border-[#252525] text-white placeholder-gray-500 focus:border-primary focus:outline-none text-sm sm:text-base"
                            />
                        </div>
                        
                        {(filters.age || filters.body || filters.ethnicity || customName) && (
                            <div className="text-xs text-green-400 flex items-center gap-1 mb-2">
                                <CheckCircle className="w-3 h-3" />
                                Customized with your preferences
                            </div>
                        )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8">Step 2 of 6</div>
                    <div className="flex gap-3 sm:gap-6 mb-6 sm:mb-8 flex-wrap justify-center">
                        <Card emoji="🎂" label="AGE" value={selectedCharacter.age} />
                        <Card emoji="💪" label="BODY" value={selectedCharacter.body} />
                        <Card emoji="🌎" label="ETHNICITY" value={selectedCharacter.ethnicity} />
                    </div>
                </div>
            )}
            {selectedCharacter && step === 2 && (
                <div className="flex flex-col items-center min-h-[300px]">
                    <div className="text-xl sm:text-2xl font-bold mb-2">How They Connect</div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8">Step 3 of 6</div>
                    <div className="flex gap-3 sm:gap-6 mb-6 sm:mb-8 flex-wrap justify-center">
                        <Card emoji="🗣️" label="LANGUAGE" value={selectedCharacter.language} />
                        <Card emoji="💑" label="RELATIONSHIP STATUS" value={selectedCharacter.relationship} />
                    </div>
                </div>
            )}
            {selectedCharacter && step === 3 && (
                <div className="flex flex-col items-center min-h-[300px]">
                    <div className="text-xl sm:text-2xl font-bold mb-2">What They Do</div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8">Step 4 of 6</div>
                    <div className="flex flex-col items-center mb-6 sm:mb-8">
                        <div className="bg-[#23232b] rounded-xl p-4 sm:p-6 flex flex-col items-center shadow-md min-w-[180px] sm:min-w-[220px] relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: 'url(/gaming-bg.jpg)' }} />
                            <div className="relative z-10">
                                <div className="text-2xl sm:text-3xl mb-2">💼</div>
                                <div className="text-xs sm:text-sm text-gray-400 mb-1">OCCUPATION</div>
                                <div className="text-base sm:text-lg font-semibold text-white">{selectedCharacter.occupation}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {selectedCharacter && step === 4 && (
                <div className="flex flex-col items-center min-h-[300px]">
                    <div className="text-xl sm:text-2xl font-bold mb-2">Who They Are</div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8">Step 5 of 6</div>
                    <div className="w-full flex flex-col items-center mb-4 px-4">
                        <div className="text-xs sm:text-sm text-gray-400 mb-2">HOBBIES</div>
                        <div className="flex flex-wrap justify-center mb-4">
                            {selectedCharacter.hobbies.split(",").map((hobby) => (
                                <Badge key={hobby.trim()} text={hobby.trim()} />
                            ))}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400 mb-2">PERSONALITY</div>
                        <div className="flex flex-wrap justify-center">
                            {selectedCharacter.personality.split(",").map((trait) => (
                                <Badge key={trait.trim()} text={trait.trim()} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {selectedCharacter && step === 5 && (
                <div className="flex flex-col items-center min-h-[300px]">
                    <div className="text-xl sm:text-2xl font-bold mb-2">Meet Your AI</div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8">Step 6 of 6</div>
                    <div className="bg-[#23232b] rounded-2xl p-4 sm:p-8 shadow-lg w-full max-w-md flex flex-col items-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url(${selectedCharacter.image})` }} />
                        <div className="relative z-10 flex flex-col items-center w-full">
                            <img
                                src={selectedCharacter.image}
                                alt={selectedCharacter.name}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-3 sm:mb-4 object-cover border-4 border-primary shadow-lg"
                            />
                            <div className="text-xl sm:text-2xl font-bold mb-1">{selectedCharacter.name}</div>
                            <div className="text-xs text-gray-400 mb-3 sm:mb-4 text-center max-w-xs px-2">{selectedCharacter.description}</div>
                            <div className="flex gap-2 sm:gap-4 mb-2 flex-wrap justify-center">
                                <Card emoji="🎂" label="AGE" value={selectedCharacter.age} />
                                <Card emoji="💪" label="BODY" value={selectedCharacter.body} />
                                <Card emoji="🌎" label="ETHNICITY" value={selectedCharacter.ethnicity} />
                            </div>
                            <div className="flex gap-2 sm:gap-4 mb-2 flex-wrap justify-center">
                                <Card emoji="🗣️" label="LANGUAGE" value={selectedCharacter.language} />
                                <Card emoji="💑" label="RELATIONSHIP" value={selectedCharacter.relationship} />
                                <Card emoji="💼" label="OCCUPATION" value={selectedCharacter.occupation} />
                            </div>
                            <div className="w-full flex flex-col items-center mb-2 px-2">
                                <div className="text-xs text-gray-400 mb-1">HOBBIES</div>
                                <div className="flex flex-wrap justify-center mb-2">
                                    {selectedCharacter.hobbies.split(",").map((hobby) => (
                                        <Badge key={hobby.trim()} text={hobby.trim()} />
                                    ))}
                                </div>
                                <div className="text-xs text-gray-400 mb-1">PERSONALITY</div>
                                <div className="flex flex-wrap justify-center">
                                    {selectedCharacter.personality.split(",").map((trait) => (
                                        <Badge key={trait.trim()} text={trait.trim()} />
                                    ))}
                                </div>
                            </div>
                            <button
                                className="mt-4 sm:mt-6 bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-bold text-base sm:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
                                onClick={handleStartChat}
                                disabled={creatingChat}
                            >
                                {creatingChat ? (
                                    <>
                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                        Creating Chat...
                                    </>
                                ) : (
                                    "Start Chat"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 sm:mt-8 gap-2">
                <button
                    className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg bg-[#23232b] text-gray-300 hover:bg-[#252525] transition-all disabled:opacity-40 text-sm sm:text-base"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Previous
                </button>
                {step < 5 && (
                    <button
                        className="flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-bold text-sm sm:text-base"
                        onClick={() => setStep((s) => Math.min(5, s + 1))}
                        disabled={!selectedCharacter}
                    >
                        Next <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
