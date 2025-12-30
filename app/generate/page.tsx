"use client"

import { Suspense } from "react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Wand2, Loader2, Download, Share2, AlertCircle, ChevronLeft, FolderOpen, Clock, Image as ImageIcon, X, Coins, Sparkles, Lock, Save } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { ImageModal } from "@/components/image-modal"
import { useAuth } from "@/components/auth-context"
import { useSidebar } from "@/components/sidebar-context"
import { createClient } from "@/utils/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import {
  getImageSuggestions,
  getImageSuggestionsByCategory,
  type ImageSuggestion,
} from "@/app/actions/image-suggestions"
import { InsufficientTokensDialog } from "@/components/insufficient-tokens-dialog"
import { PremiumUpgradeModal } from "@/components/premium-upgrade-modal"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuthModal } from "@/components/auth-modal-context"
import { containsNSFW } from "@/lib/nsfw-filter"
import { useCharacters } from "@/components/character-context"

// Remove the static imageOptions array and replace with dynamic calculation
// Get selected option for token calculation - move this logic up and make it dynamic
const imageOptions = [
  { value: "1", label: "1 Image", tokens: 0 },
  { value: "4", label: "4 Images", tokens: 20 },
  { value: "6", label: "6 Images", tokens: 30 },
  { value: "8", label: "8 Images", tokens: 40 },
]

export default function GenerateImagePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <GenerateContent />
    </Suspense>
  )
}

