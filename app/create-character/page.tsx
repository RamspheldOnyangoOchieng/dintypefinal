"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import { useAuthModal } from "@/components/auth-modal-context";
import { PremiumUpgradeModal } from "@/components/premium-upgrade-modal";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Sparkles,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    User,
    Calendar,
    Eye,
    Heart,
    Info,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserTokenBalance } from "@/components/user-token-balance";

export default function CreateCharacterPage() {
    const searchParams = useSearchParams();
    const gender = searchParams.get('gender') || 'lady'; // Default to 'lady' if not specified

    const totalSteps = gender === 'lady' ? 8 : 5; // Re-indexed for lady: 0-Ethnicity/Age, 1-Eyes, 2-Hair, 3-Body, 4-Personality, 5-Relationship, 6-Summary, 7-Generation

    const [currentStep, setCurrentStep] = useState(0);
    const [selectedStyle, setSelectedStyle] = useState<'realistic' | 'anime'>('realistic'); // Default to realistic
    const [selectedEthnicity, setSelectedEthnicity] = useState<string | null>(null);
    const [selectedAge, setSelectedAge] = useState<number>(25); // Default age 25
    const [selectedEyeColor, setSelectedEyeColor] = useState<string | null>(null);
    const [selectedEyeShape, setSelectedEyeShape] = useState<string | null>(null);
    const [selectedHairStyle, setSelectedHairStyle] = useState<string | null>(null);
    const [selectedHairColor, setSelectedHairColor] = useState<string | null>(null);
    const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);
    const [selectedBreastSize, setSelectedBreastSize] = useState<string | null>(null);
    const [selectedButtSize, setSelectedButtSize] = useState<string | null>(null);
    const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);
    const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);
    const [selectedOutfit, setSelectedOutfit] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
    const [showImage, setShowImage] = useState(false);
    const [characterName, setCharacterName] = useState("");
    const [characterDescription, setCharacterDescription] = useState("");
    const [promptTemplate, setPromptTemplate] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [maleImages, setMaleImages] = useState<{ [key: string]: { [key: string]: { [key: string]: string } } }>({});
    const [isLoadingMaleImages, setIsLoadingMaleImages] = useState(false);
    const [femaleImages, setFemaleImages] = useState<{ [key: string]: { [key: string]: { [key: string]: string } } }>({});
    const [isLoadingFemaleImages, setIsLoadingFemaleImages] = useState(false);
    const [showNameDialog, setShowNameDialog] = useState(false);
    const [errorModal, setErrorModal] = useState({ isOpen: false, title: "", message: "" });
    const [memoryLevel, setMemoryLevel] = useState(1); // 1 = standard, 2 = enhanced, 3 = maximum

    const supabase = createClient();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { openLoginModal } = useAuthModal();
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [showTokensDepletedModal, setShowTokensDepletedModal] = useState(false);
    const [showExpiredModal, setShowExpiredModal] = useState(false);

    // Initial check for authentication
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                openLoginModal();
                router.push('/my-ai');
            }
        }
    }, [user, authLoading]);

    // Load female images from database when gender is 'lady'
    useEffect(() => {
        if (gender === 'lady' && Object.keys(femaleImages).length === 0 && !isLoadingFemaleImages) {
            console.log('🔄 Starting to load female images from attribute_images...');
            loadFemaleImages();
        }
    }, [gender]);

    const loadFemaleImages = async () => {
        setIsLoadingFemaleImages(true);
        try {
            const { data, error } = await supabase
                .from('attribute_images')
                .select('*');

            if (error) throw error;

            console.log(`📥 Loaded ${data?.length} female personality/relationship images from database`);

            // Organize images by category -> style -> value
            const organized: { [key: string]: { [key: string]: { [key: string]: string } } } = {};

            data?.forEach((img: any) => {
                if (!organized[img.category]) {
                    organized[img.category] = {};
                }
                if (!organized[img.category][img.style]) {
                    organized[img.category][img.style] = {};
                }
                // Normalize the key: lowercase and replace spaces with hyphens
                const normalizedKey = img.value.toLowerCase().replace(/\s+/g, '-');
                organized[img.category][img.style][normalizedKey] = img.image_url;
            });

            setFemaleImages(organized);
            console.log('✅ Female images organized:', {
                personality: organized.personality ? Object.keys(organized.personality) : [],
                relationship: organized.relationship ? Object.keys(organized.relationship) : []
            });
        } catch (error) {
            console.error('❌ Error loading female images:', error);
            setFemaleImages({});
        } finally {
            setIsLoadingFemaleImages(false);
        }
    };

    // Load male images from database when gender is 'gent'
    useEffect(() => {
        if (gender === 'gent' && Object.keys(maleImages).length === 0 && !isLoadingMaleImages) {
            console.log('🔄 Starting to load male images...');
            loadMaleImages();
        }
    }, [gender]);

    const loadMaleImages = async () => {
        setIsLoadingMaleImages(true);
        try {
            const { data, error } = await supabase
                .from('male_attribute_images')
                .select('*');

            if (error) throw error;

            console.log(`📥 Loaded ${data?.length} male images from database`);

            // Organize images by category -> style -> value
            const organized: { [key: string]: { [key: string]: { [key: string]: string } } } = {};

            data?.forEach((img: any) => {
                if (!organized[img.category]) {
                    organized[img.category] = {};
                }
                if (!organized[img.category][img.style]) {
                    organized[img.category][img.style] = {};
                }
                // Normalize the key: lowercase and replace spaces with hyphens
                const normalizedKey = img.value.toLowerCase().replace(/\s+/g, '-');
                organized[img.category][img.style][normalizedKey] = img.image_url;
            });

            setMaleImages(organized);
            console.log('✅ Male images organized by category:', {
                bodyType: organized.bodyType ? Object.keys(organized.bodyType) : [],
                personality: organized.personality ? Object.keys(organized.personality) : [],
                relationship: organized.relationship ? Object.keys(organized.relationship) : []
            });
            console.log('✅ Male images state updated, total categories:', Object.keys(organized).length);
        } catch (error) {
            console.error('❌ Error loading male images:', error);
            // Set empty structures so the UI doesn't break
            setMaleImages({
                bodyType: { realistic: {}, anime: {} },
                personality: { realistic: {}, anime: {} },
                relationship: { realistic: {}, anime: {} }
            });
        } finally {
            setIsLoadingMaleImages(false);
        }
    };

    // Helper function to get local image URL from public directory
    const getImageUrl = (categoryName: string, optionKey: string, fallbackUrl: string) => {
        const defaultPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect width="200" height="300" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23666" font-family="Arial" font-size="16"%3ELoading...%3C/text%3E%3C/svg%3E';

        if (!selectedStyle) return fallbackUrl || defaultPlaceholder;

        // Complete mapping of all available images with their exact filenames
        // Separate imageMap for female (lady) and male (gent) characters
        // Complete mapping of all available images with their exact filenames
        // Separate imageMap for female (lady) and male (gent) characters
        const femaleImageMap: any = {
            'style': {
                'realistic': '/character creation/choose style/realistic.jpg',
                'anime': '/character creation/choose style/Anime.jpg'
            },
            'ethnicity': {
                'realistic': {
                    'caucasian': '/character creation/Ethnicity/realistic/caucasian-3a46e91357800f7a540500d0115fe6364650b7a1d9e42673061b670fc226464d.webp',
                    'latina': '/character creation/Ethnicity/realistic/latina-9f20e7d69703c6489122ac5b69865ac1252a7527c4509522f5d8df717067d1a6.webp',
                    'asian': '/character creation/Ethnicity/realistic/asian-45e23043a3b83e0bcffb1cf30a17f0c8d41f551616b930b11591e97cadfdde29.webp',
                    'african': '/character creation/Ethnicity/realistic/black_afro-3221c8246e818f77797a50c83fca1f39767780b709deeb661cb80041b5fcc4c5.webp',
                    'indian': '/character creation/Ethnicity/realistic/arab-29d6da7f90a7a14b34f080498a9996712ee80d3d5dfb6f9d7ce39be0e6b9922a.webp'
                },
                'anime': {
                    'caucasian': '/character creation/Ethnicity/anime/caucasian-6eeb84a8a1286e6e0cbd3481004ed75ff16d47953e68bb5ae73986c071ce155d.webp',
                    'latina': '/character creation/Ethnicity/anime/latina-39821dee40be7e96ee5c45de9390693cd9f748e0980f96b052f77fff6236c4aa.webp',
                    'asian': '/character creation/Ethnicity/anime/asian-35657a499bbd78c20435391d54af8427ad0cd23a343ae42da1125a2737e8d3ad.webp',
                    'african': '/character creation/Ethnicity/anime/black_afro-4a8e68d341b244c2d3bffeb7ba7eaf2a1b8b1cef409e7fda0dfac37ad5149553.webp',
                    'indian': '/character creation/Ethnicity/anime/arab-271d55b6f7bf8cbdcc323c3cde06d9267cd5f92d12ab5cb7a06bdc5824347f54.webp'
                }
            },
            'eyeColor': {
                'realistic': {
                    'brown': '/character creation/eye  color/realistic/brown-9dbba1bb37191cf2fc0d0fd3f2c118277e3f1c257a66a870484739fa1bd33c42.webp',
                    'blue': '/character creation/eye  color/realistic/blue-f7e75e814204c4d8464d36f525b0f6e9191557a585cb4be01e91ca8eb45416d0.webp',
                    'green': '/character creation/eye  color/realistic/green-8a705cc5c2c435ac0f7addd110f4dd2b883a2e35b6403659c3e30cc7a741359c.webp',
                    'hazel': 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766906815/attribute-images/eyeColor/eyeColor_hazel_realistic_1766906813010.jpg',
                    'grey': 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766906820/attribute-images/eyeColor/eyeColor_grey_realistic_1766906818815.jpg'
                },
                'anime': {
                    'brown': '/character creation/eye  color/anime/brown-9dbba1bb37191cf2fc0d0fd3f2c118277e3f1c257a66a870484739fa1bd33c42.webp',
                    'blue': '/character creation/eye  color/anime/blue-f7e75e814204c4d8464d36f525b0f6e9191557a585cb4be01e91ca8eb45416d0.webp',
                    'green': '/character creation/eye  color/anime/green-8a705cc5c2c435ac0f7addd110f4dd2b883a2e35b6403659c3e30cc7a741359c.webp',
                    'red': '/character creation/eye  color/anime/red-ff81c2e205a08d9a80fbd8f8773296a6f842690c19c8a1db4f8b3aeccd380327.webp',
                    'yellow': '/character creation/eye  color/anime/yellow-9799b66b14a68e561a20597361141f24f886d68d84b0f6c8735ac2ea69ff486f.webp'
                }
            },
            'hairStyle': {
                'realistic': {
                    'straight': '/character creation/hair styles/realistic/straight-50860930cc288e0be0fef427289870b6d421a4eba489ec04600fd0b3b1b32826.webp',
                    'short': '/character creation/hair styles/realistic/short-f0217dbf9ddb599d1d7ceff342e1a9b846f4ea5c083e66630dbeff55ce574691.webp',
                    'long': '/character creation/hair styles/realistic/long-eb817bef0e59709224eaea96296f33b260b2574a6fc10a5a1f10bfcd5dffb9cd.webp',
                    'curly': '/character creation/hair styles/realistic/curly-4110486ba90646770e43e75e045c0cd9db53fcec28cadbc0222985bdf39d3cea.webp',
                    'bangs': '/character creation/hair styles/realistic/bangs-c696685cde2cdd4b88d2c80cd8bd71a1d62d94348a840e2ff3ec2b974f1b9e75.webp',
                    'bun': '/character creation/hair styles/realistic/bun-93b58d32131d1905f6654d992d20bad3adc798ced8e028d89274aac1d7743885.webp'
                },
                'anime': {
                    'straight': '/character creation/hair styles/anime/straight-44d31e24433b284d0806280c7a6969506c1bc6047264f2ec3efae3363f9191cd.webp',
                    'short': '/character creation/hair styles/anime/short-ea46bfb17c34dcc6ec64e6e138314c617e700cf4e74c41135cb22e30b82a0fe5.webp',
                    'long': '/character creation/hair styles/anime/long-f64056f0882ec6947312a4ea4336c22ddc15afa3f4c617d6b028a6751f633fa0.webp',
                    'curly': '/character creation/hair styles/anime/curly-f8fc6f08fcccf0e54034efc8b891c196e376cdd51ebbe29a3c9be66be4c3042f.webp',
                    'bangs': '/character creation/hair styles/anime/bangs-eee819dbe88b63bcfd3fefdb0d024770e19d2bee0ef1343cd1339ad980543ccc.webp',
                    'ponytail': '/character creation/hair styles/anime/ponytail-860f6eb8a1c955f15bf6c66051cbda9ce78bdecdd27b3321b11a06c3537feb1b.webp',
                    'bun': '/character creation/hair styles/anime/bun-0fcc2a3c6b2b68b0c42de93cb57875e4b652ddd441f47d3cd0d2f6dc6bfc9f60.webp'
                }
            },
            'hairColor': {
                'realistic': {
                    'black': 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766904247/character-creation/hair-color/realistic/black.jpg',
                    'brown': 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766904249/character-creation/hair-color/realistic/brown.jpg',
                    'blonde': 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766904250/character-creation/hair-color/realistic/blonde.jpg',
                    'red': 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766904251/character-creation/hair-color/realistic/red.jpg',
                    'silver': 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766906823/attribute-images/hairColor/hairColor_silver_realistic_1766906821737.jpg',
                    'blue': 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766906825/attribute-images/hairColor/hairColor_blue_realistic_1766906824144.jpg'
                }
            },
            'bodyType': {
                'realistic': {
                    'athletic': '/character creation/Body Type/realistic/body_athletic-c3a09551c478b35d5bab217b946c8d3da9eab3ac3f6c4d1fa106aa4e5d763c16.webp',
                    'slim': '/character creation/Body Type/realistic/body_slim-ce55ea6a36780b0dcc3d75e5c8e23eeea3ff2177c9bbcadd92e02e61e6397b96.webp',
                    'curvy': '/character creation/Body Type/realistic/body_curvy-f18d1ee332d545ae810fd3351824967d9710c4ae8991e6184abb5af5f5ec21bc.webp',
                    'voluptuous': '/character creation/Body Type/realistic/body_voluptuous-d4128f1812af6cff122eb24e973b08eed430b86a315cb80f2506f1258f12535c.webp',
                    'petite': '/character creation/Body Type/realistic/body_petite-b18f62bc362b356112dcf9255804da6c878a0d63d461b683201e6119aa78ea4e.webp'
                },
                'anime': {
                    'athletic': '/character creation/Body Type/anime/body_athletic-0bb37d31c6e9d0dda344526ea3e5ea019216f7bc042ecdba0465e790b9f29921.webp',
                    'slim': '/character creation/Body Type/anime/body_slim-422415ecd930ba6275832c1e4c7105eece45afe83100640f82fa5386fa9b7c01.webp',
                    'curvy': '/character creation/Body Type/anime/body_curvy-d53df8ea34c9a47c0e620e8376d77b95b65d7816c47d4308955e3d1ce4c7bf8a.webp',
                    'voluptuous': '/character creation/Body Type/anime/body_voluptuous-224e774f7e5f8ee33282e73d0602b5ba2ee7113f9abb1cca1287be9b7ca038e2.webp'
                }
            },
            'breastSize': {
                'realistic': {
                    'small': '/character creation/Breast Size/realistic/breasts_small-9063db23ae2bf7f45863129f664bef7edc1164fccc4d03007c1a92c561470cd5.webp',
                    'medium': '/character creation/Breast Size/realistic/breasts_medium-93b4eeb0383da569f549ba5f0b63f2fd6e40b91dc987a5dc54818378507f9fa2.webp',
                    'large': '/character creation/Breast Size/realistic/breasts_large-6a6177548ba4e4a026b91fd4d1cb335ca0af31fba1773355f160a31248e30263.webp',
                    'huge': '/character creation/Breast Size/realistic/breasts_huge-f358a0ada25c9c77fa364bb83d10455f909f09c0b7c8779f27122ed7c91c98e2.webp',
                    'flat': '/character creation/Breast Size/realistic/breasts_flat-340ebc7321d0635c127c7649dba47bbee9b64f6b7d1b9b30cedcf6c75fdd5cf8.webp'
                },
                'anime': {
                    'small': '/character creation/Breast Size/anime/breasts_small-6e6481616712533ff44c47851d7d0acbde763cb2ded75b4613ce64e1795ad5d7.webp',
                    'medium': '/character creation/Breast Size/anime/breasts_medium-fc995e083ebd4d323b4b521ecf8ff7dfbd427304da0923a65f251b427dc1622a.webp',
                    'large': '/character creation/Breast Size/anime/breasts_large-77ff79635706eb0266ac76ced6f5625dc7e08ddafa0236d1db8d4b28e18fb541.webp',
                    'huge': '/character creation/Breast Size/anime/breasts_huge-7c8384265c1f14ec564ed7f51167a1391685d1ea62b7bb78776534f52c70d98e.webp'
                }
            },
            'buttSize': {
                'realistic': {
                    'small': '/character creation/Butt Size/realistic/butt_small-48c1b16f769794ec161e5cd5c125e55d4d472abb1d0d99ecfb342f0905e4cc0f.webp',
                    'medium': '/character creation/Butt Size/realistic/butt_medium-04bd199dd8a881e43a677706acfa72c896b65f027ae63b9c098da6734eef6b0f.webp',
                    'large': '/character creation/Butt Size/realistic/butt_large-30ddcb640a43c5882b28b9a56a5d68e711c3f6cd0ad86adf68ebfc5433a8401f.webp',
                    'athletic': '/character creation/Butt Size/realistic/butt_athletic-48e02ae266c3edba8cb56ccc74300afd82493dea11a51850e7ad9ffa4a28e69f.webp',
                    'skinny': '/character creation/Butt Size/realistic/butt_skinny-1fdd436cdf4ccc633444352998fe0f1094c62c69a568196f646067b71f1b7152.webp'
                },
                'anime': {
                    'small': '/character creation/Butt Size/anime/butt_small-9064e87dbf6e8f4e8b93bc61c719eb9b2b93ed65f61a730b10f3316bd913350f.webp',
                    'medium': '/character creation/Butt Size/anime/butt_medium-3282067ffc84e822fbcb8fbd56aa4d37ccb768667ce2608f5c0637bb460d85ca.webp',
                    'large': '/character creation/Butt Size/anime/butt_large-3b8f3ff013c70eb4c63231d4356f75f04006f9e4cc77e41df1f8505647063d49.webp',
                    'athletic': '/character creation/Butt Size/anime/butt_athletic-0ace722a99eedcd941d296049cf910caa40830f773d17f4514dbad0bb378340c.webp'
                }
            },
            'personality': {
                'realistic': {
                    'caregiver': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/caregiver-1764316753269.jpg',
                    'sage': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/sage-1764316773281.jpg',
                    'innocent': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/innocent-1764316789724.jpg',
                    'jester': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/jester-1764316823025.jpg',
                    'temptress': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/temptress-1764316840675.jpg',
                    'dominant': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/dominant-1764316860199.jpg',
                    'submissive': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/submissive-1764316878216.jpg',
                    'lover': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/lover-1764316898475.jpg',
                    'nympho': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/nympho-1764317125738.jpg',
                    'mean': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/mean-1764317145392.jpg',
                    'confidant': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/confidant-1764317158264.jpg',
                    'experimenter': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/experimenter-1764317184187.jpg'
                },
                'anime': {
                    'caregiver': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/caregiver-1764316753269.jpg',
                    'sage': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/sage-1764316773281.jpg',
                    'innocent': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/innocent-1764316789724.jpg',
                    'jester': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/jester-1764316823025.jpg',
                    'temptress': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/temptress-1764316840675.jpg',
                    'dominant': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/dominant-1764316860199.jpg',
                    'submissive': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/submissive-1764316878216.jpg',
                    'lover': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/lover-1764316898475.jpg',
                    'nympho': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/nympho-1764317125738.jpg',
                    'mean': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/mean-1764317145392.jpg',
                    'confidant': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/confidant-1764317158264.jpg',
                    'experimenter': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/experimenter-1764317184187.jpg'
                }
            },
            'relationship': {
                'realistic': {
                    'stranger': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/stranger-1764319962013.jpg',
                    'school-mate': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/school-mate-1764319980133.jpg',
                    'colleague': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/colleague-1764319993801.jpg',
                    'mentor': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/mentor-1764320012791.jpg',
                    'girlfriend': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/girlfriend-1764320025865.jpg',
                    'sex-friend': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/sex-friend-1764320038794.jpg',
                    'wife': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/wife-1764320069861.jpg',
                    'mistress': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/mistress-1764320091623.jpg',
                    'friend': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/friend-1764320104714.jpg',
                    'best-friend': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/best-friend-1764320117264.jpg',
                    'step-sister': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/step-sister-1764320136564.jpg',
                    'step-mom': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/step-mom-1764320158996.jpg'
                },
                'anime': {
                    'stranger': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/stranger-1764319962013.jpg',
                    'school-mate': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/school-mate-1764319980133.jpg',
                    'colleague': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/colleague-1764319993801.jpg',
                    'mentor': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/mentor-1764320012791.jpg',
                    'girlfriend': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/girlfriend-1764320025865.jpg',
                    'sex-friend': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/sex-friend-1764320038794.jpg',
                    'wife': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/wife-1764320069861.jpg',
                    'mistress': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/mistress-1764320091623.jpg',
                    'friend': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/friend-1764320104714.jpg',
                    'best-friend': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/best-friend-1764320117264.jpg',
                    'step-sister': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/step-sister-1764320136564.jpg',
                    'step-mom': 'https://dmjybjsboltyupukulkb.supabase.co/storage/v1/object/public/images/personality/step-mom-1764320158996.jpg'
                }
            }
        };

        // Male (gent) image map - loaded dynamically from database or fallback to placeholders
        const maleImageMap: any = {
            'style': {
                'realistic': '/character creation/choose style/realistic.jpg',
                'anime': '/character creation/choose style/Anime.jpg'
            },
            'bodyType': maleImages.bodyType || {
                'realistic': {
                    'athletic': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=600&fit=crop',
                    'muscular': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=600&fit=crop',
                    'slim': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
                    'average': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
                    'dad-bod': 'https://images.unsplash.com/photo-1558203728-00f45181dd84?w=400&h=600&fit=crop'
                },
                'anime': {
                    'athletic': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=600&fit=crop',
                    'muscular': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=600&fit=crop',
                    'slim': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
                    'average': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
                    'dad-bod': 'https://images.unsplash.com/photo-1558203728-00f45181dd84?w=400&h=600&fit=crop'
                }
            },
            'personality': maleImages.personality || {
                'realistic': {},
                'anime': {}
            },
            'relationship': maleImages.relationship || {
                'realistic': {},
                'anime': {}
            }
        };

        // Select the appropriate imageMap based on gender
        const imageMap = gender === 'gent' ? maleImageMap : femaleImageMap;

        // Debug logging for gent images
        if (gender === 'gent') {
            const maleImagesLoaded = Object.keys(maleImages).length > 0;
            console.log(`🔍 Getting image for gent: ${categoryName}/${optionKey}/${selectedStyle}`, {
                maleImagesLoaded,
                hasCategoryInMap: !!imageMap[categoryName],
                hasStyleInCategory: imageMap[categoryName] ? !!imageMap[categoryName][selectedStyle] : false,
                hasOptionInStyle: imageMap[categoryName]?.[selectedStyle] ? !!imageMap[categoryName][selectedStyle][optionKey] : false,
                actualURL: imageMap[categoryName]?.[selectedStyle]?.[optionKey] || 'NOT FOUND',
                fallbackProvided: !!fallbackUrl
            });
        }

        // Get the image path
        const categoryImages = imageMap[categoryName];
        if (!categoryImages) {
            console.warn(`⚠️  No images found for category: ${categoryName}`);
            return fallbackUrl || defaultPlaceholder;
        }

        // For style, return directly
        if (categoryName === 'style') {
            return categoryImages[optionKey] || fallbackUrl || defaultPlaceholder;
        }

        // For other categories, get the style-specific images
        const styleImages = categoryImages[selectedStyle];
        if (!styleImages) {
            console.warn(`⚠️  No images found for style: ${selectedStyle} in category: ${categoryName}`);
            return fallbackUrl || defaultPlaceholder;
        }

        const finalUrl = styleImages[optionKey];
        if (!finalUrl) {
            if (gender === 'gent') {
                console.warn(`⚠️  No image found for gent option: ${categoryName}/${selectedStyle}/${optionKey}, using fallback: ${fallbackUrl || defaultPlaceholder}`);
            }
            return fallbackUrl || defaultPlaceholder;
        }

        return finalUrl;
    };

    // Auto-start generation when reaching the generation step
    // Lady: step 7 (8th step), Gent: step 4 (5th step)
    const generationStep = gender === 'lady' ? 7 : 4;
    useEffect(() => {
        if (currentStep === generationStep && !generatedImageUrl && !isGenerating) {
            handleGenerateImage();
        }
    }, [currentStep]);

    // Helper function to get the step mapping based on gender
    // Lady: 0=Ethnicity/Age/Eyes, 1=Hair, 2=Body/Breast/Butt, 3=Personality, 4=Relationship, 5=Summary, 6=Generation
    // Gent: 0=Body, 1=Personality, 2=Relationship, 3=Summary, 4=Generation
    const getStepValidation = () => {
        if (gender === 'lady') {
            switch (currentStep) {
                case 0: return !!(selectedEthnicity && selectedAge);
                case 1: return !!(selectedEyeColor && selectedEyeShape);
                case 2: return !!(selectedHairStyle && selectedHairColor);
                case 3: return !!(selectedBodyType && selectedBreastSize && selectedButtSize);
                case 4: return !!selectedPersonality;
                case 5: return !!selectedRelationship;
                case 6: return true; // Summary step
                case 7: return true; // Generation step - allow proceeding even during generation
                default: return false;
            }
        } else { // gent
            switch (currentStep) {
                case 0: return !!selectedBodyType;
                case 1: return !!selectedPersonality;
                case 2: return !!selectedRelationship;
                case 3: return true; // Summary step
                case 4: return !!generatedImageUrl; // Generation step
                default: return false;
            }
        }
    };

    const getNextButtonText = () => {
        if (gender === 'lady') {
            if (currentStep === 5) return 'Granska karaktär →';
            if (currentStep === 6) return 'Skapa min AI →';
            if (currentStep === 7) return 'Fortsätt →';
        } else { // gent
            if (currentStep === 2) return 'Granska karaktär →';
            if (currentStep === 3) return 'Skapa min AI →';
            if (currentStep === 4) return 'Fortsätt →';
        }
        return 'Nästa →';
    };

    // Step 5 is summary/preview step for lady, step 3 for gent
    const [activeTab, setActiveTab] = useState<'appearance' | 'character'>('appearance');

    const renderStepSummary = () => {
        if (gender === 'gent') {
            return (
                <div className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2">Review Your AI Character</h2>
                        <p className="text-muted-foreground">Everything looks perfect!</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-5xl mx-auto bg-[#0a0a0a] rounded-xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row min-h-0 md:min-h-[600px] relative">
                <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20 text-white/40 cursor-pointer hover:text-white transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                </div>

                <div className="w-full md:w-[45%] p-4 sm:p-6 md:p-8">
                    <div className="relative h-full w-full rounded-lg sm:rounded-[2rem] overflow-hidden aspect-[4/5] md:aspect-auto">
                        <img
                            src="https://res.cloudinary.com/ddg02aqiw/image/upload/v1766907081/previews/character_selection_preview_premium.jpg"
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                <div className="w-full md:w-[55%] p-6 md:p-12 md:pl-0 flex flex-col">
                    <div className="mb-6 md:mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">AI Flickvän, {selectedAge}</h2>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/10">
                                <span className="text-white/40"><User size={14} className="sm:size-16" /></span>
                                <span className="text-white font-medium text-xs sm:text-sm">{getDisplayValue(selectedRelationship || 'stranger', 'relationship')}</span>
                            </div>
                            <button className="bg-white/5 p-1.5 sm:p-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                <Sparkles size={18} className="sm:size-20" />
                            </button>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl sm:rounded-2xl w-fit mb-6 md:mb-8 border border-white/10">
                        <button
                            onClick={() => setActiveTab('appearance')}
                            className={cn(
                                "px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all",
                                activeTab === 'appearance' ? "bg-white/20 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                            )}>
                            Utseende
                        </button>
                        <button
                            onClick={() => setActiveTab('character')}
                            className={cn(
                                "px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all",
                                activeTab === 'character' ? "bg-white/20 text-white shadow-lg" : "text-white/40 hover:text-white/60"
                            )}>
                            Karaktär
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[40vh] md:max-h-none">
                        {activeTab === 'appearance' ? (
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-8 md:mb-12">
                                {[
                                    { label: 'Ethnicity', value: selectedEthnicity, type: 'ethnicity' },
                                    { label: 'Age', value: `${selectedAge}yo` },
                                    { label: 'Eye Color', value: selectedEyeColor, type: 'eyeColor' },
                                    { label: 'Body Type', value: selectedBodyType, type: 'bodyType' },
                                    { label: 'Breast Size', value: selectedBreastSize, type: 'breastSize' },
                                    { label: 'Hair Style', value: selectedHairStyle, type: 'hairStyle' },
                                    { label: 'Hair Color', value: selectedHairColor, type: 'hairColor' }
                                ].map((attr, i) => (
                                    <div key={i} className="group relative h-20 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden border border-white/5 bg-white/5 hover:border-primary/50 transition-all duration-300">
                                        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300 hidden sm:block">
                                            <img
                                                src={getImageUrl(attr.type || '', String(attr.value), '')}
                                                className="w-full h-full object-cover grayscale"
                                                alt=""
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-transparent p-3 sm:p-4 flex flex-col justify-center">
                                            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-white/30 tracking-widest">{attr.label}</span>
                                            <span className="text-xs sm:text-sm font-bold text-white truncate">{getDisplayValue(String(attr.value), attr.type || '')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4 mb-2">
                                <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10">
                                    <h4 className="text-white/40 text-[8px] sm:text-[10px] uppercase font-bold tracking-widest mb-1 sm:mb-2">Personlighet</h4>
                                    <p className="text-white text-xs sm:text-base font-medium">{getDisplayValue(selectedPersonality || '', 'personality')}</p>
                                </div>
                                <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10">
                                    <h4 className="text-white/40 text-[8px] sm:text-[10px] uppercase font-bold tracking-widest mb-1 sm:mb-2">Publik status</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-white text-xs sm:text-base font-medium">{isPublic ? 'Offentlig' : 'Privat'}</span>
                                        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10">
                                    <textarea
                                        value={characterDescription}
                                        onChange={(e) => setCharacterDescription(e.target.value)}
                                        placeholder="Beskriv hennes karaktär..."
                                        className="w-full h-20 sm:h-24 bg-transparent border-none text-white text-xs sm:text-sm focus:ring-0 resize-none p-0 outline-none"
                                    />
                                </div>

                                {user?.isPremium && (
                                    <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10">
                                        <h4 className="text-white/40 text-[8px] sm:text-[10px] uppercase font-bold tracking-widest mb-3 flex items-center gap-1">
                                            Minnesåterkallning <Sparkles className="w-3 h-3 text-yellow-500" />
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white text-xs sm:text-sm font-medium">Minnesdjup</span>
                                                <span className="text-primary text-xs font-bold">
                                                    {memoryLevel === 1 ? 'Standard' : memoryLevel === 2 ? 'Förbättrad' : 'Livstid'}
                                                </span>
                                            </div>
                                            <Slider 
                                                value={[memoryLevel]} 
                                                onValueChange={(val) => setMemoryLevel(val[0])}
                                                max={3}
                                                min={1}
                                                step={1}
                                                className="py-4"
                                            />
                                            <p className="text-[10px] text-white/40 italic leading-relaxed">
                                                {memoryLevel === 1 ? 'Senaste 20 meddelandena i kontext' : 
                                                 memoryLevel === 2 ? 'Senaste 100 meddelandena i kontext' : 
                                                 'Fullständig konversationshistorik (Obegränsad)'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 md:pt-6">
                        <button
                            onClick={() => {
                                if (!user?.isPremium && !user?.isAdmin) {
                                    setShowPremiumModal(true);
                                    return;
                                }
                                setShowNameDialog(true);
                            }}
                            className="w-full py-4 sm:py-5 rounded-lg sm:rounded-[1.5rem] bg-gradient-to-r from-primary to-blue-600 text-white font-black text-base sm:text-lg tracking-wider shadow-2xl shadow-primary/20 hover:scale-[1.02] hover:shadow-primary/40 active:scale-[0.98] transition-all uppercase">
                            Gör min AI levande
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Step 7 is generation step - show loading or generated image
    const renderStep7 = () => {
        if (isGenerating) {
            return (
                <>
                    {/* Creating your AI Section - Loading */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-2 text-card-foreground">Skapar din AI</h2>
                        <p className="text-muted-foreground">Vänligen vänta medan vi genererar din perfekta AI-karaktär...</p>
                    </div>

                    {/* Loading Animation */}
                    <div className="flex justify-center items-center mb-8">
                        <div className="relative">
                            <div className="w-32 h-32 border-4 border-border rounded-full animate-spin border-t-primary"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 border-4 border-border rounded-full animate-spin border-t-primary" style={{ animationDirection: 'reverse' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Text */}
                    <div className="text-center">
                        <p className="text-lg text-muted-foreground mb-2">Generating your AI character...</p>
                        <p className="text-sm text-muted-foreground">This may take a few moments</p>
                    </div>
                </>
            );
        } else {
            return (
                <>
                    {/* Creating your AI Section - Complete */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold mb-2">Your AI is Ready!</h2>
                        <p className="text-muted-foreground">Your AI character has been created successfully</p>
                    </div>

                    {/* Generated Image Display */}
                    {generatedImageUrl && (
                        <div className="mb-8 flex justify-center">
                            <div
                                className={`rounded-2xl overflow-hidden border-4 border-primary shadow-2xl transition-opacity duration-1000 ${showImage ? 'opacity-100' : 'opacity-0'
                                    }`}
                                style={{ maxWidth: '500px' }}
                            >
                                <img
                                    src={generatedImageUrl}
                                    alt="Generated AI Character"
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>
                    )}
                </>
            );
        }
    };

    // Handle image generation - starts automatically when stepping to creation step
    const handleGenerateImage = async () => {
        setIsGenerating(true);
        setShowImage(false);

        try {
            const characterDetails = {
                style: selectedStyle,
                ethnicity: selectedEthnicity,
                age: selectedAge,
                eyeColor: selectedEyeColor,
                hairStyle: selectedHairStyle,
                hairColor: selectedHairColor,
                bodyType: selectedBodyType,
                breastSize: selectedBreastSize,
                buttSize: selectedButtSize,
                personality: selectedPersonality,
                relationship: selectedRelationship,
            };

            const response = await fetch('/api/generate-character-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    characterDetails,
                    gender: gender, // Pass gender to the API
                }),
            });

            if (response.status === 402) {
                setShowTokensDepletedModal(true);
                setIsGenerating(false);
                return;
            }

            if (!response.ok) {
                let errorMessage = 'Failed to generate image';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.details || errorMessage;
                } catch (_) {
                    try { errorMessage = await response.text(); } catch (_) { }
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.success && data.imageUrl) {
                setGeneratedImageUrl(data.imageUrl);
                setEnhancedPrompt(data.enhancedPrompt);
                // Trigger fade-in animation
                setTimeout(() => {
                    setShowImage(true);
                }, 100);
            } else {
                throw new Error('No image URL received');
            }
        } catch (error: any) {
            console.error('Error generating image:', error);
            setErrorModal({
                isOpen: true,
                title: 'Generation Failed',
                message: error.message || 'Something went wrong while generating your AI. Please try again.'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle character save
    const handleSaveCharacter = async () => {
        if (!characterName.trim()) {
            alert('Please enter a character name');
            return;
        }

        // If we are on the summary step and haven't generated yet,
        // just save the name and move to the generation step
        const summaryStep = gender === 'lady' ? 6 : 3;
        const generationStep = gender === 'lady' ? 7 : 4;

        if (currentStep === summaryStep && !generatedImageUrl) {
            console.log('📝 Name set, moving to generation step...');
            setShowNameDialog(false);
            setCurrentStep(generationStep);
            return;
        }

        // Allow saving even if generation is still in progress (will use a placeholder)
        const finalImageUrl = generatedImageUrl || 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766907081/previews/character_selection_preview_premium.jpg';

        setIsSaving(true);

        try {
            console.log('💾 Saving character...');

            const characterDetails = {
                style: selectedStyle,
                ethnicity: selectedEthnicity,
                age: selectedAge,
                eyeColor: selectedEyeColor,
                hairStyle: selectedHairStyle,
                hairColor: selectedHairColor,
                bodyType: selectedBodyType,
                breastSize: selectedBreastSize,
                buttSize: selectedButtSize,
                personality: selectedPersonality,
                relationship: selectedRelationship,
            };

            const response = await fetch('/api/save-character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    characterName: characterName.trim(),
                    description: characterDescription.trim(),
                    promptTemplate: promptTemplate.trim(),
                    imageUrl: finalImageUrl,
                    characterDetails,
                    enhancedPrompt,
                    gender: gender,
                    isPublic,
                    memoryLevel,
                }),
            });

            // Handle auth and token errors from API
            if (response.status === 402) {
                setShowTokensDepletedModal(true);
                setIsSaving(false);
                return;
            }

            if (response.status === 401 || response.status === 403) {
                // Check if it's actually an "Access Denied" or "Limit Reached" error from the backend rather than just missing auth
                const errorData = await response.json().catch(() => ({}));
                if (errorData.upgrade_required) {
                    // It's a limit reached error, not an auth error
                    throw new Error(errorData.error || 'Limit reached');
                }

                console.log('⚠️ Not authenticated, prompting login');
                setIsSaving(false);
                openLoginModal();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.details || 'Failed to save character';

                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Give the database and cache a moment to update
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Redirect to Min AI flickvän page to see all girlfriends
            router.push('/my-ai');
        } catch (error: any) {
            console.error('Error saving character:', error);
            // Show more specific error message
            alert(error.message || 'Failed to save character. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Summary step - shows all selections
    const renderSummaryCard = (title: string, value: string | null, type: string, imageUrl?: string) => {
        const emoji = getEmoji(type, value);
        const displayValue = getDisplayValue(value, type);

        return (
            <div className="bg-secondary rounded-xl p-4 flex flex-col items-center justify-center min-w-[120px] min-h-[120px] border border-border">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={displayValue}
                        className="w-16 h-16 rounded-lg object-cover mb-2"
                    />
                ) : (
                    <div className="text-2xl mb-2">{emoji}</div>
                )}
                <div className="text-center">
                    <h3 className="font-semibold text-sm text-secondary-foreground mb-1">{title}</h3>
                    <p className="text-xs text-muted-foreground">{displayValue}</p>
                </div>
            </div>
        );
    };

    // Helper function to get display values
    const getDisplayValue = (value: string | null, type: string) => {
        if (!value) return 'Not selected';

        const displayMap: { [key: string]: { [key: string]: string } } = {
            style: {
                'realistic': 'Realistic',
                'anime': 'Anime'
            },
            ethnicity: {
                'caucasian': 'Caucasian',
                'latina': 'Latina',
                'asian': 'Asian'
            },
            age: {
                'teen': 'Teen (18+)',
                '20s': '20s'
            },
            eyeColor: {
                'brown': 'Brown',
                'blue': 'Blue',
                'green': 'Green',
                'red': 'Red',
                'yellow': 'Yellow'
            },
            hairStyle: {
                'straight': 'Straight',
                'short': 'Short',
                'long': 'Long',
                'curly': 'Curly',
                'bangs': 'Bangs',
                'bun': 'Bun',
                'ponytail': 'Ponytail'
            },
            hairColor: {
                'blonde': 'Blonde',
                'brunette': 'Brunette',
                'black': 'Black'
            },
            bodyType: {
                'petite': 'Petite',
                'slim': 'Slim',
                'athletic': 'Athletic',
                'voluptuous': 'Voluptuous',
                'curvy': 'Curvy'
            },
            breastSize: {
                'small': 'Small',
                'medium': 'Medium',
                'large': 'Large',
                'huge': 'Huge',
                'flat': 'Flat'
            },
            buttSize: {
                'small': 'Small',
                'medium': 'Medium',
                'large': 'Large',
                'athletic': 'Athletic',
                'skinny': 'Skinny'
            },
            'eyeShape': {
                'almond': 'Almond',
                'round': 'Round',
                'monolid': 'Monolid',
                'hooded': 'Hooded',
                'downturned': 'Downturned',
                'upturned': 'Upturned'
            },
            'outfit': {
                'bikini': 'Bikini',
                'dress': 'Elegant Dress',
                'lingerie': 'Lingerie',
                'casual': 'Casual Wear',
                'sporty': 'Sporty Outfit',
                'office': 'Office Wear',
                'uniform': 'Uniform',
                'traditional': 'Traditional'
            },
            personality: {
                'caregiver': 'Caregiver',
                'sage': 'Sage',
                'innocent': 'Innocent',
                'jester': 'Jester',
                'temptress': 'Temptress',
                'dominant': 'Dominant',
                'submissive': 'Submissive',
                'lover': 'Lover',
                'nympho': 'Nympho',
                'mean': 'Mean',
                'confidant': 'Confidant',
                'experimenter': 'Experimenter'
            },
            relationship: {
                'stranger': 'Stranger',
                'school-mate': 'School Mate',
                'colleague': 'Colleague',
                'mentor': 'Mentor',
                'girlfriend': 'Girlfriend',
                'sex-friend': 'Sex Friend',
                'wife': 'Wife',
                'mistress': 'Mistress',
                'friend': 'Friend',
                'best-friend': 'Best Friend',
                'step-sister': 'Step Sister',
                'step-mom': 'Step Mom'
            }
        };

        return displayMap[type]?.[value] || value;
    };

    const getEmoji = (type: string, value: string | null) => {
        const emojiMap: { [key: string]: { [key: string]: string } } = {
            style: {
                'realistic': '🎭',
                'anime': '🎌'
            },
            ethnicity: {
                'caucasian': '👩🏻',
                'latina': '👩🏽',
                'asian': '👩🏼'
            },
            age: {
                'teen': '👩‍🎓',
                '20s': '👩‍💼'
            },
            eyeColor: {
                'brown': '👁️',
                'blue': '👁️'
            },
            hairStyle: {
                'straight': '💇‍♀️',
                'short': '✂️',
                'long': '🌊'
            },
            hairColor: {
                'blonde': '🌟',
                'brunette': '🟤',
                'black': '⚫'
            },
            bodyType: {
                'slim': '🏃‍♀️',
                'athletic': '💪',
                'voluptuous': '💃'
            },
            breastSize: {
                'medium': '👙',
                'large': '👙',
                'huge': '👙'
            },
            buttSize: {
                'medium': '🍑',
                'large': '🍑',
                'athletic': '🍑'
            },
            personality: {
                'caregiver': '🤝',
                'sage': '🧙‍♀️',
                'innocent': '⭐',
                'jester': '🃏',
                'temptress': '💋',
                'dominant': '👑',
                'submissive': '💝',
                'lover': '💕',
                'nympho': '🔥',
                'mean': '🧊',
                'confidant': '💬',
                'experimenter': '🔬'
            },
            relationship: {
                'stranger': '🕶️',
                'school-mate': '🎓',
                'colleague': '💼',
                'mentor': '💎',
                'girlfriend': '❤️',
                'sex-friend': '👥',
                'wife': '💍',
                'mistress': '👑',
                'friend': '🙌',
                'best-friend': '🎉',
                'step-sister': '👩‍❤️‍👩',
                'step-mom': '👩‍👦'
            }
        };

        return emojiMap[type]?.[value || ''] || '❓';
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto pt-8 sm:pt-12 md:pt-16 px-2 sm:px-4 md:px-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 md:mb-10 gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl md:text-3xl">🧬</span>
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black italic tracking-tighter text-foreground leading-tight">
                            Skapa min AI
                        </h1>
                    </div>
                    {user && (
                        <UserTokenBalance 
                            className="bg-card/40 backdrop-blur-md border-primary/20"
                        />
                    )}
                </div>

                {/* Loading indicator for male images */}
                {gender === 'gent' && isLoadingMaleImages && (
                    <div className="text-center mb-6 p-4 bg-muted rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading character options...</p>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
                    <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-2 overflow-x-auto pb-2">
                        {Array.from({ length: totalSteps }, (_, step) => (
                            <div key={step} className="flex items-center flex-shrink-0">
                                <div className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center text-xs sm:text-xs md:text-sm font-bold ${step <= currentStep
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "bg-secondary border-secondary text-muted-foreground"
                                    }`}>
                                    {step < currentStep ? (
                                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        step + 1
                                    )}
                                </div>
                                {step < totalSteps - 1 && (
                                    <div className={`w-4 sm:w-6 md:w-12 h-1 mx-0.5 sm:mx-1 md:mx-2 ${step < currentStep ? "bg-primary" : "bg-secondary"
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-card rounded-xl sm:rounded-2xl p-2 sm:p-4 md:p-8 shadow-2xl relative z-10 border border-border">
                    {currentStep === 0 && gender === 'lady' && (
                        <div className="space-y-10">
                            {/* Choose Ethnicity Section */}
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                                        <User className="h-6 w-6 text-primary" />
                                        Choose Ethnicity*
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">Select the background that best fits your AI</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {[
                                        { id: 'caucasian', label: 'Caucasian', fallback: '/character creation/Ethnicity/realistic/caucasian-3a46e91357800f7a540500d0115fe6364650b7a1d9e42673061b670fc226464d.webp' },
                                        { id: 'latina', label: 'Latina', fallback: '/character creation/Ethnicity/realistic/latina-9f20e7d69703c6489122ac5b69865ac1252a7527c4509522f5d8df717067d1a6.webp' },
                                        { id: 'asian', label: 'Asian', fallback: '/character creation/Ethnicity/realistic/asian-45e23043a3b83e0bcffb1cf30a17f0c8d41f551616b930b11591e97cadfdde29.webp' },
                                        { id: 'african', label: 'African', fallback: '/character creation/Ethnicity/realistic/black_afro-3221c8246e818f77797a50c83fca1f39767780b709deeb661cb80041b5fcc4c5.webp' },
                                        { id: 'indian', label: 'Indian', fallback: '/character creation/Ethnicity/realistic/arab-29d6da7f90a7a14b34f080498a9996712ee80d3d5dfb6f9d7ce39be0e6b9922a.webp' }
                                    ].map((eth) => (
                                        <div
                                            key={eth.id}
                                            className={cn(
                                                "group relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300",
                                                selectedEthnicity === eth.id
                                                    ? "border-primary ring-4 ring-primary/20 scale-105"
                                                    : "border-transparent hover:border-primary/50"
                                            )}
                                            onClick={() => setSelectedEthnicity(eth.id)}
                                        >
                                            <div className="aspect-[3/4] overflow-hidden">
                                                <img
                                                    src={getImageUrl('ethnicity', eth.id, eth.fallback)}
                                                    alt={eth.label}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center p-3">
                                                <span className="text-white text-xs font-bold tracking-wide uppercase">
                                                    {eth.label}
                                                </span>
                                            </div>
                                            {selectedEthnicity === eth.id && (
                                                <div className="absolute top-2 right-2 bg-primary rounded-full p-1 shadow-lg">
                                                    <ShieldCheck className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Choose Age Section with Slider */}
                            <div className="space-y-6 py-6 border-y border-border/50">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                                        <Calendar className="h-6 w-6 text-primary" />
                                        Choose Age
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">Drag the slider to set her age: <span className="text-primary font-bold">{selectedAge} years</span></p>
                                </div>
                                <div className="px-4 max-w-md mx-auto space-y-4">
                                    <Slider
                                        value={[selectedAge]}
                                        min={18}
                                        max={70}
                                        step={1}
                                        onValueChange={(vals) => setSelectedAge(vals[0])}
                                        className="py-4"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <span>18 Years</span>
                                        <span>70 Years</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {currentStep === 1 && gender === 'lady' && (
                        <div className="space-y-12">
                            {/* Choose Eye Color Section */}
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                                        <Eye className="h-6 w-6 text-primary" />
                                        Välj Ögonfärg*
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">Välj den färg som bäst passar din AI</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4">
                                    {[
                                        { id: 'brown', label: 'Brun', fallback: '/character creation/eye color/realistic/brown-9dbba1bb37191cf2fc0d0fd3f2c118277e3f1c257a66a870484739fa1bd33c42.webp' },
                                        { id: 'blue', label: 'Blå', fallback: '/character creation/eye color/realistic/blue-f7e75e814204c4d8464d36f525b0f6e9191557a585cb4be01e91ca8eb45416d0.webp' },
                                        { id: 'green', label: 'Grön', fallback: '/character creation/eye color/realistic/green-8a705cc5c2c435ac0f7addd110f4dd2b883a2e35b6403659c3e30cc7a741359c.webp' },
                                        { id: 'hazel', label: 'Hazel', fallback: 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766906815/attribute-images/eyeColor/eyeColor_hazel_realistic_1766906813010.jpg' },
                                        { id: 'grey', label: 'Grå', fallback: 'https://res.cloudinary.com/ddg02aqiw/image/upload/v1766906815/attribute-images/eyeColor/eyeColor_gray_realistic_1766906813010.jpg' }
                                    ].map((eye) => (
                                        <div
                                            key={eye.id}
                                            onClick={() => setSelectedEyeColor(eye.id)}
                                            className={cn(
                                                "group cursor-pointer p-1 rounded-full border-2 transition-all",
                                                selectedEyeColor === eye.id ? "border-primary ring-4 ring-primary/20 scale-105" : "border-transparent"
                                            )}
                                        >
                                            <div className="w-16 h-16 rounded-full overflow-hidden border border-border group-hover:ring-2 group-hover:ring-primary/50 transition-all">
                                                <img
                                                    src={eye.fallback ? getImageUrl('eyeColor', eye.id, eye.fallback) : `https://images.unsplash.com/photo-1544474601-574300305a76?q=80&w=150`}
                                                    alt={eye.label}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <p className={cn(
                                                "text-center text-[10px] uppercase font-bold mt-1 tracking-wider",
                                                selectedEyeColor === eye.id ? "text-primary" : "text-muted-foreground"
                                            )}>{eye.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Choose Eye Shape Section */}
                            <div className="space-y-6 pt-8 border-t border-border/50">
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                                        <Eye className="h-6 w-6 text-primary" />
                                        Välj Ögonform*
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">Välj den ögonform som bäst definierar hennes blick</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'almond', label: 'Almond' },
                                        { id: 'round', label: 'Round' },
                                        { id: 'monolid', label: 'Monolid' },
                                        { id: 'hooded', label: 'Hooded' },
                                        { id: 'downturned', label: 'Downturned' },
                                        { id: 'upturned', label: 'Upturned' }
                                    ].map((shape) => (
                                        <Button
                                            key={shape.id}
                                            variant={selectedEyeShape === shape.id ? "default" : "outline"}
                                            className={cn(
                                                "h-auto py-6 rounded-2xl border-2 transition-all hover:scale-105",
                                                selectedEyeShape === shape.id ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 scale-105" : "border-border"
                                            )}
                                            onClick={() => setSelectedEyeShape(shape.id)}
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="font-bold uppercase tracking-wider text-xs">{shape.label}</span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}


                    {currentStep === 2 && gender === 'lady' && (
                        <>
                            {/* Choose Hair Style Section */}
                            <div className="mb-6 sm:mb-8 md:mb-12">
                                <div className="text-center mb-4 sm:mb-6 md:mb-8">
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 text-card-foreground">Choose Hair Style*</h2>
                                </div>

                                {/* Hair styles - Ultra-small: 2 columns, Small: 3 columns, Desktop: scattered layout */}
                                <div className="relative mb-4 sm:mb-6">
                                    {/* Mobile: Grid layout */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:hidden gap-2 sm:gap-3 mb-4 sm:mb-6">
                                        {/* Straight */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedHairStyle === 'straight'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedHairStyle('straight')}
                                        >
                                            <div className="w-[70px] h-[70px] sm:w-[88px] sm:h-[88px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('hairStyle', 'straight', '/character creation/hair styles/realistic/straight-50860930cc288e0be0fef427289870b6d421a4eba489ec04600fd0b3b1b32826.webp')}
                                                    alt="Straight hair"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedHairStyle === 'straight'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Straight
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Curly */}
                                        <div
                                            className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'curly'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedHairStyle('curly')}
                                        >
                                            <div className="w-[88px] h-[88px] rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('hairStyle', 'curly', '/character creation/hair styles/realistic/curly-4110486ba90646770e43e75e045c0cd9db53fcec28cadbc0222985bdf39d3cea.webp')}
                                                    alt="Curly hair"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'curly'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Curly
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bangs */}
                                        <div
                                            className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'bangs'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedHairStyle('bangs')}
                                        >
                                            <div className="w-[88px] h-[88px] rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('hairStyle', 'bangs', '/character creation/hair styles/realistic/bangs-c696685cde2cdd4b88d2c80cd8bd71a1d62d94348a840e2ff3ec2b974f1b9e75.webp')}
                                                    alt="Bangs hair"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'bangs'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Bangs
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Short */}
                                        <div
                                            className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'short'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedHairStyle('short')}
                                        >
                                            <div className="w-[88px] h-[88px] rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('hairStyle', 'short', '/character creation/hair styles/realistic/short-f0217dbf9ddb599d1d7ceff342e1a9b846f4ea5c083e66630dbeff55ce574691.webp')}
                                                    alt="Short hair"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'short'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Short
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Long */}
                                        <div
                                            className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'long'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedHairStyle('long')}
                                        >
                                            <div className="w-[88px] h-[88px] rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('hairStyle', 'long', '/character creation/hair styles/realistic/long-eb817bef0e59709224eaea96296f33b260b2574a6fc10a5a1f10bfcd5dffb9cd.webp')}
                                                    alt="Long hair"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'long'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Long
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bun */}
                                        <div
                                            className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'bun'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedHairStyle('bun')}
                                        >
                                            <div className="w-[88px] h-[88px] rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('hairStyle', 'bun', '/character creation/hair styles/realistic/bun-93b58d32131d1905f6654d992d20bad3adc798ced8e028d89274aac1d7743885.webp')}
                                                    alt="Bun hair"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'bun'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Bun
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Ponytail - Only available for anime */}
                                        {selectedStyle === 'anime' ? (
                                            <div
                                                className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'ponytail'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedHairStyle('ponytail')}
                                            >
                                                <div className="w-[88px] h-[88px] rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('hairStyle', 'ponytail', '/character creation/hair styles/anime/ponytail-860f6eb8a1c955f15bf6c66051cbda9ce78bdecdd27b3321b11a06c3537feb1b.webp')}
                                                        alt="Ponytail hair"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'ponytail'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Ponytail
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Desktop: Scattered layout */}
                                    <div className="hidden md:block">
                                        {/* First row - Straight and Short with gaps */}
                                        <div className="flex justify-center items-center mb-8">
                                            {/* Straight */}
                                            <div className="mx-4">
                                                <div
                                                    className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'straight'
                                                        ? 'bg-primary border-2 border-primary'
                                                        : 'border-2 border-border hover:border-primary'
                                                        }`}
                                                    onClick={() => setSelectedHairStyle('straight')}
                                                >
                                                    <div className="w-[88px] h-[88px] lg:w-[120px] lg:h-[120px] rounded-xl overflow-hidden relative">
                                                        <img
                                                            src={getImageUrl('hairStyle', 'straight', '/character creation/hair styles/realistic/straight-50860930cc288e0be0fef427289870b6d421a4eba489ec04600fd0b3b1b32826.webp')}
                                                            alt="Straight hair"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'straight'
                                                                ? 'bg-primary-foreground text-primary'
                                                                : 'bg-background/50 text-foreground'
                                                                }`}>
                                                                Straight
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Curly */}
                                            <div className="mx-6">
                                                <div
                                                    className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'curly'
                                                        ? 'bg-primary border-2 border-primary'
                                                        : 'border-2 border-border hover:border-primary'
                                                        }`}
                                                    onClick={() => setSelectedHairStyle('curly')}
                                                >
                                                    <div className="w-[88px] h-[88px] lg:w-[120px] lg:h-[120px] rounded-xl overflow-hidden relative">
                                                        <img
                                                            src={getImageUrl('hairStyle', 'curly', '/character creation/hair styles/realistic/curly-4110486ba90646770e43e75e045c0cd9db53fcec28cadbc0222985bdf39d3cea.webp')}
                                                            alt="Curly hair"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'curly'
                                                                ? 'bg-primary-foreground text-primary'
                                                                : 'bg-background/50 text-foreground'
                                                                }`}>
                                                                Curly
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bangs */}
                                            <div className="mx-6">
                                                <div
                                                    className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'bangs'
                                                        ? 'bg-primary border-2 border-primary'
                                                        : 'border-2 border-border hover:border-primary'
                                                        }`}
                                                    onClick={() => setSelectedHairStyle('bangs')}
                                                >
                                                    <div className="w-[88px] h-[88px] lg:w-[120px] lg:h-[120px] rounded-xl overflow-hidden relative">
                                                        <img
                                                            src={getImageUrl('hairStyle', 'bangs', '/character creation/hair styles/realistic/bangs-c696685cde2cdd4b88d2c80cd8bd71a1d62d94348a840e2ff3ec2b974f1b9e75.webp')}
                                                            alt="Bangs hair"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'bangs'
                                                                ? 'bg-primary-foreground text-primary'
                                                                : 'bg-background/50 text-foreground'
                                                                }`}>
                                                                Bangs
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Short */}
                                            <div className="mx-4">
                                                <div
                                                    className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'short'
                                                        ? 'bg-primary border-2 border-primary'
                                                        : 'border-2 border-border hover:border-primary'
                                                        }`}
                                                    onClick={() => setSelectedHairStyle('short')}
                                                >
                                                    <div className="w-[88px] h-[88px] lg:w-[120px] lg:h-[120px] rounded-xl overflow-hidden relative">
                                                        <img
                                                            src={getImageUrl('hairStyle', 'short', '/character creation/hair styles/realistic/short-f0217dbf9ddb599d1d7ceff342e1a9b846f4ea5c083e66630dbeff55ce574691.webp')}
                                                            alt="Short hair"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'short'
                                                                ? 'bg-primary-foreground text-primary'
                                                                : 'bg-background/50 text-foreground'
                                                                }`}>
                                                                Short
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Second row - Long positioned more to the left */}
                                        <div className="flex justify-center items-center">
                                            <div className="mx-8">
                                                <div
                                                    className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'long'
                                                        ? 'bg-primary border-2 border-primary'
                                                        : 'border-2 border-border hover:border-primary'
                                                        }`}
                                                    onClick={() => setSelectedHairStyle('long')}
                                                >
                                                    <div className="w-[88px] h-[88px] lg:w-[120px] lg:h-[120px] rounded-xl overflow-hidden relative">
                                                        <img
                                                            src={getImageUrl('hairStyle', 'long', '/character creation/hair styles/realistic/long-eb817bef0e59709224eaea96296f33b260b2574a6fc10a5a1f10bfcd5dffb9cd.webp')}
                                                            alt="Long hair"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'long'
                                                                ? 'bg-primary-foreground text-primary'
                                                                : 'bg-background/50 text-foreground'
                                                                }`}>
                                                                Long
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bun */}
                                            <div className="mx-12">
                                                <div
                                                    className={`relative cursor-pointer rounded-xl p-2 transition-all duration-200 ${selectedHairStyle === 'bun'
                                                        ? 'bg-primary border-2 border-primary'
                                                        : 'border-2 border-border hover:border-primary'
                                                        }`}
                                                    onClick={() => setSelectedHairStyle('bun')}
                                                >
                                                    <div className="w-[88px] h-[88px] lg:w-[120px] lg:h-[120px] rounded-xl overflow-hidden relative">
                                                        <img
                                                            src={getImageUrl('hairStyle', 'bun', '/character creation/hair styles/realistic/bun-93b58d32131d1905f6654d992d20bad3adc798ced8e028d89274aac1d7743885.webp')}
                                                            alt="Bun hair"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedHairStyle === 'bun'
                                                                ? 'bg-primary-foreground text-primary'
                                                                : 'bg-background/50 text-foreground'
                                                                }`}>
                                                                Bun
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Choose Hair Color Section */}
                            <div className="mb-6 sm:mb-8 md:mb-12">
                                <div className="text-center mb-4 sm:mb-6 md:mb-8">
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 text-card-foreground">Choose Hair Color*</h2>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-3xl mx-auto">
                                    {[
                                        { id: 'black', label: 'Black' },
                                        { id: 'brown', label: 'Brown' },
                                        { id: 'blonde', label: 'Blonde' },
                                        { id: 'red', label: 'Red' },
                                        { id: 'silver', label: 'Silver' },
                                        { id: 'blue', label: 'Blue' }
                                    ].map((color) => (
                                        <div
                                            key={color.id}
                                            className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 group ${selectedHairColor === color.id
                                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
                                                : 'hover:scale-102 border border-border'
                                                }`}
                                            onClick={() => setSelectedHairColor(color.id)}
                                        >
                                            <div className="aspect-[4/3] w-full relative">
                                                <img
                                                    src={getImageUrl('hairColor', color.id, '')}
                                                    alt={color.label}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            </div>
                                            <div className={`py-2 px-3 text-center transition-colors ${selectedHairColor === color.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground group-hover:text-foreground'}`}>
                                                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                                                    {color.label}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {((currentStep === 3 && gender === 'lady') || (currentStep === 0 && gender === 'gent')) && (
                        <>
                            {/* Choose Body Type Section */}
                            <div className="mb-6 sm:mb-8 md:mb-12">
                                <div className="text-center mb-4 sm:mb-6 md:mb-8">
                                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Choose Body Type*</h2>
                                </div>
                                {/* Ultra-small: 2 columns with smaller items, Small: 3 columns, Desktop: 5 columns */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-center md:items-center gap-1.5 sm:gap-2 md:gap-4 mb-4 sm:mb-6 md:mb-8 max-w-full overflow-x-hidden">

                                    {/* Lady Body Types */}
                                    {gender === 'lady' && (
                                        <>
                                            {/* Petite */}
                                            <div
                                                className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBodyType === 'petite'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedBodyType('petite')}
                                            >
                                                <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('bodyType', 'petite', '/character creation/Body Type/realistic/body_petite-b18f62bc362b356112dcf9255804da6c878a0d63d461b683201e6119aa78ea4e.webp')}
                                                        alt="Petite body"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBodyType === 'petite'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Petite
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Slim */}
                                            <div
                                                className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBodyType === 'slim'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedBodyType('slim')}
                                            >
                                                <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('bodyType', 'slim', '/character creation/Body Type/realistic/body_slim-ce55ea6a36780b0dcc3d75e5c8e23eeea3ff2177c9bbcadd92e02e61e6397b96.webp')}
                                                        alt="Slim body"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBodyType === 'slim'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Slim
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Athletic */}
                                            <div
                                                className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBodyType === 'athletic'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedBodyType('athletic')}
                                            >
                                                <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('bodyType', 'athletic', '/character creation/Body Type/realistic/body_athletic-c3a09551c478b35d5bab217b946c8d3da9eab3ac3f6c4d1fa106aa4e5d763c16.webp')}
                                                        alt="Athletic body"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBodyType === 'athletic'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Athletic
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Voluptuous */}
                                            <div
                                                className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBodyType === 'voluptuous'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedBodyType('voluptuous')}
                                            >
                                                <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('bodyType', 'voluptuous', '/character creation/Body Type/realistic/body_voluptuous-d4128f1812af6cff122eb24e973b08eed430b86a315cb80f2506f1258f12535c.webp')}
                                                        alt="Voluptuous body"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBodyType === 'voluptuous'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Voluptuous
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Curvy */}
                                            <div
                                                className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBodyType === 'curvy'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedBodyType('curvy')}
                                            >
                                                <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('bodyType', 'curvy', '/character creation/Body Type/realistic/body_curvy-f18d1ee332d545ae810fd3351824967d9710c4ae8991e6184abb5af5f5ec21bc.webp')}
                                                        alt="Curvy body"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBodyType === 'curvy'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Curvy
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Gent Body Types */}
                                    {gender === 'gent' && (
                                        <>
                                            {/* Athletic */}
                                            <div
                                                className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBodyType === 'athletic'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedBodyType('athletic')}
                                            >
                                                <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('bodyType', 'athletic', '')}
                                                        alt="Athletic body"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBodyType === 'athletic'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Athletic
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Muscular */}
                                            <div
                                                className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBodyType === 'muscular'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedBodyType('muscular')}
                                            >
                                                <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('bodyType', 'muscular', '')}
                                                        alt="Muscular body"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBodyType === 'muscular'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Muscular
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Slim */}
                                            <div
                                                className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBodyType === 'slim'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedBodyType('slim')}
                                            >
                                                <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('bodyType', 'slim', '')}
                                                        alt="Slim body"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBodyType === 'slim'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Slim
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Average */}
                                            <div
                                                className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBodyType === 'average'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedBodyType('average')}
                                            >
                                                <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('bodyType', 'average', '')}
                                                        alt="Average body"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBodyType === 'average'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Average
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dad Bod */}
                                            <div
                                                className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBodyType === 'dad-bod'
                                                    ? 'bg-primary border-2 border-primary'
                                                    : 'border-2 border-border hover:border-primary'
                                                    }`}
                                                onClick={() => setSelectedBodyType('dad-bod')}
                                            >
                                                <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                    <img
                                                        src={getImageUrl('bodyType', 'dad-bod', '')}
                                                        alt="Dad Bod"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                        <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBodyType === 'dad-bod'
                                                            ? 'bg-primary-foreground text-primary'
                                                            : 'bg-background/50 text-foreground'
                                                            }`}>
                                                            Dad Bod
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                </div>
                            </div>

                            {/* Choose Breast Size Section - Only for Ladies */}
                            {gender === 'lady' && (
                                <div className="mb-6 sm:mb-8 md:mb-12">
                                    <div className="text-center mb-4 sm:mb-6 md:mb-8">
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Choose Breast Size*</h2>
                                    </div>
                                    {/* Ultra-small: 2 columns, Small: 3 columns, Desktop: 6 columns */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-center md:items-center gap-1.5 sm:gap-2 md:gap-4 mb-4 sm:mb-6 md:mb-8 max-w-full overflow-x-hidden">
                                        {/* Small */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBreastSize === 'small'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedBreastSize('small')}
                                        >
                                            <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('breastSize', 'small', '/character creation/Breast Size/realistic/breasts_small-9063db23ae2bf7f45863129f664bef7edc1164fccc4d03007c1a92c561470cd5.webp')}
                                                    alt="Small breast size"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBreastSize === 'small'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Small
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Medium */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBreastSize === 'medium'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedBreastSize('medium')}
                                        >
                                            <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('breastSize', 'medium', '/character creation/Breast Size/realistic/breasts_medium-93b4eeb0383da569f549ba5f0b63f2fd6e40b91dc987a5dc54818378507f9fa2.webp')}
                                                    alt="Medium breast size"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBreastSize === 'medium'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Medium
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Large */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBreastSize === 'large'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedBreastSize('large')}
                                        >
                                            <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('breastSize', 'large', '/character creation/Breast Size/realistic/breasts_large-6a6177548ba4e4a026b91fd4d1cb335ca0af31fba1773355f160a31248e30263.webp')}
                                                    alt="Large breast size"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBreastSize === 'large'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Large
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Huge */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBreastSize === 'huge'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedBreastSize('huge')}
                                        >
                                            <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('breastSize', 'huge', '/character creation/Breast Size/realistic/breasts_huge-f358a0ada25c9c77fa364bb83d10455f909f09c0b7c8779f27122ed7c91c98e2.webp')}
                                                    alt="Huge breast size"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBreastSize === 'huge'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Huge
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Flat */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedBreastSize === 'flat'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedBreastSize('flat')}
                                        >
                                            <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('breastSize', 'flat', '/character creation/Breast Size/realistic/breasts_flat-340ebc7321d0635c127c7649dba47bbee9b64f6b7d1b9b30cedcf6c75fdd5cf8.webp')}
                                                    alt="Flat breast size"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedBreastSize === 'flat'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Flat
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Choose Butt Size Section - Only for Ladies */}
                            {gender === 'lady' && (
                                <div className="mb-6 sm:mb-8 md:mb-12">
                                    <div className="text-center mb-4 sm:mb-6 md:mb-8">
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Choose Butt Size*</h2>
                                    </div>
                                    {/* Ultra-small: 2 columns, Small: 3 columns, Desktop: 5 columns */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-center md:items-center gap-1.5 sm:gap-2 md:gap-4 mb-4 sm:mb-6 md:mb-8 max-w-full overflow-x-hidden">
                                        {/* Small */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedButtSize === 'small'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedButtSize('small')}
                                        >
                                            <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('buttSize', 'small', '/character creation/Butt Size/realistic/butt_small-48c1b16f769794ec161e5cd5c125e55d4d472abb1d0d99ecfb342f0905e4cc0f.webp')}
                                                    alt="Small butt size"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedButtSize === 'small'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Small
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Medium */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedButtSize === 'medium'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedButtSize('medium')}
                                        >
                                            <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('buttSize', 'medium', '/character creation/Butt Size/realistic/butt_medium-04bd199dd8a881e43a677706acfa72c896b65f027ae63b9c098da6734eef6b0f.webp')}
                                                    alt="Medium butt size"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedButtSize === 'medium'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Medium
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Large */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedButtSize === 'large'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedButtSize('large')}
                                        >
                                            <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('buttSize', 'large', '/character creation/Butt Size/realistic/butt_large-30ddcb640a43c5882b28b9a56a5d68e711c3f6cd0ad86adf68ebfc5433a8401f.webp')}
                                                    alt="Large butt size"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedButtSize === 'large'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Large
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Athletic */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedButtSize === 'athletic'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedButtSize('athletic')}
                                        >
                                            <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('buttSize', 'athletic', '/character creation/Butt Size/realistic/butt_athletic-48e02ae266c3edba8cb56ccc74300afd82493dea11a51850e7ad9ffa4a28e69f.webp')}
                                                    alt="Athletic butt size"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedButtSize === 'athletic'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Athletic
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Skinny */}
                                        <div
                                            className={`relative cursor-pointer rounded-lg sm:rounded-xl p-1 sm:p-2 transition-all duration-200 ${selectedButtSize === 'skinny'
                                                ? 'bg-primary border-2 border-primary'
                                                : 'border-2 border-border hover:border-primary'
                                                }`}
                                            onClick={() => setSelectedButtSize('skinny')}
                                        >
                                            <div className="w-[60px] h-[60px] sm:w-[88px] sm:h-[88px] lg:w-[120px] lg:h-[120px] rounded-lg sm:rounded-xl overflow-hidden relative mx-auto">
                                                <img
                                                    src={getImageUrl('buttSize', 'skinny', '/character creation/Butt Size/realistic/butt_skinny-1fdd436cdf4ccc633444352998fe0f1094c62c69a568196f646067b71f1b7152.webp')}
                                                    alt="Skinny butt size"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2">
                                                    <span className={`px-1 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${selectedButtSize === 'skinny'
                                                        ? 'bg-primary-foreground text-primary'
                                                        : 'bg-background/50 text-foreground'
                                                        }`}>
                                                        Skinny
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 4 (Lady) / Step 1 (Gent): Personality */}
                    {((gender === 'lady' && currentStep === 4) || (gender === 'gent' && currentStep === 1)) && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                    Personlighetsegenskaper
                                </h2>
                                <p className="text-muted-foreground">Välj {gender === 'lady' ? 'hennes' : 'hans'} kärnpersonlighet</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {(gender === 'lady'
                                    ? ['caregiver', 'sage', 'innocent', 'jester', 'temptress', 'dominant', 'submissive', 'lover', 'nympho', 'mean', 'confidant', 'experimenter']
                                    : ['confident', 'caring', 'dominant', 'playful', 'mysterious', 'romantic']
                                ).map((key) => (
                                    <Button
                                        key={key}
                                        variant={selectedPersonality === key ? "default" : "outline"}
                                        className={cn(
                                            "h-auto py-4 px-6 flex flex-col items-center gap-2 rounded-2xl transition-all duration-300",
                                            selectedPersonality === key
                                                ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 scale-105"
                                                : "hover:border-primary/50 hover:bg-primary/5"
                                        )}
                                        onClick={() => setSelectedPersonality(key)}
                                    >
                                        <span className="text-2xl">{getEmoji('personality', key)}</span>
                                        <span className="font-bold tracking-wide">{getDisplayValue(key, 'personality')}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5 (Lady) / Step 2 (Gent): Relationship */}
                    {((gender === 'lady' && currentStep === 5) || (gender === 'gent' && currentStep === 2)) && (
                        <div className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
                                    <Heart className="h-8 w-8 text-primary" />
                                    Relation
                                </h2>
                                <p className="text-muted-foreground">Definiera din nuvarande status med {gender === 'lady' ? 'henne' : 'honom'}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {['stranger', 'school-mate', 'colleague', 'mentor', 'girlfriend', 'sex-friend', 'wife', 'mistress', 'friend', 'best-friend', 'step-sister', 'step-mom'].map((key) => (
                                    <Button
                                        key={key}
                                        variant={selectedRelationship === key ? "default" : "outline"}
                                        className={cn(
                                            "h-auto py-4 px-6 flex flex-col items-center gap-2 rounded-2xl transition-all duration-300",
                                            selectedRelationship === key
                                                ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 scale-105"
                                                : "hover:border-primary/50 hover:bg-primary/5"
                                        )}
                                        onClick={() => setSelectedRelationship(key)}
                                    >
                                        <span className="text-2xl">{getEmoji('relationship', key)}</span>
                                        <span className="font-bold tracking-wide">{getDisplayValue(key, 'relationship')}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Step 6 (Lady) / Step 3 (Gent): Summary */}
                    {((gender === 'lady' && currentStep === 6) || (gender === 'gent' && currentStep === 3)) && renderStepSummary()}

                    {/* Step 7 (Lady) / Step 4 (Gent): Generation */}
                    {((gender === 'lady' && currentStep === 7) || (gender === 'gent' && currentStep === 4)) && renderStep7()}




                    {/* Navigation Buttons for Lady's new indexing */}
                    <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 ${currentStep === 0 ? 'justify-end' : 'justify-between'} relative z-20`}>
                        {currentStep > 0 && (
                            <button
                                className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all font-semibold text-xs sm:text-sm md:text-base order-1 sm:order-1 w-full sm:w-auto relative z-10 border border-border"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                disabled={isGenerating}
                            >
                                ← Föregående
                            </button>
                        )}
                        <button
                            className={`px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all order-2 sm:order-2 w-full sm:w-auto relative z-20 ${getStepValidation() && !isGenerating
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                : 'bg-secondary text-muted-foreground cursor-not-allowed border border-border'
                                }`}
                            disabled={!getStepValidation() || isGenerating}
                            onClick={() => {
                                const summaryStep = gender === 'lady' ? 6 : 3;
                                const generationStep = gender === 'lady' ? 7 : 4;

                                if (currentStep === summaryStep) {
                                    if (user?.isExpired) {
                                        setShowExpiredModal(true);
                                        return;
                                    }
                                    if (!user?.isPremium && !user?.isAdmin) {
                                        setShowPremiumModal(true);
                                        return;
                                    }
                                    setShowNameDialog(true);
                                } else if (currentStep === generationStep) {
                                    handleSaveCharacter();
                                } else {
                                    setCurrentStep(currentStep + 1);
                                }
                            }}
                        >
                            {getNextButtonText()}
                        </button>
                    </div>
                </div>
            </div>



            {/* Character Naming Dialog */}
            {
                showNameDialog && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-8 max-w-md w-full shadow-2xl border border-border">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-center text-card-foreground">Namnge din AI-karaktär</h2>
                            <p className="text-muted-foreground mb-4 sm:mb-6 text-center text-xs sm:text-sm md:text-base">Välj ett unikt namn för att ge din AI liv</p>

                            <input
                                type="text"
                                value={characterName}
                                onChange={(e) => setCharacterName(e.target.value)}
                                placeholder="Ange karaktärens namn..."
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
                                maxLength={50}
                                autoFocus
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && characterName.trim()) {
                                        handleSaveCharacter();
                                    }
                                }}
                            />

                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <button
                                    onClick={() => setShowNameDialog(false)}
                                    disabled={isSaving}
                                    className="flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold transition-all text-xs sm:text-sm md:text-base"
                                >
                                    Avbryt
                                </button>
                                <button
                                    onClick={handleSaveCharacter}
                                    disabled={isSaving || !characterName.trim()}
                                    className={`flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-xs sm:text-sm md:text-base ${isSaving || !characterName.trim()
                                        ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                                        }`}
                                >
                                    {isSaving ? 'Spara...' : 'Namnge karaktär'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }




            {/* Error Modal */}
            {
                errorModal.isOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-2xl border border-border">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-card-foreground">{errorModal.title}</h2>
                                <p className="text-muted-foreground text-sm sm:text-base">
                                    {errorModal.message}
                                </p>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
                                    className="w-full px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all text-sm sm:text-base"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <PremiumUpgradeModal
                isOpen={showPremiumModal}
                onClose={() => {
                    setShowPremiumModal(false);
                }}
                feature="Skapa AI-flickvänner"
                description="Upgrade to Premium to generate AI girlfriends."
                imageSrc="https://res.cloudinary.com/ddg02aqiw/image/upload/v1766963048/premium-modals/create_character_premium.jpg"
            />

            <PremiumUpgradeModal
                isOpen={showTokensDepletedModal}
                onClose={() => setShowTokensDepletedModal(false)}
                mode="tokens-depleted"
                feature="Tokens Slut"
                description="You used your 100 free premium tokens. Buy more tokens to use premium features"
                imageSrc="https://res.cloudinary.com/ddg02aqiw/image/upload/v1766963046/premium-modals/tokens_depleted.jpg"
            />

            <PremiumUpgradeModal
                isOpen={showExpiredModal}
                onClose={() => setShowExpiredModal(false)}
                mode="expired"
                feature="Premium Expired"
                description="Premium Plan expired. Renew your Premium Plan."
            />
        </div>
    );
}
