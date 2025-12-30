"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Send,
  Menu,
  Loader2,
  User,
  X,
  Wand2,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useTranslations } from "@/lib/use-translations"
import { useSidebar } from "@/components/sidebar-context"
import { useCharacters } from "@/components/character-context"
import { sendChatMessage, type Message } from "@/lib/chat-actions"
import { checkNovitaApiKey } from "@/lib/api-key-utils"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { useAuthModal } from "@/components/auth-modal-context"
import { sendChatMessageDB, loadChatHistory as loadChatHistoryDB, clearChatHistory as clearChatHistoryDB, type Message as DBMessage } from "@/lib/chat-actions-db"
import { ClearChatDialog } from "@/components/clear-chat-dialog"
import { checkMessageLimit, incrementMessageUsage, getUserPlanInfo } from "@/lib/subscription-limits"
import { DebugPanel } from "@/components/debug-panel"
import {
  saveMessageToLocalStorage,
  getChatHistoryFromLocalStorage,
  clearChatHistoryFromLocalStorage,
} from "@/lib/local-storage-chat"
import { saveMessageToDatabase } from "@/lib/chat-storage"
import { SupabaseDebug } from "@/components/supabase-debug"
import { PremiumUpgradeModal } from "@/components/premium-upgrade-modal"
import { isAskingForImage, extractImagePrompt, imageUrlToBase64 } from "@/lib/image-utils"
import { ImageModal } from "@/components/image-modal"
import { containsNSFW } from "@/lib/nsfw-filter"
import { toast } from "sonner"

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const [characterId, setCharacterId] = useState<string | null>(null);
  const { characters, isLoading: charactersLoading, updateCharacter, refreshCharacters } = useCharacters();
  const [character, setCharacter] = useState<any>(null);
  const [isLookupComplete, setIsLookupComplete] = useState(false);

  // Handle params unwrapping for Next.js 15
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      const newId = resolvedParams.id;
      if (newId !== characterId) {
        setCharacterId(newId);
        setCharacter(null); // Reset character state when navigating to a new ID
        setIsLookupComplete(false); // Reset lookup state
        setMessages([]); // Reset messages when navigating
      }
    };
    unwrapParams();
  }, [params, characterId]);
  const { toggle, setIsOpen } = useSidebar();
  const router = useRouter();
  const { user, isLoading } = useAuth()
  const { openLoginModal } = useAuthModal()
  const { t } = useTranslations()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Check authentication and show login modal if needed
  useEffect(() => {
    if (!user && !isLoading && characterId) {
      // User is not authenticated, show login modal
      openLoginModal()
    }
  }, [user, isLoading, characterId, openLoginModal])

  // Debug mount
  useEffect(() => {
    console.log("🚀 ChatPage mounted")
    console.log("   - User authenticated:", !!user)
    console.log("   - User ID:", user?.id)
    console.log("   - Character ID:", characterId)
    console.log("   - Window location:", typeof window !== 'undefined' ? window.location.href : 'SSR')
  }, [user, characterId])

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isClearingChat, setIsClearingChat] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string[] | null>(null)
  const [selectedImagePrompt, setSelectedImagePrompt] = useState<string>("")
  const [isMounted, setIsMounted] = useState(false)
  const [showTokensDepletedModal, setShowTokensDepletedModal] = useState(false)
  const [showExpiredModal, setShowExpiredModal] = useState(false)
  const [chatsWithHistory, setChatsWithHistory] = useState<string[]>([])
  const [showVideo, setShowVideo] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastMessages, setLastMessages] = useState<Record<string, Message | null>>({})
  const [isProfileOpen, setIsProfileOpen] = useState(true)
  const [premiumModalFeature, setPremiumModalFeature] = useState("Meddelandegräns")
  const [premiumModalDescription, setPremiumModalDescription] = useState("Daily message limit reached. Upgrade to premium to continue.")
  const [premiumModalMode, setPremiumModalMode] = useState<'upgrade' | 'message-limit'>('upgrade')
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Use a ref for the interval to ensure we always have the latest reference
  const imageCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Use a ref to track if we're currently processing an image
  const isProcessingImageRef = useRef(false)

  // Use a ref to store the current task ID
  const currentTaskIdRef = useRef<string | null>(null)

  // Add debug state
  const [debugInfo, setDebugInfo] = useState({
    characterId: characterId,
    messagesCount: 0,
    lastError: null as any,
    lastAction: "none",
    storageType: "localStorage",
  })

  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Prepare gallery images
  const galleryImages = useMemo(() => {
    if (!character) return []

    // Start with the main image
    let imgs = [character.image || "/placeholder.svg"]

    // Add additional images from the array if they exist
    if (character.images && Array.isArray(character.images) && character.images.length > 0) {
      // Filter out matches to main image and ensure uniqueness
      const additional = character.images.filter((img: string) => img && img !== character.image)
      imgs = [...imgs, ...additional]
    }

    // Ensure uniqueness
    return Array.from(new Set(imgs))
  }, [character])

  const handleNextImage = () => {
    if (galleryImages.length === 0) return
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const handlePrevImage = () => {
    if (galleryImages.length === 0) return
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  // Set mounted state on component mount
  useEffect(() => {
    setIsMounted(true)
    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCharacter() {
      // Don't run if loading context or no ID
      if (charactersLoading || !characterId) return;

      // If character already set, we consider lookup complete (though we could refine this)
      if (character) {
        if (isMounted) setIsLookupComplete(true);
        return;
      }

      const charId = String(characterId);
      console.log('🔍 Looking for character:', charId);

      // 1. Try to find in characters context
      const foundInContext = characters.find((char) => char.id === charId);
      if (foundInContext) {
        console.log("✅ Found character in context:", foundInContext.name);
        if (isMounted) {
          setCharacter(foundInContext);
          setIsLookupComplete(true);
        }
        return;
      }

      // 2. Check if this is a custom character
      if (charId.startsWith("custom-")) {
        const customCharacterData = localStorage.getItem(`character-${charId}`);
        if (customCharacterData) {
          try {
            const customChar = JSON.parse(customCharacterData);
            console.log("✅ Loaded custom character from localStorage:", customChar.name);
            if (isMounted) {
              setCharacter(customChar);
              setIsLookupComplete(true);
            }
            return;
          } catch (error) {
            console.error("❌ Error parsing custom character:", error);
          }
        }
      }

      // 3. Fallback: Direct database fetch
      console.log("🔎 Character not in context, trying direct fetch...");
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("characters")
          .select("*")
          .eq("id", charId)
          .maybeSingle();

        if (error) throw error;

        // Type guard using explicit casting if needed, though with select('*') and schema it should be fine.
        const typedData = data as any;

        if (typedData) {
          const char = {
            ...typedData,
            isNew: typedData.is_new,
            createdAt: typedData.created_at,
            systemPrompt: typedData.system_prompt || typedData.systemPrompt,
            imageUrl: typedData.image_url || typedData.image,
            videoUrl: typedData.video_url || typedData.videoUrl,
            isPublic: typedData.is_public || typedData.isPublic,
          };
          console.log("✅ Found character via direct fetch:", char.name);
          if (isMounted) setCharacter(char);
        } else {
          console.error("❌ Character not found in database:", charId);
        }
      } catch (err) {
        console.error("❌ Error fetching character directly:", err);
      } finally {
        if (isMounted) setIsLookupComplete(true);
      }
    }

    loadCharacter();

    return () => {
      isMounted = false;
    };
  }, [characters, charactersLoading, characterId, character]);

  // Automatically close the sidebar on component mount
  useEffect(() => {
    setIsOpen(false);
  }, []);

  // Load characters with chat history
  useEffect(() => {
    if (!isMounted) return

    try {
      // Get all characters that have chat history
      const characterIds = characters
        .filter((character) => {
          const history = getChatHistoryFromLocalStorage(character.id)
          return history && history.length > 0
        })
        .map((character) => character.id)

      setChatsWithHistory(characterIds)
    } catch (error) {
      console.error("Failed to load characters with history:", error)
    }
  }, [characters, isMounted, messages])

  useEffect(() => {
    if (!isMounted || !user?.id) return

    // Proactively check limits for free users on mount/character change
    const preCheckLimits = async () => {
      if (!user.isPremium && !user.isAdmin) {
        try {
          const limitCheck = await checkMessageLimit(user.id)
          if (!limitCheck.allowed) {
            setPremiumModalFeature("Meddelandegräns")
            setPremiumModalDescription("Dagligen meddelandegräns uppnådd. Uppgradera till premium för att fortsätta chatta obegränsat.")
            setPremiumModalMode('message-limit')
            setIsPremiumModalOpen(true)
          }
        } catch (error) {
          console.error("Fast track limit check failed:", error)
        }
      }
    }

    preCheckLimits()
  }, [user, characterId, isMounted])

  useEffect(() => {
    if (!isMounted) return

    const newLastMessages: Record<string, Message | null> = {}
    characters.forEach((char) => {
      const history = getChatHistoryFromLocalStorage(char.id)
      if (history && history.length > 0) {
        newLastMessages[char.id] = history[history.length - 1]
      }
    })
    setLastMessages(newLastMessages)
  }, [characters, isMounted, messages])

  // Handle redirect to advanced generation page
  const handleAdvancedGenerate = useCallback(() => {
    if (!character) return

    // Build a nice prompt based on character details
    const details = character.metadata?.characterDetails || {
      style: character.category === 'anime' ? 'anime' : 'realistic',
      ethnicity: character.ethnicity,
      age: character.age,
      personality: character.personality,
    }

    const promptBase = `${character.name}, ${details.age || ''} ${details.ethnicity || ''} ${character.category === 'anime' ? 'anime style' : 'realistic photo'}. ${character.description?.substring(0, 100) || ''}`

    // Redirect to generate page with prompt
    const encodedPrompt = encodeURIComponent(promptBase)
    router.push(`/generate?prompt=${encodedPrompt}&characterId=${character.id}`)
  }, [character, router])

  // Handle image error
  const handleImageError = useCallback(
    (id: string) => {
      if (!isMounted) return

      setImageErrors((prev) => ({
        ...prev,
        [id]: true,
      }))
    },
    [isMounted],
  )

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isMounted) return

    // Use a timeout to ensure the DOM has been updated
    const scrollTimeout = setTimeout(() => {
      if (messagesEndRef.current) {
        try {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        } catch (error) {
          console.error("Error scrolling to bottom:", error)
          // Fallback to a simpler scroll method
          try {
            messagesEndRef.current.scrollIntoView()
          } catch (fallbackError) {
            console.error("Fallback scroll also failed:", fallbackError)
          }
        }
      }
    }, 100)

    return () => clearTimeout(scrollTimeout)
  }, [messages, isMounted])

  // Check API key
  useEffect(() => {
    if (!isMounted) return

    let isCancelled = false

    async function validateApiKey() {
      try {
        const result = await checkNovitaApiKey()
        if (!isCancelled && result && !result.valid) {
          setApiKeyError(result.message)
        }
      } catch (error) {
        console.error("Error validating API key:", error)
      }
    }

    validateApiKey()

    return () => {
      isCancelled = true
    }
  }, [isMounted])

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      try {
        if (imageCheckIntervalRef.current) {
          clearInterval(imageCheckIntervalRef.current)
          imageCheckIntervalRef.current = null
        }
      } catch (error) {
        console.error("Error cleaning up interval:", error)
      }
    }
  }, [])

  // Load chat history from database (fallback to localStorage if empty/failed)
  const loadChatHistory = useCallback(async () => {
    if (!character || !isMounted || !user?.id) { // Added user?.id check
      console.log("Missing character, user, or component not mounted, skipping chat history load")
      setIsLoadingHistory(false)
      return
    }

    setIsLoadingHistory(true)
    setDebugInfo((prev) => ({
      ...prev,
      characterId,
      lastAction: "loadingHistory",
    }))

    try {
      console.log("Loading chat history from DB for character:", characterId)

      // 1. Try to get history from Database
      const dbHistory = await loadChatHistoryDB(character.id, user.id) // Pass userId

      if (dbHistory && dbHistory.length > 0) {
        console.log(`Loaded ${dbHistory.length} messages from database`)
        setMessages(dbHistory as any) // Cast to any to match existing Message type
        setIsLoadingHistory(false)
        return
      }

      // 2. Fallback: Get history from localStorage
      console.log("No DB history found, checking localStorage")
      const localHistory = getChatHistoryFromLocalStorage(character.id)

      console.log(`Loaded ${localHistory.length} messages from localStorage`)
      setDebugInfo((prev) => ({
        ...prev,
        messagesCount: localHistory.length,
        lastAction: "historyLoaded",
      }))

      if (localHistory.length > 0) {
        setMessages(localHistory)

        // OPTIONAL: One-time migration to DB could be triggered here
        console.log("Migration candidate: local messages exist but DB is empty")
      } else {
        console.log("No history found anywhere, setting default welcome message")
        const defaultMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: character.description || `Hi! I'm ${character.name}. Let's chat!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
        setMessages([defaultMessage])
      }
    } catch (error) {
      console.error("Error loading history:", error)
      setDebugInfo((prev) => ({ ...prev, lastError: error, lastAction: "historyError" }))

      // Set default message on error
      setMessages([
        {
          id: `error-welcome-${characterId}`,
          role: "assistant",
          content: `Hej där! Jag är ${character.name}. Så kul att träffa dig! Vad heter du?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ])
    } finally {
      setIsLoadingHistory(false)
    }
  }, [character, characterId, isMounted, user])

  // Effect to load chat history when component mounts or character changes
  useEffect(() => {
    if (isMounted) {
      loadChatHistory()
    }
  }, [loadChatHistory, isMounted])

  // Add this inside the ChatPage component function, after the other useEffect hooks:
  // Effect to log character data when it changes
  useEffect(() => {
    if (character) {
      console.log("Character data:", {
        id: character.id,
        name: character.name,
        videoUrl: character.videoUrl,
      })
    }
  }, [character])

  // Scroll to bottom when messages load
  useEffect(() => {
    const messagesContainer = document.querySelector('[data-messages-container]')
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === "user") {
      const deductToken = async () => {
        if (user) {
          try {
            await fetch("/api/deduct-token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId: user.id }),
            })
          } catch (error) {
            console.error("Failed to deduct token:", error)
          }
        }
      }
      deductToken()
    }
  }, [messages, user])

  // Function to clear any existing image check interval
  const clearImageCheckInterval = useCallback(() => {
    try {
      console.log("Clearing image check interval")
      if (imageCheckIntervalRef.current) {
        clearInterval(imageCheckIntervalRef.current)
        imageCheckIntervalRef.current = null
      }
    } catch (error) {
      console.error("Error clearing image check interval:", error)
    }
  }, [])

  // Voice generation removed - will be added to roadmap

  // Function to generate an image
  const generateImage = async (prompt: string) => {
    if (!isMounted) return

    try {
      // If already generating an image, don't start another one
      if (isGeneratingImage) {
        console.log("Already generating an image, ignoring request")
        return
      }

      // Clear any existing interval first
      clearImageCheckInterval()

      // Reset processing state
      isProcessingImageRef.current = false
      currentTaskIdRef.current = null

      setIsGeneratingImage(true)

      // Get the character's image URL
      const characterImageUrl = character?.image || "/placeholder.svg"

      // Add a loading message to the chat
      const loadingMessage: Message = {
        id: Math.random().toString(36).substring(2, 15),
        role: "assistant",
        content: "I'm generating that image for you. It'll be ready in a moment...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      if (isMounted) {
        setMessages((prev) => [...prev, loadingMessage])
        saveMessageToLocalStorage(characterId!, loadingMessage)
      }

      // Convert the image to base64
      console.log("Converting image to base64:", characterImageUrl)
      const base64Image = await imageUrlToBase64(characterImageUrl)

      if (!base64Image) {
        throw new Error("Failed to convert image to base64")
      }

      if (!isMounted) return

      console.log("Base64 conversion successful, length:", base64Image.length)

      // Try the real API first
      let response
      let responseData
      let useMockApi = false

      try {
        // Make the API request to the real endpoint
        response = await fetch("/api/img2img", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
            negativePrompt: "bad quality, worst quality, low quality",
            imageBase64: base64Image,
          }),
        })

        responseData = await response.json()

        if (response.status === 402) {
          setShowTokensDepletedModal(true)
          setIsGeneratingImage(false)
          return
        }

        if (response.status === 403) {
          setPremiumModalFeature("Premium-bilder")
          setPremiumModalDescription("Du behöver Premium för att generera bilder i chatten. Uppgradera nu för att låsa upp obegränsad bildgenerering.")
          setIsPremiumModalOpen(true)
          setIsGeneratingImage(false)
          return
        }

        if (!response.ok || !responseData.taskId) {
          console.warn("Real API failed, falling back to mock API:", responseData)
          useMockApi = true
        }
      } catch (error) {
        console.warn("Error with real API, falling back to mock API:", error)
        useMockApi = true
      }

      if (!isMounted) return

      // If the real API failed, use the mock API
      if (useMockApi) {
        console.log("Using mock image generation API")
        response = await fetch("/api/mock-img2img", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt,
          }),
        })

        responseData = await response.json()

        if (!response.ok) {
          console.error("Mock API error:", responseData)
          throw new Error(responseData.error || "Failed to start image generation")
        }
      }

      if (!responseData.taskId) {
        console.error("Missing taskId in response:", responseData)
        throw new Error("Invalid response from image generation API")
      }

      if (!isMounted) return

      // Store the task ID
      const newTaskId = responseData.taskId
      currentTaskIdRef.current = newTaskId
      console.log("Image generation started with task ID:", newTaskId)

      // Start polling for results
      const checkEndpoint = useMockApi ? "/api/mock-check-generation" : "/api/check-generation"

      // Instead of using setInterval, we'll use a recursive setTimeout approach
      // This ensures we only have one check running at a time and can completely
      // control when the next check happens
      const checkImageStatus = async () => {
        // If component is unmounted or we're already processing, don't continue
        if (!isMounted || isProcessingImageRef.current || !currentTaskIdRef.current) {
          console.log("Skipping image check - component unmounted, already processing, or no current task")
          return
        }

        try {
          // Set processing flag to prevent multiple simultaneous checks
          isProcessingImageRef.current = true

          console.log("Checking image status for task:", currentTaskIdRef.current)

          // Build query params with userId if available
          const queryParams = new URLSearchParams({
            taskId: currentTaskIdRef.current
          })
          if (user?.id) {
            queryParams.append('userId', user.id)
          }

          const response = await fetch(`${checkEndpoint}?${queryParams.toString()}`)

          if (!response.ok) {
            throw new Error("Failed to check image status")
          }

          const data = await response.json()
          console.log("Image status check result:", data.status)

          if (!isMounted) {
            isProcessingImageRef.current = false
            return
          }

          if (data.status === "TASK_STATUS_SUCCEED" && data.images && data.images.length > 0) {
            // Image generation successful
            console.log("Image generation successful")
            setGeneratedImageUrl(data.images)
            setIsGeneratingImage(false)

            // Add the generated image to the chat
            const imageMessage: Message = {
              id: Math.random().toString(36).substring(2, 15),
              role: "assistant",
              content: ".",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isImage: true,
              imageUrl: data.images,
              imagePrompt: prompt,
            }

            setMessages((prev) => [...prev, imageMessage])
            saveMessageToLocalStorage(characterId!, imageMessage)

            // Clear task ID and processing flag
            currentTaskIdRef.current = null
            isProcessingImageRef.current = false

            // Don't schedule another check
            return
          } else if (data.status === "TASK_STATUS_FAILED") {
            // Image generation failed
            console.log("Image generation failed")
            setIsGeneratingImage(false)

            // Add error message to chat
            const errorMessage: Message = {
              id: Math.random().toString(36).substring(2, 15),
              role: "assistant",
              content: "Sorry, I couldn't generate that image. Let's try something else.",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }

            setMessages((prev) => [...prev, errorMessage])
            saveMessageToLocalStorage(characterId!, errorMessage)

            // Clear task ID and processing flag
            currentTaskIdRef.current = null
            isProcessingImageRef.current = false

            // Don't schedule another check
            return
          }

          // For other statuses (PENDING, RUNNING), continue polling
          isProcessingImageRef.current = false

          // Schedule the next check only if we still have a valid task ID and component is mounted
          if (currentTaskIdRef.current && isMounted) {
            setTimeout(checkImageStatus, 2000)
          }
        } catch (error) {
          console.error("Error checking image status:", error)

          if (!isMounted) return

          // Add error message to chat
          const errorMessage: Message = {
            id: Math.random().toString(36).substring(2, 15),
            role: "assistant",
            content: "Sorry, I had trouble generating that image. Let's try something else.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }

          setMessages((prev) => [...prev, errorMessage])
          saveMessageToLocalStorage(characterId!, errorMessage)

          setIsGeneratingImage(false)

          // Clear task ID and processing flag
          currentTaskIdRef.current = null
          isProcessingImageRef.current = false
        }
      }

      // Start the first check after a short delay
      setTimeout(checkImageStatus, 2000)
    } catch (error) {
      console.error("Error generating image:", error)

      if (!isMounted) return

      setIsGeneratingImage(false)
      currentTaskIdRef.current = null
      isProcessingImageRef.current = false

      // Add error message to chat
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2, 15),
        role: "assistant",
        content: "Sorry, I couldn't generate that image. There was a technical issue with the image processing.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages((prev) => [...prev, errorMessage])
      saveMessageToLocalStorage(characterId!, errorMessage)
    }
  }

  const handleSaveImage = async (imageUrl: string, prompt?: string) => {
    if (!user || !characterId) {
      toast.error("You must be logged in to save images")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/save-generated-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          prompt: prompt || `Generated image for ${character?.name || 'character'}`,
          characterId: characterId.startsWith('custom-') ? null : characterId,
          modelUsed: "novita",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save image")
      }

      const result = await response.json()
      toast.success("Image saved to your collection and profile!")

      // Special handling for custom characters (localStorage)
      if (characterId.startsWith('custom-') && character) {
        console.log("💾 Updating custom character in localStorage with new image");
        const updatedImages = [...(character.images || []), result.permanentUrl || imageUrl];
        const updatedChar = {
          ...character,
          images: updatedImages
        };

        // Update localStorage
        localStorage.setItem(`character-${characterId}`, JSON.stringify(updatedChar));

        // Update local state to trigger re-render
        setCharacter(updatedChar);
      }

      // Refresh global character data so the carousel updates for DB characters
      if (typeof refreshCharacters === 'function') {
        await refreshCharacters()
      }
    } catch (error) {
      console.error("Error saving image:", error)
      toast.error("Failed to save image")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!isMounted) return

    if (inputValue.trim() && !isLoading) {
      // Check message limit before sending
      if (user?.isExpired) {
        setShowExpiredModal(true)
        return
      }

      // Pre-check limit (client-side for better UX)
      if (user?.id) {
        try {
          const messageCheck = await checkMessageLimit(user.id)
          if (!messageCheck.allowed) {
            setPremiumModalFeature("Meddelandegräns")
            setPremiumModalDescription("Dagligen meddelandegräns uppnådd. Uppgradera till premium för att fortsätta chatta obegränsat.")
            setPremiumModalMode('message-limit')
            setIsPremiumModalOpen(true)
            setDebugInfo(prev => ({ ...prev, lastAction: "messageLimitReached" }))
            return
          }
        } catch (error) {
          console.error("Error checking message limit:", error)
        }
      }

      if (!character) {
        console.error("Cannot send message: Character is null");
        return;
      }

      // Note: NSFW check and message limits are now handled server-side within sendChatMessageDB
      // based on the user's real-time plan status from the database.

      // Create new user message
      const newMessage: Message = {
        id: Math.random().toString(36).substring(2, 15),
        role: "user",
        content: inputValue.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      // Add user message to chat
      setMessages((prev) => [...prev, newMessage])
      setInputValue("")
      setIsSendingMessage(true)

      try {
        // 1. Save user message locally (for instant UI feedback)
        saveMessageToLocalStorage(character.id, newMessage)

        // 2. Check for image requests
        if (isAskingForImage(newMessage.content)) {
          const imagePrompt = extractImagePrompt(newMessage.content)
          setIsSendingMessage(false)
          await generateImage(imagePrompt)
          return
        }

        // 3. Send to AI (which also saves to DB)
        setDebugInfo((prev) => ({ ...prev, lastAction: "sendingToAI" }))

        if (!user?.id) {
          toast.error("Vänligen logga in för att fortsätta chatta.")
          openLoginModal()
          setIsSendingMessage(false)
          return
        }

        const aiResponse = await sendChatMessageDB(
          character.id,
          newMessage.content,
          character.system_prompt || character.systemPrompt || "",
          user.id
        )

        if (!aiResponse.success) {
          if (aiResponse.limitReached || aiResponse.upgradeRequired) {
            setPremiumModalFeature(aiResponse.limitReached ? "Meddelandegräns" : "Token-saldo")
            setPremiumModalDescription(aiResponse.error || "Uppgradera till premium för att fortsätta.")
            setPremiumModalMode(aiResponse.limitReached ? 'message-limit' : 'upgrade')
            setIsPremiumModalOpen(true)
          } else {
            toast.error(aiResponse.error || "Failed to get AI response")
          }
          setIsSendingMessage(false)
          return
        }

        if (aiResponse.message) {
          // AI response received and saved to DB
          const assistantMessage: Message = {
            id: aiResponse.message.id,
            role: "assistant",
            content: aiResponse.message.content,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isImage: aiResponse.message.isImage,
            imageUrl: aiResponse.message.imageUrl,
          }

          setMessages(prev => [...prev, assistantMessage])
          saveMessageToLocalStorage(character.id, assistantMessage)
        }
      } catch (error) {
        console.error("Error sending message:", error)
        if (!isMounted) return
        setDebugInfo((prev) => ({ ...prev, lastError: error, lastAction: "sendMessageError" }))
        toast.error("An error occurred while sending your message.")
      } finally {
        if (isMounted) {
          setIsSendingMessage(false)
        }
      }
    }
  }

  // Clear chat history
  const handleClearChat = async () => {
    if (!isMounted || !character) return

    setIsClearingChat(true)
    setDebugInfo((prev) => ({ ...prev, lastAction: "clearingChat" }))

    try {
      // 1. Clear local storage
      const localSuccess = clearChatHistoryFromLocalStorage(character.id)

      // 2. Clear database history (archive session)
      const dbSuccess = user?.id ? await clearChatHistoryDB(character.id, user.id) : false

      setDebugInfo((prev) => ({
        ...prev,
        lastAction: (localSuccess || dbSuccess) ? "chatCleared" : "chatClearFailed",
      }))

      if (localSuccess || dbSuccess) {
        // Set default welcome message after clearing
        const welcomeMessage: Message = {
          id: `welcome-${characterId}-${Date.now()}`,
          role: "assistant",
          content: `Hej där! Jag är ${character.name}. Så kul att träffa dig! Vad heter du?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }

        setMessages([welcomeMessage])
        saveMessageToLocalStorage(characterId!, welcomeMessage)
        toast.success("Chatthistoriken har rensats.")
      }
    } catch (error) {
      console.error("Error clearing chat:", error)
      setDebugInfo((prev) => ({ ...prev, lastError: error, lastAction: "clearChatError" }))
    } finally {
      if (isMounted) {
        setIsClearingChat(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show login modal if not authenticated
  if (!user) {
    // The useEffect will trigger the login modal
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Please log in to continue...</div>
      </div>
    );
  }

  // Show loading while unwrapping params or loading characters
  const isActuallyMounted = isMounted && characterId !== null;

  // We are loading if:
  // 1. Not mounted yet
  // 2. Context is loading
  // 3. Character is not set AND lookup is NOT complete
  if (!isActuallyMounted || charactersLoading || (!character && !isLookupComplete)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background" key="loading-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-muted-foreground">{t("general.loading")}</div>
        </div>
      </div>
    );
  }

  // Show "not found" ONLY if lookup is complete and no character exists
  if (!character && isLookupComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background p-4 text-center">
        <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full border border-border">
          <div className="p-3 bg-destructive/10 rounded-full w-fit mx-auto mb-6">
            <X className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("chat.profileNotFound")}</h1>
          <p className="text-muted-foreground mb-8">Character ID: {characterId}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push('/chat')} className="w-full">
              {t("chat.backToConversations")}
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="w-full">
              {t("general.home")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      key="chat-page-root"
      className="flex flex-col md:flex-row bg-background h-full w-full overflow-hidden"
      style={{ position: 'relative', top: 0 }}
      suppressHydrationWarning
    >
      {/* Left Sidebar - Chat List */}
      <div className="hidden md:block md:w-72 border-b md:border-b-0 md:border-r border-border flex flex-col rounded-tr-2xl rounded-br-2xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={toggle}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t("general.chat")}</h1>
          </div>
        </div>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("chat.searchForProfile")} className="pl-9 bg-card border-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-800">
          <div className="p-2 space-y-2">
            {/* Chat List Items - Only show characters with chat history */}
            {characters
              .filter((char) => chatsWithHistory.includes(char.id))
              .map((char) => (
                <Link href={`/chat/${char.id}`} key={char.id} className="block">
                  <div
                    className={`flex items-center p-3 rounded-xl cursor-pointer ${characterId === char.id ? "bg-[#252525] text-white" : "hover:bg-[#252525] hover:text-white"
                      }`}
                  >
                    <div className="relative w-12 h-12 mr-3">
                      {/* Use regular img tag for Cloudinary images */}
                      <img
                        src={
                          imageErrors[char.id]
                            ? "/placeholder.svg?height=48&width=48"
                            : (char.image_url || char.image || "/placeholder.svg?height=48&width=48")
                        }
                        alt={char.name}
                        className="w-full h-full rounded-full object-cover"
                        onError={() => handleImageError(char.id)}
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-foreground truncate">{char.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {lastMessages[char.id]?.timestamp ?? t("chat.noMessagesYet")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {lastMessages[char.id]?.content ?? t("chat.noMessagesYet")}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            {chatsWithHistory.length === 0 && (
              <div className="text-center text-muted-foreground py-4">{t("chat.noConversationsYet")}</div>
            )}
          </div>
        </div>
      </div>

      {/* Middle - Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Chat Header */}
        <div className="border-b border-border flex items-center px-3 md:px-4 py-3 md:py-4 justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] touch-manipulation"
              onClick={() => toggle()}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] touch-manipulation"
              onClick={() => router.push('/chat')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="relative w-10 h-10 mr-3 flex-shrink-0">
              {/* Use regular img tag for Cloudinary images */}
              <img
                src={
                  imageErrors[character?.id || '']
                    ? "/placeholder.svg?height=40&width=40"
                    : (character?.image_url || character?.image || "/placeholder.svg?height=40&width=40")
                }
                alt={character?.name || "Character"}
                className="w-full h-full rounded-full object-cover"
                onError={() => character?.id && handleImageError(character.id)}
                loading="lazy"
              />
            </div>
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
              <h4 className="font-bold truncate text-foreground leading-tight">
                {character?.name || t("general.loading")}
              </h4>
              <span className="text-[10px] md:text-xs text-muted-foreground truncate">
                {messages.length > 0 ? messages[messages.length - 1].timestamp : t("chat.noMessagesYet")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <ClearChatDialog onConfirm={handleClearChat} isClearing={isClearingChat} />
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "hidden lg:flex text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] touch-manipulation transition-colors",
                isProfileOpen && "text-primary"
              )}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              title={isProfileOpen ? "Hide Profile" : "Show Profile"}
            >
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] touch-manipulation">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scroll-smooth overscroll-behavior-contain min-h-0" data-messages-container>
          {messages.map((message) => (
            <div key={message.id} className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={cn(
                  "max-w-[85%] md:max-w-[80%] lg:max-w-[70%] rounded-2xl p-3 md:p-4 shadow-sm transition-all duration-300",
                  message.role === "user"
                    ? "bg-[#252525] text-white rounded-tr-none"
                    : "bg-[#252525] text-white rounded-tl-none border border-white/5"
                )}
              >
                <div className="flex justify-between items-start">
                  <p className="text-current leading-relaxed break-words">{message.content}</p>
                </div>
                {message.isImage && message.imageUrl && (
                  <div className="mt-2">
                    <div
                      className="relative w-full aspect-square max-w-xs rounded-2xl overflow-hidden cursor-pointer"
                      onClick={() => {
                        if (message.imageUrl) {
                          const urls = Array.isArray(message.imageUrl) ? message.imageUrl : [message.imageUrl]
                          setSelectedImage(urls)
                          setSelectedImagePrompt(message.imagePrompt || "")
                          setIsModalOpen(true)
                        }
                      }}
                    >
                      <img
                        src={imageErrors[message.id] ? "/placeholder.svg" : message.imageUrl}
                        alt="Generated image"
                        className="w-full h-full object-cover"
                        style={{ borderRadius: '1rem' }}
                        onError={() => handleImageError(message.id)}
                        loading="lazy"
                      />
                    </div>

                  </div>
                )}
                <span className="text-xs text-muted-foreground mt-1 block">{message.timestamp}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start" key="ai-thinking-indicator">
              <div className="max-w-[70%] bg-[#252525] text-white rounded-2xl p-3">
                <div className="flex space-x-2">
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          {isGeneratingImage && (
            <div className="flex justify-start" key="image-generation-indicator">
              <div className="max-w-[70%] bg-[#252525] text-white rounded-2xl p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-full aspect-square max-w-xs rounded-2xl bg-gray-700 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {apiKeyError && (
          <div className="mx-4 p-3 bg-destructive/20 border border-destructive text-destructive-foreground rounded-lg text-sm">
            <p className="font-medium">API Key Error</p>
            <p>{apiKeyError}</p>
            <p className="mt-1">Admin users can set the API key in the Admin Dashboard → API Keys section.</p>
          </div>
        )}

        {/* Chat Input */}
        <div className="p-3 md:p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="flex items-end gap-2">
            <Input
              placeholder={t("chat.inputPlaceholder")}
              className="flex-1 bg-card border-border min-h-[44px] text-base md:text-sm resize-none"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSendingMessage || isGeneratingImage}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck="true"
            />
            <Button
              size="icon"
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] min-w-[44px] touch-manipulation"
              onClick={handleSendMessage}
              disabled={isSendingMessage || isGeneratingImage || !inputValue.trim() || !character}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Profile */}
      <div className={cn(
        "hidden border-l border-border transition-all duration-300 ease-in-out bg-background/50 backdrop-blur-sm",
        isProfileOpen ? "lg:block lg:w-80" : "lg:hidden w-0 overflow-hidden"
      )}>
        <div className="h-full overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-800">
          {/* Profile Images Carousel */}
          <div className="relative aspect-square">
            {showVideo ? (
              <div className="w-full h-full">
                {character?.videoUrl ? (
                  <>
                    <video
                      key={character.videoUrl}
                      src={character.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      onError={(e) => {
                        console.error("Video error:", e)
                        toast.error("Error loading video. See console for details.")
                      }}
                    />
                    <div className="absolute top-0 left-0 w-full bg-black/50 p-2 text-white text-xs">
                      {character.videoUrl}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-black/20">
                    <p className="text-white bg-black/50 p-2 rounded">No video available</p>
                  </div>
                )}
                <button
                  className="absolute top-2 right-2 bg-background/50 p-1 rounded-full z-10"
                  onClick={() => {
                    console.log("Closing video")
                    setShowVideo(false)
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <>
                {/* Carousel Image */}
                <img
                  src={
                    (galleryImages.length > 0
                      ? galleryImages[currentImageIndex]
                      : (character?.image || "/placeholder.svg"))
                  }
                  alt={character?.name || "Character"}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  onError={() => handleImageError("profile")}
                  loading="lazy"
                />

                {/* Navigation Arrows */}
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-1.5 rounded-full transition-colors text-white backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 p-1.5 rounded-full transition-colors text-white backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {galleryImages.map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all focus:outline-none ${idx === currentImageIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/70"
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Floating "Watch Video" button if video exists */}
                {character?.videoUrl && (
                  <button
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors backdrop-blur-sm z-10 font-medium"
                    onClick={() => setShowVideo(true)}
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Video
                  </button>
                )}
              </>
            )}
          </div>

          {/* Profile Info */}
          <div className="p-4">
            <h4 className="text-2xl font-bold mb-1">{character?.name}</h4>
            <p className="text-muted-foreground mb-4">{character?.description}</p>

            <div className="flex flex-col gap-2 mb-6">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-none font-bold h-12"
                onClick={handleAdvancedGenerate}
              >
                <Wand2 className="mr-2 h-5 w-5" />
                {t("generate.generate")}
              </Button>
            </div>
            <h3 className="text-lg font-medium mb-4">{t("chat.aboutMe")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <ProfileDetail icon="🎂" label={t("profile.age").toUpperCase()} value={character?.age?.toString() || "25"} />
              <ProfileDetail icon="💪" label={t("profile.body").toUpperCase()} value={character?.body || "Average"} />
              <ProfileDetail icon="🌎" label={t("profile.ethnicity").toUpperCase()} value={character?.ethnicity || "Mixed"} />
              <ProfileDetail icon="🗣️" label={t("profile.language").toUpperCase()} value={character?.language || "English"} />
              <ProfileDetail icon="💑" label={t("profile.relationship").toUpperCase()} value={character?.relationship || "Single"} />
              <ProfileDetail icon="💼" label={t("profile.occupation").toUpperCase()} value={character?.occupation || "Student"} />
              <ProfileDetail icon="🎯" label={t("profile.hobbies").toUpperCase()} value={character?.hobbies || "Reading, Music"} />
              <ProfileDetail icon="😊" label={t("profile.personality").toUpperCase()} value={character?.personality || "Friendly"} />
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <DebugPanel
        characterId={characterId}
        chatId={characterId}
        handleClearChat={handleClearChat}
        handleResetCharacter={() => { }}
        isOpen={false}
      />
      <SupabaseDebug />
      <PremiumUpgradeModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        mode={premiumModalMode}
        feature={premiumModalFeature}
        description={premiumModalDescription}
        imageSrc={character?.image || "https://res.cloudinary.com/ddg02aqiw/image/upload/v1766963040/premium-modals/premium_upgrade.jpg"}
      />

      <PremiumUpgradeModal
        isOpen={showTokensDepletedModal}
        onClose={() => setShowTokensDepletedModal(false)}
        mode="tokens-depleted"
        feature="Tokens Slut"
        description="Du har inga tokens kvar. Köp mer för att generera fler bilder eller använda premiumfunktioner."
        imageSrc="https://res.cloudinary.com/ddg02aqiw/image/upload/v1766963046/premium-modals/tokens_depleted.jpg"
      />

      <PremiumUpgradeModal
        isOpen={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        mode="expired"
        feature="Premium Utgått"
        description="Ditt Premium-medlemskap har utgått. Förnya för att fortsätta chatta och skapa obegränsat."
      />

      {selectedImage && (
        <ImageModal
          open={!!selectedImage}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedImage(null)
              setSelectedImagePrompt("")
            }
          }}
          images={selectedImage}
          initialIndex={0}
          onDownload={(url, index) => {
            const a = document.createElement('a')
            a.href = url
            a.download = `generated-${index}.jpg`
            a.click()
          }}
          onShare={(url) => {
            navigator.clipboard.writeText(url)
            toast.success("Link copied to clipboard!")
          }}
          onSave={(index) => handleSaveImage(selectedImage[index], selectedImagePrompt)}
          savingIndex={isSaving ? 0 : null} // Simple visual feedback
        />
      )}
    </div>
  )
}

function ProfileDetail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-card p-3 rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm">{value}</div>
    </div>
  )
}