function GenerateContent() {
  const { toast } = useToast()
  const { user, isLoading, refreshUser } = useAuth()
  const { openLoginModal } = useAuthModal()
  const router = useRouter()
  const { setIsOpen } = useSidebar()
  const isMobile = useIsMobile()
  const { refreshCharacters } = useCharacters()
  const searchParams = useSearchParams()
  const promptParam = searchParams.get('prompt') || ""
  const characterId = searchParams.get('characterId') || null
  const [prompt, setPrompt] = useState(promptParam)
  const [isMounted, setIsMounted] = useState(false)

  // Use useEffect to update prompt when searchParams change, without full remount
  useEffect(() => {
    if (promptParam && isMounted) {
      setPrompt(promptParam)
    }
  }, [promptParam, isMounted])

  useEffect(() => {
    setIsMounted(true)
  }, [])
  const [negativePrompt, setNegativePrompt] = useState("")
  const [showNegativePrompt, setShowNegativePrompt] = useState(false)
  const [selectedCount, setSelectedCount] = useState("1")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<ImageSuggestion[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState("")
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [savingImageIndex, setSavingImageIndex] = useState<number | null>(null)
  const [isSavingAll, setIsSavingAll] = useState(false)
  // const [autoSaving, setAutoSaving] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [timeoutWarning, setTimeoutWarning] = useState(false)
  const [savedImageUrls, setSavedImageUrls] = useState<Set<string>>(new Set())
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false)
  const [tokenBalanceInfo, setTokenBalanceInfo] = useState({
    currentBalance: 0,
    requiredTokens: 5
  })
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [showTokensDepletedModal, setShowTokensDepletedModal] = useState(false)
  const [freeGenerationsCount, setFreeGenerationsCount] = useState(0)
  const [isCheckingUsage, setIsCheckingUsage] = useState(true)



  // Helper function to get valid image src
  const getValidImageSrc = (src: string | null | undefined, fallback: string): string => {
    if (typeof src === "string" && src.trim() !== "") {
      return src
    }
    return fallback
  }

  // Use premium status from context
  const isPremium = user?.isPremium || false
  const isCheckingPremium = isLoading

  // Calculate tokens required for button display
  const selectedOption = imageOptions.find((option) => option.value === selectedCount)
  const tokensRequired = selectedCount === "1" ? 0 : (selectedOption?.tokens || 5)
  // For admins, show 0 tokens or specific text
  const displayTokens = user?.isAdmin ? 0 : tokensRequired;

  // Automatically close the sidebar on component mount
  useEffect(() => {
    setIsOpen(false)
  }, [setIsOpen])



  // Fetch suggestions on component mount
  useEffect(() => {
    async function loadSuggestions() {
      setIsLoadingSuggestions(true)
      try {
        const data = await getImageSuggestions()
        setSuggestions(data)

        // Extract unique categories
        const uniqueCategories = Array.from(new Set(data.map((item) => item.category)))
        setCategories(uniqueCategories)

        // Set default active category if available
        if (uniqueCategories.length > 0) {
          setActiveCategory(uniqueCategories[0])
        }
      } catch (error) {
        console.error("Error loading suggestions:", error)
        toast({
          title: "Error",
          description: "Failed to load suggestions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    loadSuggestions()
  }, [toast])

  // Fetch free usage count
  useEffect(() => {
    async function checkUsage() {
      if (!user) return
      setIsCheckingUsage(true)
      try {
        const response = await fetch('/api/user-usage-stats')
        const data = await response.json()
        if (data.success) {
          // For now, using imagesGenerated as a proxy for free usage
          // in a production app, we'd specifically track free vs paid generations
          setFreeGenerationsCount(data.imagesGenerated || 0)
        }
      } catch (error) {
        console.error("Error checking usage stats:", error)
      } finally {
        setIsCheckingUsage(false)
      }
    }

    checkUsage()
  }, [user])

  // Handle category change
  const handleCategoryChange = async (category: string) => {
    setActiveCategory(category)
    setIsLoadingSuggestions(true)

    try {
      const data = await getImageSuggestionsByCategory(category)
      setSuggestions(data)
    } catch (error) {
      console.error("Error loading suggestions for category:", error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current)
      }

    }
  }, [])

  // Progress simulation for better UX
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null

    if (isGenerating) {
      setGenerationProgress(0)
      setTimeoutWarning(false)

      progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) {
            // Show timeout warning after 20 seconds
            if (prev >= 95) {
              setTimeoutWarning(true)
            }
            return prev + 0.5 // Slow down near the end
          }
          return prev + Math.random() * 3 + 1 // Random progress increments
        })
      }, 1000)
    } else {
      setGenerationProgress(0)
      setTimeoutWarning(false)
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [isGenerating])

  // Manual save logic is handled by the Save button
  const savedImagesRef = useRef<Set<string>>(new Set())

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setIsModalOpen(true)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for the image you want to generate.",
        variant: "destructive",
      })
      return
    }

    // Check if user is logged in
    if (!user) {
      // Show login modal instead of redirecting
      openLoginModal()
      return
    }

    // Check for NSFW content in prompt for free users
    if (!isPremium && !user.isAdmin && containsNSFW(prompt)) {
      toast({
        title: "NSFW Content Detected",
        description: "Free users can only generate SFW images. Please upgrade to Premium to generate NSFW content.",
        variant: "destructive",
      })
      setShowPremiumModal(true)
      return
    }

    // Check free limit for non-premium users
    if (!isPremium && !user.isAdmin && freeGenerationsCount >= 1) {
      setShowPremiumModal(true)
      return
    }

    // Check image count for free users
    if (!isPremium && !user.isAdmin && selectedCount !== "1") {
      setShowPremiumModal(true)
      return
    }

    // Check token balance logic has been moved to the backend to prevent double deduction
    const selectedOption = imageOptions.find((option) => option.value === selectedCount)
    const tokensRequired = selectedCount === "1" ? 0 : (selectedOption?.tokens || 5)

    setIsGenerating(true)
    setError(null)
    setGeneratedImages([])
    setGenerationProgress(0)
    setTimeoutWarning(false)

    try {
      let response: Response
      let endpoint: string
      let requestBody: any

      // Always use Seedream 3.0 API now
      endpoint = "/api/generate-image"
      requestBody = {
        prompt,
        negativePrompt,
        model: "stability",
        response_format: "url",
        size: "512x1024",
        seed: -1,
        guidance_scale: 7.5,
        watermark: true,
        selectedCount, // Send the number of images selected
        selectedModel: "stability", // Send the model type for token calculation
        characterId, // extracted from searchParams
      }

      // Create AbortController for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        setError("Request timed out. Please try again with a simpler prompt or fewer images.")
        setIsGenerating(false)
      }, 45000) // 45 second timeout on frontend

      try {
        // Get the current session token for authentication
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        let accessToken = session?.access_token

        // If we don't have a token, try a refresh, but don't treat it as a hard error if it fails.
        if (!accessToken) {
          console.log("🔄 No access token found, attempting to refresh session...")
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshData?.session) {
            accessToken = refreshData.session.access_token
            console.log("✅ Session refreshed successfully")
          } else if (refreshError) {
            console.warn("⚠️ Session refresh failed:", refreshError.message)
          }
        }

        // Now, decide which auth method to use
        if (accessToken) {
          console.log("✅ Using access token for authentication.")
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          })
        } else if (user?.id) {
          console.log("🔄 No access token, falling back to User ID.")
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-ID": user.id,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          })
        } else {
          // If we have no token and no user ID, then we are truly unauthenticated.
          throw new Error("Unable to authenticate. Please log out and log in again.")
        }

        clearTimeout(timeoutId) // Clear timeout since fetch completed
      } catch (fetchError) {
        clearTimeout(timeoutId) // Also clear on error
        if (fetchError && typeof fetchError === "object" && "name" in fetchError && fetchError.name === "AbortError") {
          setError("Request timed out. The image generation is taking longer than expected. Please try again.")
        } else {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "An unexpected network error occurred.",
          )
        }
        setIsGenerating(false)
        return
      }

      // Enhanced error handling for non-JSON responses
      let data
      try {
        // First check if the response is ok
        if (!response.ok) {
          // Handle specific status codes
          if (response.status === 408 || response.status === 504) {
            setError("Request timed out. Please try again with a simpler prompt or fewer images.")
            setIsGenerating(false)
            return
          }

          // Try to get error message from response
          let errorMessage = `Request failed with status ${response.status}`
          try {
            const errorText = await response.text()
            // Try to parse as JSON first
            try {
              const errorJson = JSON.parse(errorText)
              errorMessage = errorJson.error || errorJson.message || errorMessage

              // Handle insufficient tokens (402 Payment Required)
              if (response.status === 402) {
                setTokenBalanceInfo({
                  currentBalance: errorJson.currentBalance || 0,
                  requiredTokens: errorJson.requiredTokens || tokensRequired
                })

                if (isPremium) {
                  setShowTokensDepletedModal(true)
                } else {
                  setShowInsufficientTokens(true)
                }

                setIsGenerating(false)
                return
              }

              // Handle premium restriction error
              if (response.status === 403 && errorJson.upgradeUrl) {
                setError(errorMessage)
                setIsGenerating(false)
                toast({
                  title: "Premium Feature",
                  description: errorMessage,
                  variant: "destructive",
                  duration: 8000
                })
                return
              }
            } catch {
              // If not JSON, use the text if it's reasonable length
              if (errorText && errorText.length < 200 && !errorText.includes("<html>")) {
                errorMessage = errorText
              }
            }
          } catch {
            // Fallback to status text
            errorMessage = response.statusText || errorMessage
          }

          if (response.status === 401) {
            setError("Din session har gått ut. Vänligen logga in igen.")
            setIsGenerating(false)
            return
          }

          throw new Error(errorMessage)
        }

        // Try to parse successful response as JSON
        const responseText = await response.text()
        if (!responseText) {
          throw new Error("Empty response from server")
        }

        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", responseText)
          throw new Error("Invalid response format from server")
        }
      } catch (error) {
        console.error("Error processing response:", error)
        setError(
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Failed to process the server response.",
        )
        setIsGenerating(false)
        return
      }

      console.log("Received data from /api/generate-image:", JSON.stringify(data, null, 2));
      if (data.task_id) {
        setCurrentTaskId(data.task_id);
        startStatusCheck(data.task_id);

        // We no longer refresh user balance immediately on submission to avoid render collisions.
        // Balance will be updated when status check completes successfully or fails.

        // Increment free generations count if this was a free one
        if (!isPremium && !user?.isAdmin && selectedCount === "1") {
          setFreeGenerationsCount(prev => prev + 1)
        }
      } else {
        throw new Error("No Task ID or direct images returned from the API.");
      }
    } catch (error) {
      console.error("Error generating image:", error)

      // Handle timeout errors specifically
      if (error && typeof error === "object" && "name" in error && error.name === "AbortError") {
        setError("Request timed out. Please try again with a simpler prompt or fewer images.")
      } else {
        // Check if the error response includes refund information
        let errorMessage = typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "An unexpected error occurred"

        // If tokens were refunded, add that information to the error message
        if (typeof error === "object" && error !== null && "refunded" in error && error.refunded) {
          errorMessage += " Your tokens have been refunded."
        }

        setError(errorMessage)
      }
      setIsGenerating(false)
    }
  }

  const startStatusCheck = (taskId: string) => {
    // Clear any existing interval
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current)
    }

    // Check status immediately, then start interval
    checkGenerationStatus(taskId)
    statusCheckInterval.current = setInterval(() => {
      checkGenerationStatus(taskId)
    }, 3000) // Check every 3 seconds
  }

  const checkGenerationStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/check-generation?taskId=${taskId}`)
      if (!response.ok) {
        // Stop polling on non-transient errors
        if (response.status >= 400 && response.status < 500) {
          if (statusCheckInterval.current) clearInterval(statusCheckInterval.current)
          setError("Failed to check generation status. Please try again.")
          setIsGenerating(false)
        }
        return // Continue polling on server errors
      }

      const result = await response.json()

      if (result.status === "TASK_STATUS_SUCCEED") {
        if (statusCheckInterval.current) clearInterval(statusCheckInterval.current)
        setGeneratedImages(result.images || [])
        setGenerationProgress(100)
        setIsGenerating(false)

        // Refresh user balance ONLY when generation is complete and we are no longer in generating state
        if (typeof refreshUser === 'function') {
          setTimeout(() => refreshUser(), 1000)
        }

        toast({
          title: "Success!",
          description: `Your image${(result.images?.length || 0) > 1 ? "s have" : " has"} been generated.`,
        })
      } else if (result.status === "TASK_STATUS_FAILED") {
        if (statusCheckInterval.current) clearInterval(statusCheckInterval.current)
        setError(result.reason || "Image generation failed. Please try again.")
        setIsGenerating(false)

        // Also refresh user balance on failure in case of refunds
        if (typeof refreshUser === 'function') {
          setTimeout(() => refreshUser(), 1000)
        }
      } else {
        // Update progress if available
        if (result.progress) {
          setGenerationProgress(result.progress)
        }
      }
    } catch (error) {
      console.error("Error checking status:", error)
      // Don't stop polling on network errors, just log them
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt((prev) => {
      // If prompt is empty, just add the suggestion
      if (!prev.trim()) {
        return suggestion
      }
      // If prompt already ends with comma, add space and suggestion
      if (prev.trim().endsWith(',')) {
        return `${prev} ${suggestion}`
      }
      // Otherwise, add comma, space, and suggestion
      return `${prev}, ${suggestion}`
    })
  }

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `generated-image-${index + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading image:", error)
      toast({
        title: "Download failed",
        description: "Failed to download the image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = (imageUrl: string) => {
    navigator.clipboard.writeText(imageUrl)
    toast({ title: "Image URL copied to clipboard" })
  }

  const handleDownloadAll = async () => {
    try {
      for (let i = 0; i < generatedImages.length; i++) {
        await handleDownload(generatedImages[i], i)
        // Add a small delay between downloads to prevent browser issues
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error("Error downloading all images:", error)
      toast({
        title: "Download failed",
        description: "Failed to download all images. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveAll = async () => {
    if (generatedImages.length === 0) return
    setIsSavingAll(true)
    try {
      let savedCount = 0
      for (let i = 0; i < generatedImages.length; i++) {
        // Use the existing save function but suppress individual toasts
        const success = await saveImageToCollection(generatedImages[i], i, false)
        if (success) savedCount++
      }
      toast({
        title: "All images saved",
        description: `Successfully saved ${savedCount} images to your collection.`,
      })
    } catch (error) {
      console.error("Error saving all images:", error)
    } finally {
      setIsSavingAll(false)
      setSavingImageIndex(-1)
      // Synchronize character data across the app
      if (typeof refreshCharacters === 'function') {
        refreshCharacters()
      }
    }
  }

  const saveImageToCollection = async (imageUrl: string, index: number, showToast = true) => {
    try {
      if (index >= 0) {
        setSavingImageIndex(index)
      }

      // Build the request body
      const { getAnonymousUserId } = await import("@/lib/anonymous-user")
      const saveBody = {
        imageUrl: imageUrl,
        prompt: prompt,
        modelUsed: "stability",
        userId: user?.id || getAnonymousUserId(),
        characterId: characterId, // Include character ID if present
      }

      // Call the save-generated-image API to upload to Cloudinary and save to database
      const response = await fetch("/api/save-generated-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save image")
      }

      // Check if image was already saved
      if (data.message === "Image already saved") {
        if (showToast) {
          toast({
            title: "Already saved",
            description: "This image is already in your collection.",
          })
        }
        return true
      }

      if (showToast) {
        toast({
          title: "Success",
          description: "Image saved to your collection with permanent URL",
        })
      }

      // Track that this image has been saved
      setSavedImageUrls(prev => {
        const next = new Set(prev)
        next.add(imageUrl)
        return next
      })

      return true
    } catch (error) {
      console.error("Error saving image:", error)
      if (showToast) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save image to collection",
          variant: "destructive",
        })
      }
      return false
    } finally {
      if (index >= 0 && !isSavingAll) {
        setSavingImageIndex(null)
      }

      // Synchronize character data across the app if it was a single save
      if (!isSavingAll && typeof refreshCharacters === 'function') {
        refreshCharacters()
      }
    }
  }

  const viewCollection = () => {
    router.push("/collections")
  }





  return (
    <div
      key="generate-page-root-stable"
      className={`flex flex-col bg-background text-foreground ${!isMobile ? 'lg:flex-row' : ''} min-h-screen`}
      translate="no"
    >
      {!isMounted ? (
        <div className="flex-1 flex items-center justify-center h-screen w-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Left Column - Generation Controls */}
          <div className={`w-full ${isMobile ? 'p-4' : 'lg:w-1/2 p-6'} border-b lg:border-b-0 lg:border-r border-border overflow-y-auto`}>
            <div className={`flex justify-between items-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="mr-1 p-0" onClick={() => router.back()} aria-label="Go back">
                  <ChevronLeft className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                </Button>
                <Wand2 className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                  Generate Image
                </h1>

                {user && (
                  <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-black italic tabular-nums text-yellow-500">
                      {user.isAdmin ? "∞" : user.tokenBalance}
                    </span>
                  </div>
                )}

                {/* Debug: Show premium status */}
                {!isCheckingPremium && isPremium && (
                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    👑 Premium
                  </span>
                )}
              </div>
            </div>


            {/* Suggestions */}
            <div className={`${isMobile ? 'mb-4' : 'mb-6'}`} key="suggestions-container">
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold ${isMobile ? 'mb-3' : 'mb-4'}`}>Create your love from suggestions</h3>
              <div className="min-h-[100px]" key="suggestions-stable-wrapper">
                {categories.length > 0 ? (
                  <Tabs defaultValue={categories[0]} value={activeCategory} onValueChange={handleCategoryChange} key="suggestions-tabs">
                    <TabsList className={`${isMobile ? 'mb-3 p-0.5' : 'mb-4 p-1'} bg-card border border-border rounded-lg`}>
                      {categories.map((category) => (
                        <TabsTrigger
                          key={`cat-${category}`}
                          value={category}
                          className={`capitalize text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md ${isMobile ? 'text-xs px-2 py-1' : ''}`}
                        >
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div key="suggestions-grid" className={`grid ${isMobile ? 'grid-cols-4 gap-1 p-1' : 'grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 p-1 sm:p-2'}`}>
                      {isLoadingSuggestions
                        ? Array.from({ length: 8 }).map((_, index) => (
                          <div key={`sug-loading-${index}`} className="aspect-square rounded-lg bg-muted animate-pulse" />
                        ))
                        : suggestions
                          .filter((suggestion) => suggestion.category === activeCategory && suggestion.is_active)
                          .map((suggestion) => (
                            <div
                              key={`sug-${suggestion.id}`}
                              className="relative aspect-square rounded-lg overflow-hidden group hover:ring-2 hover:ring-primary transition-all cursor-pointer min-w-0"
                              onClick={() => handleSuggestionClick(suggestion.name)}
                            >
                              <Image
                                src={getValidImageSrc(
                                  suggestion.image,
                                  `/placeholder.svg?height=88&width=88&query=${encodeURIComponent(suggestion.name || "suggestion")}`,
                                )}
                                alt={suggestion.name}
                                width={88}
                                height={88}
                                className="w-full h-full object-cover rounded-lg"
                                unoptimized={true}
                                onError={(e) => {
                                  e.currentTarget.src = `/placeholder.svg?height=88&width=88&query=${encodeURIComponent(suggestion.name || "suggestion")}`
                                }}
                              />
                              <div className={`absolute inset-0 bg-black/40 flex items-end ${isMobile ? 'p-1' : 'p-1.5 sm:p-2'} rounded-lg`}>
                                <span className={`${isMobile ? 'text-xs' : 'text-xs sm:text-sm'} font-medium text-white leading-tight line-clamp-2`}>
                                  {suggestion.name}
                                </span>
                              </div>
                            </div>
                          ))}
                    </div>
                  </Tabs>
                ) : (
                  <div key="suggestions-empty" className="text-center py-8 text-muted-foreground">No suggestion categories available.</div>
                )}
              </div>
            </div>



            {/* Prompt Input */}
            <div className={`relative ${isMobile ? 'mb-4' : 'mb-6'}`}>
              <div className={`absolute ${isMobile ? 'right-2 top-2' : 'right-3 top-3'} flex flex-col gap-1`}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(prompt)
                    toast({ title: "Copied to clipboard" })
                  }}
                  className="p-2 hover:bg-gray-600 rounded transition-colors"
                  title="Copy"
                >
                  <Copy className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400 hover:text-white`} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.readText().then((text) => {
                      setPrompt(text)
                      toast({ title: "Pasted from clipboard" })
                    })
                  }}
                  className="p-2 hover:bg-gray-600 rounded transition-colors"
                  title="Paste"
                >
                  <ImageIcon className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400 hover:text-white`} />
                </button>
                <button
                  onClick={() => {
                    setPrompt("")
                    toast({ title: "Prompt cleared" })
                  }}
                  className="p-2 hover:bg-gray-600 rounded transition-colors"
                  title="Clear"
                >
                  <X className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400 hover:text-white`} />
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className={`w-full ${isMobile ? 'h-40 text-sm' : 'h-48'} bg-card rounded-xl ${isMobile ? 'p-3' : 'p-4'} pr-14 resize-none focus:outline-none focus:ring-2 focus:ring-primary border border-border`}
                placeholder="Describe the image you want to generate..."
              />
            </div>

            {/* Show Negative Prompt - Only in image mode */}
            {/* Show Negative Prompt */}
            <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNegativePrompt(!showNegativePrompt)}
                className={`text-muted-foreground hover:text-foreground ${isMobile ? 'text-xs' : ''}`}
              >
                {showNegativePrompt ? "Hide Negative Prompt" : "Show Negative Prompt"}
              </Button>

              {/* Negative Prompt Input - Only shown when toggled */}
              {showNegativePrompt && (
                <div className={`${isMobile ? 'mt-2' : 'mt-3'}`}>
                  <label htmlFor="negative-prompt" className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground ${isMobile ? 'mb-1' : 'mb-2'}`}>
                    Negative Prompt (what to avoid in the image)
                  </label>
                  <textarea
                    id="negative-prompt"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className={`w-full ${isMobile ? 'h-16 text-xs p-3' : 'h-20 p-4 text-sm'} bg-card rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary border border-border`}
                    placeholder="Elements to exclude from the image..."
                  />
                </div>
              )}
            </div>



            {/* Number of Images */}
            <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>Number of Images</h3>
                {!isPremium && !isCheckingPremium && !user?.isAdmin && (
                  <span className="text-xs text-muted-foreground">
                    🆓 Free: 1 image only
                  </span>
                )}
              </div>
              <div className={`flex flex-wrap ${isMobile ? 'gap-1' : 'gap-2 md:gap-4'}`}>
                {imageOptions.map((option) => {
                  // Don't disable options while checking premium status or for admins
                  const isDisabled = !isCheckingPremium && !isPremium && !user?.isAdmin && option.value !== "1"
                  const isSelected = selectedCount === option.value
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        if (!isPremium && !user?.isAdmin && option.value !== "1") {
                          setShowPremiumModal(true)
                          return
                        }
                        // If free user already used their 1 free image, show premium modal on click
                        if (!isPremium && !user?.isAdmin && freeGenerationsCount >= 1) {
                          setShowPremiumModal(true)
                          return
                        }
                        setSelectedCount(option.value)
                      }}
                      className={`flex flex-col items-center gap-1 ${isMobile ? 'px-3 py-2' : 'px-8 py-4'} rounded-xl transition-all relative border-2 ${isSelected
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                        : isDisabled
                          ? "bg-card/50 text-muted-foreground border-muted/50 cursor-pointer"
                          : "bg-card border-border text-foreground hover:border-primary/50"
                        }`}
                    >
                      <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>{option.label}</span>
                      {option.value !== "1" ? (
                        <div className="flex flex-col items-center">
                          <div className={`flex items-center gap-1 ${isSelected ? 'text-primary-foreground/90' : 'text-amber-500'} font-black text-[9px] uppercase tracking-tighter`}>
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Premium Required</span>
                          </div>
                          <span className={`${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'} text-[9px] font-medium`}>{option.tokens} tokens</span>
                        </div>
                      ) : (
                        <span className={`${isSelected ? 'text-primary-foreground/90' : 'text-emerald-500'} font-black text-[9px] uppercase tracking-wider`}>GRATIS SFW</span>
                      )}
                      {isDisabled && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-black p-0.5 rounded-full shadow-md">
                          <Lock className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {!isPremium && !isCheckingPremium && !user?.isAdmin && (
                <div className={`${isMobile ? 'mt-2 p-2' : 'mt-3 p-3'} bg-primary/10 border border-primary/20 rounded-lg`}>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-foreground mb-2`}>
                    <span className="font-semibold">Want to generate multiple images?</span>
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mb-2`}>
                    Upgrade to Premium to generate 4, 6, or 8 images at once!
                  </p>
                  <Button
                    size={isMobile ? "sm" : "default"}
                    variant="default"
                    className="w-full"
                    onClick={() => setShowPremiumModal(true)}
                  >
                    Upgrade to Premium
                  </Button>
                </div>
              )}
              {selectedCount !== "1" && (
                <div className={`${isMobile ? 'mt-1 text-xs' : 'mt-2 text-sm'} text-muted-foreground`}>
                  5 tokens per image
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className={`${isMobile ? 'mb-4 p-3' : 'mb-6 p-4'} bg-destructive/20 border border-destructive text-destructive-foreground rounded-lg flex items-center`}>
                <AlertCircle className={`${isMobile ? 'h-4 w-4 mr-2' : 'h-5 w-5 mr-2'}`} />
                <span className={`${isMobile ? 'text-sm' : ''}`}>{error}</span>
              </div>
            )}

            {/* Generate Button */}
            <div className="relative">
              <Button
                className={`w-full ${isMobile ? 'py-4 text-base' : 'py-6 text-lg'} bg-primary hover:bg-primary/90 text-primary-foreground`}
                disabled={!prompt.trim() || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className={`mr-2 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'} animate-spin`} />
                    Generating... {Math.round(generationProgress)}%
                  </>
                ) : (
                  <>
                    <Wand2 className={`mr-2 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    Generate Image ({user?.isAdmin ? 'Free' : (displayTokens === 0 ? 'Free' : `${displayTokens} tokens`)})
                  </>
                )}
              </Button>
            </div>

            {/* View Collection Button - Hidden as requested */}
            {/* {generatedImages.length > 0 && (
          <div className={`${isMobile ? 'mt-4' : 'mt-6'}`}>
            <Button variant="outline" className={`w-full bg-transparent ${isMobile ? 'py-3 text-sm' : ''}`} onClick={viewCollection}>
              <FolderOpen className={`${isMobile ? 'h-4 w-4 mr-2' : 'h-5 w-5 mr-2'}`} />
              View Your Collection
            </Button>
          </div>
        )} */}
          </div>

          {/* Right Column - Generated Media */}
          <div className={`w-full ${isMobile ? 'p-4' : 'lg:w-1/2 p-6'} overflow-y-auto`} key="right-column">
            <div className={`flex justify-between items-center ${isMobile ? 'mb-4' : 'mb-6'}`} key="results-header">
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} key="results-title">
                Generated Images
              </h2>
              <div key="action-buttons-container">
                {generatedImages.length > 0 && (
                  <div className={`flex ${isMobile ? 'flex-col gap-1' : 'gap-2'}`} key="action-buttons">
                    <Button variant="outline" size="sm" onClick={handleDownloadAll} className={isMobile ? 'text-xs px-2 py-1' : ''}>
                      <Download className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                      {isMobile ? 'Download All' : 'Download All'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveAll}
                      disabled={isSavingAll}
                      className={isMobile ? 'text-xs px-2 py-1' : ''}
                    >
                      {isSavingAll ? (
                        <Loader2 className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'} animate-spin`} />
                      ) : (
                        <Save className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                      )}
                      {isMobile ? 'Save All' : 'Save All'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push("/collections")} className={isMobile ? 'text-xs px-2 py-1' : ''}>
                      <FolderOpen className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                      Collection
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-[400px]" key="results-container">
              {isGenerating ? (
                <div key="generating-state-media" className={`flex flex-col items-center justify-center ${isMobile ? 'h-[50vh]' : 'h-[70vh]'} text-center`}>
                  <div className="relative mb-8">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Wand2 className="h-8 w-8 sm:h-12 sm:w-12 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Creating Your Masterpiece</h3>
                  <p className="text-muted-foreground max-w-md px-4 mb-4">
                    Our AI is painting your vision. This usually takes 10-30 seconds.
                  </p>
                  <div className="w-full max-w-xs bg-card border border-border h-2.5 rounded-full overflow-hidden mb-2">
                    <div
                      className="bg-primary h-full transition-all duration-500 ease-out"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs font-medium text-primary uppercase tracking-tighter tabular-nums">
                    Generation in progress: {Math.round(generationProgress)}%
                  </p>

                  {timeoutWarning && (
                    <div key="gen-timeout-warning-wrapper" className="mt-6 flex items-center gap-2 text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20" suppressHydrationWarning>
                      <Clock className="h-4 w-4 animate-pulse" />
                      <span className="text-xs font-semibold uppercase tracking-tight">Taking longer than expected...</span>
                    </div>
                  )}
                </div>
              ) : (generatedImages.length === 0 && !error) ? (
                <div key="empty-state-media-wrapper" className={`flex flex-col items-center justify-center ${isMobile ? 'h-[50vh]' : 'h-[70vh]'} text-center`}>
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-card border border-border rounded-full flex items-center justify-center mb-6">
                    <ImageIcon className="h-10 w-10 sm:h-16 sm:w-16 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Ready to Create?</h3>
                  <p className="text-muted-foreground max-w-sm px-4">
                    Enter a description on the left and click "Generate" to see your imagination come to life.
                  </p>
                </div>
              ) : generatedImages.length > 0 ? (
                <div key="result-state-media-wrapper" className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 sm:grid-cols-2 gap-4'}`}>
                  {generatedImages.map((image, index) => (
                    <div
                      key={`generated-image-box-${index}`}
                      className="relative aspect-[512/1024] rounded-xl overflow-hidden group cursor-pointer border border-border shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                        src={image}
                        alt={`Generated ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0 transform transition-transform duration-500">
                        <Button
                          size="sm"
                          className="flex-1 bg-white hover:bg-white/90 text-black font-bold h-10 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(image, index)
                          }}
                        >
                          <Download className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleShare(image)
                          }}
                          className={`${isMobile ? 'text-xs px-2 py-1' : ''} h-10 font-bold backdrop-blur-md`}
                        >
                          <Share2 className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                          Share
                        </Button>
                      </div>
                      <div className={`absolute bottom-2 right-2 bg-background/80 text-foreground ${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} rounded font-bold`}>
                        #{index + 1}
                      </div>
                      {savedImageUrls.has(image) && (
                        <div className={`absolute top-2 right-2 bg-green-500/80 text-white ${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} rounded-full font-bold shadow-lg`}>
                          Saved
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div key="no-results-placeholder" className="h-0 w-0" />
              )}
            </div>
          </div>

          {/* Image Modal */}
          <ImageModal
            images={generatedImages}
            initialIndex={selectedImageIndex}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onDownload={handleDownload}
            onShare={handleShare}
            onSave={(index) => saveImageToCollection(generatedImages[index], index)}
            savingIndex={savingImageIndex}
          />

          {/* Insufficient Tokens Dialog */}
          <InsufficientTokensDialog
            open={showInsufficientTokens}
            onOpenChange={setShowInsufficientTokens}
            currentBalance={tokenBalanceInfo.currentBalance}
            requiredTokens={tokenBalanceInfo.requiredTokens}
          />

          {/* Premium Upgrade Modal */}
          <PremiumUpgradeModal
            isOpen={showPremiumModal}
            onClose={() => setShowPremiumModal(false)}
            feature="Uppgradera till Premium"
            description="Upgrade to Premium to generate unlimited images."
            imageSrc="https://res.cloudinary.com/ddg02aqiw/image/upload/v1766963040/premium-modals/premium_upgrade.jpg"
          />

          {/* Tokens Depleted Modal (for Premium Users) */}
          <PremiumUpgradeModal
            isOpen={showTokensDepletedModal}
            onClose={() => setShowTokensDepletedModal(false)}
            mode="tokens-depleted"
            feature="Tokens Slut"
            description="You used your 100 free premium tokens. Buy more tokens to use premium features"
            imageSrc="https://res.cloudinary.com/ddg02aqiw/image/upload/v1766963046/premium-modals/tokens_depleted.jpg"
          />


        </>
      )}
    </div>
  )
}
