"use client";

import { useState, useEffect } from "react";
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { getCharacters, type Character } from "@/lib/characters";
import { createClient } from "@/utils/supabase/client";

const steps = [
    { label: "Choose Style" },
    { label: "Select Model" },
    { label: "Age" },
    { label: "Body Type" },
    { label: "Ethnicity" },
    { label: "Hair Style" },
    { label: "Hair Length" },
    { label: "Hair Color" },
    { label: "Eye Color" },
    { label: "Eye Shape" },
    { label: "Lip Shape" },
    { label: "Face Shape" },
    { label: "Hips" },
    { label: "Bust" },
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
                    return <div key={`ellipsis-${i}`} className="flex-1 text-center text-gray-500">...</div>;
                }
                const actualIndex = steps.findIndex(st => st.label === s.label);
                return (
                    <div key={`step-${actualIndex}-${i}`} className="flex-1 flex flex-col items-center min-w-[60px] sm:min-w-[80px]">
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
    imageUrl,
    loading,
    selected, 
    onClick 
}: { 
    emoji: string; 
    label: string; 
    description?: string;
    imageUrl?: string;
    loading?: boolean;
    selected: boolean; 
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`
                relative cursor-pointer rounded-2xl overflow-hidden flex flex-col
                transition-all duration-300 hover:scale-105 border-2 min-w-[140px] max-w-[200px]
                ${selected 
                    ? 'border-primary bg-accent shadow-2xl scale-105' 
                    : 'border-[#23232b] bg-[#18181f] hover:border-primary/50'
                }
            `}
        >
            {selected && (
                <div className="absolute top-2 right-2 z-10">
                    <CheckCircle className="w-6 h-6 text-primary bg-black/50 rounded-full p-0.5" />
                </div>
            )}
            
            {/* Image or Loading Spinner */}
            {loading ? (
                <div className="w-full h-40 bg-[#23232b] flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-xs text-gray-400">Generating image...</span>
                    <span className="text-[10px] text-gray-500">First time may take 20s</span>
                </div>
            ) : !imageUrl ? (
                <div className="w-full h-40 bg-[#23232b] flex flex-col items-center justify-center gap-2">
                    <div className="text-4xl">{emoji}</div>
                    <span className="text-xs text-gray-400">Tap to select</span>
                </div>
            ) : (
                <div className="relative w-full h-40 bg-[#0a0a0a]">
                    <img 
                        src={imageUrl} 
                        alt={label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Show emoji fallback on error
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                        }}
                    />
                    <div className="hidden w-full h-40 absolute top-0 left-0 bg-[#23232b] flex-col items-center justify-center gap-2">
                        <div className="text-4xl">{emoji}</div>
                        <div className="text-xs text-gray-400 px-2 text-center">{label}</div>
                    </div>
                </div>
            )}
            
            {/* Label and Description */}
            <div className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div className={`text-sm sm:text-base font-semibold mb-1 ${selected ? 'text-primary' : 'text-white'}`}>
                    {label}
                </div>
                {description && (
                    <div className="text-xs text-gray-400 line-clamp-2">
                        {description}
                    </div>
                )}
            </div>
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
    const [generatingCharacter, setGeneratingCharacter] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [showMore, setShowMore] = useState(false);
    const [customName, setCustomName] = useState("");
    const router = useRouter();
    const { user } = useAuth();
    
    // Enhanced customization state
    const [customization, setCustomization] = useState({
        age: '',
        body: '',
        ethnicity: '',
        hair_style: '',
        hair_length: '',
        hair_color: '',
        eye_color: '',
        eye_shape: '',
        lip_shape: '',
        face_shape: '',
        hips: '',
        bust: '',
        language: '',
        relationship: '',
        occupation: '',
        hobbies: [] as string[],
        personality: [] as string[],
    });

    // State for loading attribute images
    const [attributeImages, setAttributeImages] = useState<Record<string, string>>({});
    const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

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

    // Load images for a specific category (IN PARALLEL for speed)
    const loadCategoryImages = async (category: string, values: string[]) => {
        console.log(`🖼️ Loading images for ${category}, style: ${style}, values:`, values);
        
        // Mark all as loading immediately
        const keysToLoad = values
            .filter(value => {
                const key = `${category}-${value}-${style}`;
                return !attributeImages[key] && !imageLoading[key];
            })
            .map(value => `${category}-${value}-${style}`);
        
        if (keysToLoad.length === 0) {
            console.log(`⏭️ All images already loaded for ${category}`);
            return;
        }

        // Set all to loading state at once
        const loadingUpdate: Record<string, boolean> = {};
        keysToLoad.forEach(key => { loadingUpdate[key] = true; });
        setImageLoading(prev => ({ ...prev, ...loadingUpdate }));

        // Load ALL images in PARALLEL (not sequential)
        const promises = values.map(async (value) => {
            const key = `${category}-${value}-${style}`;
            
            // Skip if already loaded
            if (attributeImages[key]) {
                return;
            }

            try {
                // Force female-only attribute images (adds gender param so server-side prompt/service can prefer women)
                const url = `/api/attribute-images?category=${category}&value=${encodeURIComponent(value)}&style=${style}&gender=female`;
                console.log(`📡 Fetching: ${url}`);
                
                const response = await fetch(url, { priority: 'high' });
                const data = await response.json();
                
                console.log(`📦 Response for ${key}:`, data.success ? '✅' : '❌', data.image_url ? data.image_url.substring(0, 60) + '...' : 'no URL');
                
                if (response.ok && data.success && data.image_url) {
                    setAttributeImages(prev => ({ ...prev, [key]: data.image_url }));
                    console.log(`✅ Loaded image for ${key}`);
                } else {
                    console.warn(`❌ Failed to load ${key}:`, data);
                }
            } catch (error) {
                console.error(`💥 Error loading image for ${category}:${value}`, error);
            } finally {
                setImageLoading(prev => ({ ...prev, [key]: false }));
            }
        });

        // Wait for all to complete
        await Promise.all(promises);
        console.log(`✅ All images loaded for ${category}`);
    };

    // Preload images when step changes
    useEffect(() => {
        if (step === 2) {
            // Load age images
            loadCategoryImages('age', ageOptions.map(o => o.value));
        } else if (step === 3) {
            // Load body images
            loadCategoryImages('body', bodyOptions.map(o => o.value));
        } else if (step === 4) {
            // Load ethnicity images
            loadCategoryImages('ethnicity', ethnicityOptions.map(o => o.value));
        } else if (step === 5) {
            // Load hair style images
            loadCategoryImages('hair_style', hairStyleOptions.map(o => o.value));
        } else if (step === 6) {
            // Load hair length images
            loadCategoryImages('hair_length', hairLengthOptions.map(o => o.value));
        } else if (step === 7) {
            // Load hair color images
            loadCategoryImages('hair_color', hairColorOptions.map(o => o.value));
        } else if (step === 8) {
            // Load eye color images
            loadCategoryImages('eye_color', eyeColorOptions.map(o => o.value));
        } else if (step === 9) {
            // Load eye shape images
            loadCategoryImages('eye_shape', eyeShapeOptions.map(o => o.value));
        } else if (step === 10) {
            // Load lip shape images
            loadCategoryImages('lip_shape', lipShapeOptions.map(o => o.value));
        } else if (step === 11) {
            // Load face shape images
            loadCategoryImages('face_shape', faceShapeOptions.map(o => o.value));
        } else if (step === 12) {
            // Load hips images
            loadCategoryImages('hips', hipsOptions.map(o => o.value));
        } else if (step === 13) {
            // Load bust images
            loadCategoryImages('bust', bustOptions.map(o => o.value));
        } else if (step === 14) {
            // Load language images
            loadCategoryImages('language', languageOptions.map(o => o.value));
        } else if (step === 15) {
            // Load relationship images
            loadCategoryImages('relationship', relationshipOptions.map(o => o.value));
        } else if (step === 16) {
            // Load occupation images
            loadCategoryImages('occupation', occupationOptions.map(o => o.value));
        } else if (step === 17) {
            // Load hobbies images
            loadCategoryImages('hobbies', hobbiesOptions.map(o => o.value));
        } else if (step === 18) {
            // Load personality images
            loadCategoryImages('personality', personalityOptions.map(o => o.value));
        }
    }, [step, style]);

    // Age options with detailed descriptions
    const ageOptions = [
        { value: '18-19', label: '18-19', emoji: '🌸', description: 'Very youthful, fresh-faced, playful and energetic' },
        { value: '20s', label: '20s', emoji: '✨', description: 'Vibrant, fit, adventurous with youthful maturity' },
        { value: '30s', label: '30s', emoji: '💫', description: 'Confident, balanced, mature and self-assured' },
        { value: '40s', label: '40s', emoji: '🌟', description: 'Sophisticated, experienced, confident adult presence' },
        { value: '50s', label: '50s', emoji: '👑', description: 'Mature, refined with life experience and charisma' },
        { value: '60s', label: '60s', emoji: '💎', description: 'Distinguished, wise, gracefully aging' },
        { value: '70+', label: '70+', emoji: '🏆', description: 'Deeply mature with wisdom and character' },
    ];

    // Body type options with detailed descriptions
    const bodyOptions = [
        { value: 'Muscular', label: 'Muscular', emoji: '💪', description: 'Defined and strong, emphasizing power' },
        { value: 'Athletic', label: 'Athletic', emoji: '🏃', description: 'Lean and toned, agile and balanced' },
        { value: 'Slim', label: 'Slim', emoji: '🌿', description: 'Slender and light, elegant charm' },
        { value: 'Chubby', label: 'Chubby', emoji: '🐻', description: 'Soft and full, warm and approachable' },
        { value: 'Cub', label: 'Cub', emoji: '🧸', description: 'Youthful yet stocky, playful strength' },
        { value: 'Average', label: 'Average', emoji: '⭐', description: 'Natural and relatable, everyday realism' },
        { value: 'Curvy', label: 'Curvy', emoji: '🌺', description: 'Hourglass figure, full feminine proportions' },
    ];

    // Ethnicity options with detailed descriptions
    const ethnicityOptions = [
        { value: 'Caucasian', label: 'Caucasian', emoji: '👱', description: 'Lighter skin tones, sharper facial structure' },
        { value: 'Asian', label: 'Asian', emoji: '🇯🇵', description: 'Fair to golden skin, softer oval face' },
        { value: 'Arab', label: 'Arab', emoji: '🕌', description: 'Olive to light brown skin, defined features' },
        { value: 'Indian', label: 'Indian', emoji: '🇮🇳', description: 'Medium to deep brown skin, symmetrical features' },
        { value: 'Latina', label: 'Latina', emoji: '🌎', description: 'Warm tan to light brown, vibrant features' },
        { value: 'African', label: 'African', emoji: '🌍', description: 'Deep brown to dark skin, bold features' },
        { value: 'Mixed', label: 'Mixed', emoji: '🌈', description: 'Blended skin tones, unique facial harmony' },
    ];

    // Hair Style options
    const hairStyleOptions = [
        { value: 'Straight', label: 'Straight', emoji: '💇', description: 'Sleek, smooth straight hair' },
        { value: 'Wavy', label: 'Wavy', emoji: '〰️', description: 'Natural soft waves' },
        { value: 'Curly', label: 'Curly', emoji: '🌀', description: 'Bouncy spiral curls' },
        { value: 'Coily', label: 'Coily', emoji: '🔄', description: 'Natural coiled afro texture' },
        { value: 'Braided', label: 'Braided', emoji: '🪢', description: 'Intricate braided style' },
        { value: 'Bun', label: 'Bun', emoji: '⭕', description: 'Elegant updo bun' },
        { value: 'Ponytail', label: 'Ponytail', emoji: '🎀', description: 'Classic pulled-back ponytail' },
        { value: 'Bob', label: 'Bob', emoji: '✂️', description: 'Chin-length bob cut' },
    ];

    // Hair Length options
    const hairLengthOptions = [
        { value: 'Bald', label: 'Bald', emoji: '⚪', description: 'Completely shaved head' },
        { value: 'Buzz Cut', label: 'Buzz Cut', emoji: '✂️', description: 'Very short cropped' },
        { value: 'Short', label: 'Short', emoji: '👤', description: 'Ear-length or pixie cut' },
        { value: 'Shoulder', label: 'Shoulder', emoji: '👩', description: 'Shoulder-length hair' },
        { value: 'Mid-Back', label: 'Mid-Back', emoji: '💁', description: 'Mid-back length' },
        { value: 'Waist', label: 'Waist', emoji: '🧚', description: 'Waist-length hair' },
        { value: 'Hip', label: 'Hip', emoji: '👸', description: 'Hip-length hair' },
        { value: 'Floor', label: 'Floor', emoji: '🦄', description: 'Floor-length rapunzel hair' },
    ];

    // Hair Color options
    const hairColorOptions = [
        { value: 'Black', label: 'Black', emoji: '⬛', description: 'Deep jet black' },
        { value: 'Dark Brown', label: 'Dark Brown', emoji: '🟫', description: 'Rich chocolate brown' },
        { value: 'Brown', label: 'Brown', emoji: '🤎', description: 'Natural brown' },
        { value: 'Light Brown', label: 'Light Brown', emoji: '🟤', description: 'Caramel light brown' },
        { value: 'Blonde', label: 'Blonde', emoji: '💛', description: 'Golden blonde' },
        { value: 'Platinum', label: 'Platinum', emoji: '🤍', description: 'Icy platinum blonde' },
        { value: 'Red', label: 'Red', emoji: '🔴', description: 'Vibrant red/ginger' },
        { value: 'Auburn', label: 'Auburn', emoji: '🧡', description: 'Reddish-brown auburn' },
        { value: 'Gray', label: 'Gray', emoji: '⚪', description: 'Silver gray' },
        { value: 'White', label: 'White', emoji: '⚪', description: 'Pure white' },
    ];

    // Eye Color options
    const eyeColorOptions = [
        { value: 'Brown', label: 'Brown', emoji: '🤎', description: 'Warm brown eyes' },
        { value: 'Dark Brown', label: 'Dark Brown', emoji: '🟫', description: 'Deep dark brown' },
        { value: 'Amber', label: 'Amber', emoji: '🟡', description: 'Golden amber' },
        { value: 'Hazel', label: 'Hazel', emoji: '🟢', description: 'Green-brown mix' },
        { value: 'Green', label: 'Green', emoji: '💚', description: 'Emerald green' },
        { value: 'Blue', label: 'Blue', emoji: '💙', description: 'Ocean blue' },
        { value: 'Light Blue', label: 'Light Blue', emoji: '🩵', description: 'Sky light blue' },
        { value: 'Gray', label: 'Gray', emoji: '🩶', description: 'Steel gray' },
        { value: 'Violet', label: 'Violet', emoji: '💜', description: 'Rare violet purple' },
        { value: 'Heterochromia', label: 'Heterochromia', emoji: '👁️', description: 'Two different colors' },
    ];

    // Eye Shape options
    const eyeShapeOptions = [
        { value: 'Almond', label: 'Almond', emoji: '👁️', description: 'Classic almond shape' },
        { value: 'Round', label: 'Round', emoji: '⭕', description: 'Large round doe eyes' },
        { value: 'Hooded', label: 'Hooded', emoji: '🌙', description: 'Hooded eyelids' },
        { value: 'Monolid', label: 'Monolid', emoji: '➖', description: 'Smooth monolid' },
        { value: 'Upturned', label: 'Upturned', emoji: '↗️', description: 'Cat-eye upturned' },
        { value: 'Downturned', label: 'Downturned', emoji: '↘️', description: 'Soft downturned' },
        { value: 'Close-Set', label: 'Close-Set', emoji: '👀', description: 'Eyes closer together' },
        { value: 'Wide-Set', label: 'Wide-Set', emoji: '👁️👁️', description: 'Eyes far apart' },
        { value: 'Deep-Set', label: 'Deep-Set', emoji: '🕳️', description: 'Deep-set recessed' },
        { value: 'Prominent', label: 'Prominent', emoji: '👀', description: 'Protruding prominent' },
    ];

    // Lip Shape options
    const lipShapeOptions = [
        { value: 'Full', label: 'Full', emoji: '💋', description: 'Plump voluptuous lips' },
        { value: 'Thin', label: 'Thin', emoji: '➖', description: 'Delicate thin lips' },
        { value: 'Heart-Shaped', label: 'Heart-Shaped', emoji: '💗', description: 'Pronounced cupids bow' },
        { value: 'Bow-Shaped', label: 'Bow-Shaped', emoji: '🎀', description: 'Dramatic bow shape' },
        { value: 'Round', label: 'Round', emoji: '⭕', description: 'Soft rounded lips' },
        { value: 'Wide', label: 'Wide', emoji: '↔️', description: 'Broad wide mouth' },
        { value: 'Heavy Bottom', label: 'Heavy Bottom', emoji: '⬇️', description: 'Full bottom lip' },
        { value: 'Heavy Top', label: 'Heavy Top', emoji: '⬆️', description: 'Full upper lip' },
        { value: 'Downturned', label: 'Downturned', emoji: '☹️', description: 'Corners angle down' },
        { value: 'Upturned', label: 'Upturned', emoji: '🙂', description: 'Natural smile shape' },
    ];

    // Face Shape options
    const faceShapeOptions = [
        { value: 'Oval', label: 'Oval', emoji: '🥚', description: 'Classic balanced oval' },
        { value: 'Round', label: 'Round', emoji: '⭕', description: 'Full round face' },
        { value: 'Square', label: 'Square', emoji: '⬜', description: 'Strong angular jaw' },
        { value: 'Heart', label: 'Heart', emoji: '💗', description: 'Wide forehead, pointed chin' },
        { value: 'Diamond', label: 'Diamond', emoji: '💎', description: 'Wide cheekbones' },
        { value: 'Triangle', label: 'Triangle', emoji: '🔺', description: 'Narrow forehead, wide jaw' },
        { value: 'Oblong', label: 'Oblong', emoji: '▬', description: 'Long narrow face' },
        { value: 'Rectangle', label: 'Rectangle', emoji: '▭', description: 'Long with angular jaw' },
        { value: 'Pear', label: 'Pear', emoji: '🍐', description: 'Small forehead, rounded jaw' },
        { value: 'Long', label: 'Long', emoji: '📏', description: 'Vertically elongated' },
    ];

    // Hips options
    const hipsOptions = [
        { value: 'Narrow', label: 'Narrow', emoji: '⬜', description: 'Slim straight hips' },
        { value: 'Moderate', label: 'Moderate', emoji: '▭', description: 'Balanced average width' },
        { value: 'Wide', label: 'Wide', emoji: '↔️', description: 'Broad pronounced hips' },
        { value: 'Pear', label: 'Pear', emoji: '🍐', description: 'Hips wider than shoulders' },
        { value: 'Hip Dips', label: 'Hip Dips', emoji: '〰️', description: 'Natural hip indentations' },
        { value: 'Round Hips', label: 'Round Hips', emoji: '⭕', description: 'Smooth rounded curve' },
    ];

    // Bust options
    const bustOptions = [
        { value: 'Petite', label: 'Petite', emoji: '🌸', description: 'Small delicate A-B cup' },
        { value: 'Small', label: 'Small', emoji: '🌼', description: 'Modest B-C cup' },
        { value: 'Medium', label: 'Medium', emoji: '🌻', description: 'Average C-D cup' },
        { value: 'Full', label: 'Full', emoji: '🌺', description: 'Fuller D-E cup' },
        { value: 'Large', label: 'Large', emoji: '🌷', description: 'Large E-F cup' },
        { value: 'Very Large', label: 'Very Large', emoji: '🌹', description: 'Very large F+ cup' },
    ];

    // AGGRESSIVE PRELOADING: Load ALL attribute images immediately when component mounts
    useEffect(() => {
        const startPreload = async () => {
            console.log('🚀 AGGRESSIVE PRELOAD: Loading all attribute images in parallel...');
            
            // Define all categories with their values - DO NOT TRANSFORM VALUES
            const allCategories = [
                { category: 'age', values: ageOptions.map(o => o.value) },
                { category: 'body', values: bodyOptions.map(o => o.value) },
                { category: 'ethnicity', values: ethnicityOptions.map(o => o.value) },
                { category: 'hair_style', values: hairStyleOptions.map(o => o.value) },
                { category: 'hair_length', values: hairLengthOptions.map(o => o.value) },
                { category: 'hair_color', values: hairColorOptions.map(o => o.value) },
                { category: 'eye_color', values: eyeColorOptions.map(o => o.value) },
                { category: 'eye_shape', values: eyeShapeOptions.map(o => o.value) },
                { category: 'lip_shape', values: lipShapeOptions.map(o => o.value) },
                { category: 'face_shape', values: faceShapeOptions.map(o => o.value) },
                { category: 'hips', values: hipsOptions.map(o => o.value) },
                { category: 'bust', values: bustOptions.map(o => o.value) },
            ];

            // Load all categories in parallel
            const preloadPromises = allCategories.map(({ category, values }) =>
                loadCategoryImages(category, values).catch(e => console.error(`Failed to preload ${category}:`, e))
            );

            try {
                await Promise.all(preloadPromises);
                console.log('✅ PRELOAD COMPLETE: All attribute images cached and ready!');
            } catch (error) {
                console.error('Error during preload:', error);
            }
        };

        // Start preload after a tiny delay to not block render
        const preloadTimer = setTimeout(startPreload, 100);
        return () => clearTimeout(preloadTimer);
    }, [style]); // Reload when style changes

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
        console.log(`🎯 setSingleSelect called: ${key} = ${value}`);
        if (key === 'hobbies' || key === 'personality') {
            console.log(`⚠️ Skipping ${key} (multi-select)`);
            return;
        }
        setCustomization(prev => {
            const updated = { ...prev, [key]: value };
            console.log(`✅ Updated customization:`, updated);
            return updated;
        });
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
    // Generate custom character image based on all customizations
    async function handleGenerateCharacter() {
        if (!customization.age || !customization.body) {
            alert("Please complete your selections first");
            return;
        }

        setGeneratingCharacter(true);
        try {
            // Include a gender flag so the backend generation uses female-only prompts/images
            const response = await fetch('/api/generate-custom-character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    style,
                    gender: 'female',
                    ...customization,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate character image');
            }

            const data = await response.json();
            console.log('✅ Character generated:', data.image_url);
            setGeneratedImage(data.image_url);
        } catch (error) {
            console.error("Error generating character:", error);
            alert(error instanceof Error ? error.message : "Failed to generate character image. Please try again.");
        } finally {
            setGeneratingCharacter(false);
        }
    }

    // Start chat with selected character
    function handleStartChat() {
        if (!selectedCharacter) {
            return;
        }

        if (!user) {
            router.push("/login");
            return;
        }

        if (generatedImage) {
            setCreatingChat(true);
            
            try {
                const customCharacterId = `custom-${Date.now()}-${selectedCharacter.id}`;
                
                // Build a description from customization
                const customDescription = [
                    customization.age && `${customization.age} year old`,
                    customization.ethnicity,
                    customization.body,
                ].filter(Boolean).join(', ');
                
                const customCharacterData = {
                    id: customCharacterId,
                    name: customName || selectedCharacter.name,
                    age: customization.age,
                    image: generatedImage, // Use generated image
                    description: customDescription || selectedCharacter.description,
                    personality: customization.personality.join(', ') || selectedCharacter.personality,
                    occupation: customization.occupation || selectedCharacter.occupation,
                    hobbies: customization.hobbies.join(', ') || selectedCharacter.hobbies,
                    body: customization.body,
                    ethnicity: customization.ethnicity,
                    language: customization.language,
                    relationship: customization.relationship,
                    system_prompt: selectedCharacter.system_prompt,
                    character_type: 'custom',
                    is_new: true,
                    created_at: new Date().toISOString(),
                    // Store all customization data
                    customization: customization,
                    style: style,
                };
                
                localStorage.setItem(`character-${customCharacterId}`, JSON.stringify(customCharacterData));
                
                console.log("Custom character created with generated image:", customCharacterData);
                
                router.push(`/chat/${customCharacterId}`);
            } catch (error) {
                console.error("Error creating character:", error);
                alert("Failed to create character. Please try again.");
            } finally {
                setCreatingChat(false);
            }
        }
    }

    const canProceed = () => {
        let result = false;
        switch (step) {
            case 0: result = style !== null; break;
            case 1: result = selected !== null; break;
            case 2: result = customization.age !== ''; break;
            case 3: result = customization.body !== ''; break;
            case 4: result = customization.ethnicity !== ''; break;
            case 5: result = customization.hair_style !== ''; break;
            case 6: result = customization.hair_length !== ''; break;
            case 7: result = customization.hair_color !== ''; break;
            case 8: result = customization.eye_color !== ''; break;
            case 9: result = customization.eye_shape !== ''; break;
            case 10: result = customization.lip_shape !== ''; break;
            case 11: result = customization.face_shape !== ''; break;
            case 12: result = customization.hips !== ''; break;
            case 13: result = customization.bust !== ''; break;
            case 14: result = customization.language !== ''; break;
            case 15: result = customization.relationship !== ''; break;
            case 16: result = customization.occupation !== ''; break;
            case 17: result = customization.hobbies.length > 0; break;
            case 18: result = customization.personality.length > 0; break;
            default: result = true;
        }
        console.log(`🚦 canProceed(step ${step}):`, result, customization);
        return result;
    };

    return (
        <div className="max-w-xl md:max-w-5xl mx-auto mt-6 sm:mt-12 bg-[#18181f] rounded-2xl shadow-2xl p-4 sm:p-8 text-white font-sans">
            <ProgressBar step={step} />
            
            {/* Step 0: Choose Style (Realistic or Anime) */}
            {step === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Style</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">Select your preferred visual style</div>
                    
                    <div className="flex gap-6 justify-center items-start max-w-5xl w-full px-4">
                        {/* Realistic Style */}
                        <div
                            onClick={() => setStyle('realistic')}
                            className={`
                                relative cursor-pointer rounded-2xl overflow-hidden
                                transition-all duration-300 hover:scale-105 border-4
                                flex-1 max-w-[400px]
                                ${style === 'realistic'
                                    ? 'border-primary shadow-2xl scale-105' 
                                    : 'border-[#23232b] hover:border-primary/50'
                                }
                            `}
                        >
                            {style === 'realistic' && (
                                <div className="absolute top-4 right-4 z-10">
                                    <CheckCircle className="w-8 h-8 text-primary bg-black/50 rounded-full" />
                                </div>
                            )}
                            <img 
                                src="https://qfjptqdkthmejxpwbmvq.supabase.co/storage/v1/object/public/assets/style-images/realistic-style-1760711435220.jpg" 
                                alt="Realistic Style"
                                className="w-full h-[400px] sm:h-[480px] object-cover"
                                onError={(e) => {
                                    // Fallback gradient if image doesn't exist
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="hidden absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                <div className="text-xl sm:text-2xl font-bold text-white mb-2">Realistic</div>
                                <div className="text-sm text-gray-300">Lifelike and photorealistic AI companions</div>
                            </div>
                        </div>

                        {/* Anime Style */}
                        <div
                            onClick={() => setStyle('anime')}
                            className={`
                                relative cursor-pointer rounded-2xl overflow-hidden
                                transition-all duration-300 hover:scale-105 border-4
                                flex-1 max-w-[400px]
                                ${style === 'anime'
                                    ? 'border-primary shadow-2xl scale-105' 
                                    : 'border-[#23232b] hover:border-primary/50'
                                }
                            `}
                        >
                            {style === 'anime' && (
                                <div className="absolute top-4 right-4 z-10">
                                    <CheckCircle className="w-8 h-8 text-primary bg-black/50 rounded-full" />
                                </div>
                            )}
                            <img 
                                src="https://qfjptqdkthmejxpwbmvq.supabase.co/storage/v1/object/public/assets/style-images/anime-style-1760711453145.jpg" 
                                alt="Anime Style"
                                className="w-full h-[400px] sm:h-[480px] object-cover"
                                onError={(e) => {
                                    // Fallback gradient if image doesn't exist
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="hidden absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20" />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                <div className="text-xl sm:text-2xl font-bold text-white mb-2">Anime</div>
                                <div className="text-sm text-gray-300">Stylized anime and manga aesthetics</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 1: Select Base Character Model */}
            {step === 1 && (
                <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Your Base Model</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Select a starting template from our {style === 'anime' ? 'anime' : 'realistic'} collection
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

            {/* Step 2: Age */}
            {step === 2 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Age Range</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the age range that best represents your ideal avatar
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {ageOptions.map((option) => {
                            const imageKey = `age-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.age === option.value}
                                    onClick={() => setSingleSelect('age', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 3: Body Type */}
            {step === 3 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Body Type</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the physique that best represents your ideal avatar
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {bodyOptions.map((option) => {
                            const imageKey = `body-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.body === option.value}
                                    onClick={() => setSingleSelect('body', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 4: Ethnicity */}
            {step === 4 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Ethnicity</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Select the ethnicity that best matches your preference for an ultra-realistic avatar
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {ethnicityOptions.map((option) => {
                            const imageKey = `ethnicity-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.ethnicity === option.value}
                                    onClick={() => setSingleSelect('ethnicity', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 5: Hair Style */}
            {step === 5 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Hair Style</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the hair style that best suits your character
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {hairStyleOptions.map((option) => {
                            const imageKey = `hair_style-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.hair_style === option.value}
                                    onClick={() => setSingleSelect('hair_style', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 6: Hair Length */}
            {step === 6 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Hair Length</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the hair length for your character
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {hairLengthOptions.map((option) => {
                            const imageKey = `hair_length-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.hair_length === option.value}
                                    onClick={() => setSingleSelect('hair_length', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 7: Hair Color */}
            {step === 7 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Hair Color</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the hair color for your character
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {hairColorOptions.map((option) => {
                            const imageKey = `hair_color-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.hair_color === option.value}
                                    onClick={() => setSingleSelect('hair_color', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 8: Eye Color */}
            {step === 8 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Eye Color</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the eye color for your character
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {eyeColorOptions.map((option) => {
                            const imageKey = `eye_color-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.eye_color === option.value}
                                    onClick={() => setSingleSelect('eye_color', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 9: Eye Shape */}
            {step === 9 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Eye Shape</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the eye shape for your character
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {eyeShapeOptions.map((option) => {
                            const imageKey = `eye_shape-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.eye_shape === option.value}
                                    onClick={() => setSingleSelect('eye_shape', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 10: Lip Shape */}
            {step === 10 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Lip Shape</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the lip shape for your character
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {lipShapeOptions.map((option) => {
                            const imageKey = `lip_shape-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.lip_shape === option.value}
                                    onClick={() => setSingleSelect('lip_shape', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 11: Face Shape */}
            {step === 11 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Face Shape</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the face shape for your character
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {faceShapeOptions.map((option) => {
                            const imageKey = `face_shape-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.face_shape === option.value}
                                    onClick={() => setSingleSelect('face_shape', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 12: Hips */}
            {step === 12 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Hip Type</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the hip shape for your character
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {hipsOptions.map((option) => {
                            const imageKey = `hips-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.hips === option.value}
                                    onClick={() => setSingleSelect('hips', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 13: Bust */}
            {step === 13 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Select Bust Size</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">
                        Choose the bust size for your character
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-center max-w-5xl">
                        {bustOptions.map((option) => {
                            const imageKey = `bust-${option.value}-${style}`;
                            return (
                                <SelectionCard
                                    key={option.value}
                                    emoji={option.emoji}
                                    label={option.label}
                                    description={option.description}
                                    imageUrl={attributeImages[imageKey]}
                                    loading={imageLoading[imageKey]}
                                    selected={customization.bust === option.value}
                                    onClick={() => setSingleSelect('bust', option.value)}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 14: Language */}
            {step === 14 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Language</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">What language should they speak?</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
                        {languageOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description={option.description}
                                imageUrl={attributeImages[`language-${option.value}-${style}`]}
                                loading={imageLoading[`language-${option.value}-${style}`] ?? false}
                                selected={customization.language === option.value}
                                onClick={() => setSingleSelect('language', option.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Step 15: Relationship */}
            {step === 15 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Relationship Status</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">How should they approach relationships?</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
                        {relationshipOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description={option.description}
                                imageUrl={attributeImages[`relationship-${option.value}-${style}`]}
                                loading={imageLoading[`relationship-${option.value}-${style}`] ?? false}
                                selected={customization.relationship === option.value}
                                onClick={() => setSingleSelect('relationship', option.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Step 16: Occupation */}
            {step === 16 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Occupation</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-8">What do they do for a living?</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
                        {occupationOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description={option.description}
                                imageUrl={attributeImages[`occupation-${option.value}-${style}`]}
                                loading={imageLoading[`occupation-${option.value}-${style}`] ?? false}
                                selected={customization.occupation === option.value}
                                onClick={() => setSingleSelect('occupation', option.value)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Step 17: Hobbies */}
            {step === 17 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Hobbies</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-2">Select hobbies and interests</div>
                    <div className="text-xs text-gray-500 mb-8">(Select at least one)</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
                        {hobbiesOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description=""
                                imageUrl={attributeImages[`hobbies-${option.value}-${style}`]}
                                loading={imageLoading[`hobbies-${option.value}-${style}`] ?? false}
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

            {/* Step 18: Personality */}
            {step === 18 && (
                <div className="flex flex-col items-center min-h-[400px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">Choose Personality</div>
                    <div className="text-sm sm:text-base text-gray-400 mb-2">What personality traits should they have?</div>
                    <div className="text-xs text-gray-500 mb-8">(Select at least one)</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
                        {personalityOptions.map((option) => (
                            <SelectionCard
                                key={option.value}
                                emoji={option.emoji}
                                label={option.label}
                                description=""
                                imageUrl={attributeImages[`personality-${option.value}-${style}`]}
                                loading={imageLoading[`personality-${option.value}-${style}`] ?? false}
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

            {/* Step 19: Name & Final Preview */}
            {selectedCharacter && step === 19 && (
                <div className="flex flex-col items-center min-h-[300px]">
                    <div className="text-2xl sm:text-3xl font-bold mb-2">
                        {generatedImage ? "Review Your Character" : "Generate Your Character"}
                    </div>
                    <div className="text-sm sm:text-base text-gray-400 mb-6">
                        {generatedImage 
                            ? "Customize the name and start chatting!" 
                            : "Generate a unique character image based on your selections"}
                    </div>
                    
                    {generatedImage && (
                        <div className="mb-6 w-full max-w-md px-4">
                            <label className="block text-xs text-gray-400 mb-2">CHARACTER NAME</label>
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder={baseCharacter?.name || "Enter a name..."}
                                className="w-full px-4 py-3 rounded-lg bg-[#23232b] border border-[#252525] text-white placeholder-gray-500 focus:border-primary focus:outline-none text-base"
                            />
                        </div>
                    )}

                    <div className="bg-[#23232b] rounded-2xl p-6 sm:p-8 shadow-lg w-full max-w-md flex flex-col items-center">
                        {/* Generated Character Image or Loading */}
                        {generatedImage ? (
                            <img
                                src={generatedImage}
                                alt="Generated Character"
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mb-4 object-cover border-4 border-primary shadow-lg"
                            />
                        ) : (
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full mb-4 bg-[#18181f] border-4 border-primary/20 flex items-center justify-center">
                                <Loader2 className={`w-8 h-8 ${generatingCharacter ? 'animate-spin' : ''} text-primary`} />
                            </div>
                        )}
                        
                        <div className="text-2xl sm:text-3xl font-bold mb-2">
                            {generatedImage ? (customName || "Your Character") : "Generating..."}
                        </div>
                        <div className="text-xs text-gray-400 mb-4 text-center">
                            {generatedImage 
                                ? `${customization.age} • ${customization.ethnicity} • ${customization.body}` 
                                : "Creating your perfect character..."}
                        </div>
                        
                        {generatedImage && (
                            <>
                                <div className="w-full space-y-2 text-sm mb-4">
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
                            </>
                        )}

                        {/* Generate Button */}
                        {!generatedImage && (
                            <button
                                className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                                onClick={handleGenerateCharacter}
                                disabled={generatingCharacter}
                            >
                                {generatingCharacter ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating Image...
                                    </>
                                ) : (
                                    <>
                                        ✨ Generate Character
                                    </>
                                )}
                            </button>
                        )}

                        {/* Start Chat Button */}
                        {generatedImage && (
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
                                    "💬 Start Chat"
                                )}
                            </button>
                        )}
                    </div>

                    {generatedImage && (
                        <button
                            className="mt-4 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                            onClick={() => {
                                setGeneratedImage(null);
                                setCustomName("");
                            }}
                        >
                            ↻ Generate Different Character
                        </button>
                    )}
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
                {step < steps.length - 1 && (
                    <button
                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-bold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                        disabled={!canProceed()}
                    >
                        Next <ChevronRight className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}



