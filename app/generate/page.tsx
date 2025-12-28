"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Wand2, Loader2, Download, Share2, AlertCircle, ChevronLeft, FolderOpen, Clock, Image as ImageIcon, X, Coins, Sparkles, Lock } from "lucide-react"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { ImageModal } from "@/components/image-modal"
import { useAuth } from "@/components/auth-context"
import { useSidebar } from "@/components/sidebar-context"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
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

// Remove the static imageOptions array and replace with dynamic calculation
// Get selected option for token calculation - move this logic up and make it dynamic
const imageOptions = [
  { value: "1", label: "1 Image", tokens: 0 },
  { value: "4", label: "4 Images", tokens: 20 },
  { value: "6", label: "6 Images", tokens: 30 },
  { value: "8", label: "8 Images", tokens: 40 },
]

export default function GenerateImagePage() {
  const { toast } = useToast()
  const { user, isLoading, refreshUser } = useAuth()
  const { openLoginModal } = useAuthModal()
  const router = useRouter()
  const { setIsOpen } = useSidebar()
  const isMobile = useIsMobile()
  const [prompt, setPrompt] = useState("")
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

        // Refresh auth context user data to update token balance
        if (typeof refreshUser === 'function') {
          refreshUser().catch(e => console.error("Failed to refresh user after generation:", e))
        }

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
        toast({
          title: "Success!",
          description: `Your image${(result.images?.length || 0) > 1 ? "s have" : " has"} been generated.`,
        })
      } else if (result.status === "TASK_STATUS_FAILED") {
        if (statusCheckInterval.current) clearInterval(statusCheckInterval.current)
        setError(result.reason || "Image generation failed. Please try again.")
        setIsGenerating(false)
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

  const saveImageToCollection = async (imageUrl: string, index: number, showToast = true) => {
    try {
      if (index >= 0) {
        setSavingImageIndex(index)
      }

      // Call the save-generated-image API to upload to Cloudinary and save to database
      const response = await fetch("/api/save-generated-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          prompt: prompt,
          modelUsed: "stability",
          userId: user?.id,
        }),
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
        return false
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
      if (index >= 0) {
        setSavingImageIndex(null)
      }
    }
  }

  const viewCollection = () => {
    router.push("/collections")
  }





  return (
    <div className={`flex flex-col ${isMobile ? 'min-h-screen' : 'lg:flex-row min-h-screen'} bg-background text-foreground`}>
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
        <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold ${isMobile ? 'mb-3' : 'mb-4'}`}>Create your love from suggestions</h3>
          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0]} value={activeCategory} onValueChange={handleCategoryChange}>
              <TabsList className={`${isMobile ? 'mb-3 p-0.5' : 'mb-4 p-1'} bg-card border border-border rounded-lg`}>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className={`capitalize text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md ${isMobile ? 'text-xs px-2 py-1' : ''}`}
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className={`grid ${isMobile ? 'grid-cols-4 gap-1 p-1' : 'grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 p-1 sm:p-2'}`}>
                {isLoadingSuggestions
                  ? // Show loading placeholders
                  Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="aspect-square rounded-lg bg-muted animate-pulse" />
                  ))
                  : // Show filtered suggestions
                  suggestions
                    .filter((suggestion) => suggestion.category === activeCategory && suggestion.is_active)
                    .map((suggestion) => (
                      <div
                        key={suggestion.id}
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
                            // Fall back to a local placeholder with the suggestion name
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
            <div className="text-center py-8 text-muted-foreground">No suggestion categories available.</div>
          )}
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
      <div className={`w-full ${isMobile ? 'p-4' : 'lg:w-1/2 p-6'} overflow-y-auto`}>
        <div className={`flex justify-between items-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
            Generated Images
          </h2>
          {generatedImages.length > 0 && (
            <div className={`flex ${isMobile ? 'flex-col gap-1' : 'gap-2'}`}>
              <Button variant="outline" size="sm" onClick={handleDownloadAll} className={isMobile ? 'text-xs px-2 py-1' : ''}>
                <Download className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                {isMobile ? 'Download All' : 'Download All'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/collections")} className={isMobile ? 'text-xs px-2 py-1' : ''}>
                <FolderOpen className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                Collection
              </Button>
            </div>
          )}
        </div>

        {isGenerating && (
          <div key="generating-state" className={`flex flex-col items-center justify-center ${isMobile ? 'h-[50vh]' : 'h-[70vh]'} text-center`}>
            <div className={`bg-card ${isMobile ? 'p-6' : 'p-8'} rounded-xl mb-4`}>
              <Loader2 className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mx-auto mb-4 text-primary animate-spin`} />
            </div>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-2`}>
              Generating Images...
            </h3>
            <p className={`text-muted-foreground ${isMobile ? 'max-w-sm text-sm' : 'max-w-md'} mb-4`}>
              This may take a few moments. We're creating your images based on the prompt.
            </p>

            {/* Progress Bar */}
            <div className={`w-full ${isMobile ? 'max-w-sm' : 'max-w-md'} mb-4`}>
              <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground mb-2`}>
                <span>Progress</span>
                <span>{Math.round(generationProgress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>

            {/* Timeout Warning */}
            {timeoutWarning && (
              <div className={`${isMobile ? 'mt-3 p-2' : 'mt-4 p-3'} bg-yellow-900/20 border border-yellow-800 text-yellow-300 rounded-lg flex items-center ${isMobile ? 'max-w-sm' : 'max-w-md'}`}>
                <Clock className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Hang tight! Your images are being created...</span>
              </div>
            )}
          </div>
        )}

        {!isGenerating && generatedImages.length === 0 && !error && (
          <div key="empty-state" className={`flex flex-col items-center justify-center ${isMobile ? 'h-[50vh]' : 'h-[70vh]'} text-center`}>
            <div className={`bg-card ${isMobile ? 'p-6' : 'p-8'} rounded-xl mb-4`}>
              <Wand2 className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} mx-auto mb-4 text-muted-foreground`} />
            </div>
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-2`}>
              No Images Generated Yet
            </h3>
            <p className={`text-muted-foreground ${isMobile ? 'max-w-sm text-sm' : 'max-w-md'}`}>
              Enter a prompt and click the Generate button to create AI-generated images based on your description.
            </p>
          </div>
        )}





        {!isGenerating && generatedImages.length > 0 && (
          <div key="result-state" className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 sm:grid-cols-2 gap-4'}`}>
            {generatedImages.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative group cursor-pointer transform transition-transform hover:scale-[1.02]"
                onClick={() => handleImageClick(index)}
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-card">
                  <Image
                    src={getValidImageSrc(image, "/placeholder.svg?height=512&width=512") || "/placeholder.svg"}
                    alt={`Generated image ${index + 1}`}
                    width={512}
                    height={512}
                    className="w-full h-full object-cover object-top"
                    unoptimized // Important for external URLs
                  />
                </div>
                <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl ${isMobile ? 'opacity-100' : ''}`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent opening modal
                      handleDownload(image, index)
                    }}
                    className={isMobile ? 'text-xs px-2 py-1' : ''}
                  >
                    <Download className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent opening modal
                      handleShare(image)
                    }}
                    className={isMobile ? 'text-xs px-2 py-1' : ''}
                  >
                    <Share2 className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                    Share
                  </Button>
                </div>
                <div className={`absolute bottom-2 right-2 bg-background/80 text-foreground ${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} rounded`}>
                  Image {index + 1}
                </div>
                {/* Show saved indicator only if image is in savedImageUrls */}
                {savedImageUrls.has(image) && (
                  <div className={`absolute top-2 right-2 bg-green-500/80 text-white ${isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'} rounded-full`}>
                    Saved
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
        imageSrc="/realistic_girlfriend_generate_unlimited_upgrade_1766901000000.png"
      />

      {/* Tokens Depleted Modal (for Premium Users) */}
      <PremiumUpgradeModal
        isOpen={showTokensDepletedModal}
        onClose={() => setShowTokensDepletedModal(false)}
        mode="tokens-depleted"
        feature="Tokens Slut"
        description="You used your 100 free premium tokens. Buy more tokens to use premium features"
        imageSrc="/premium_tokens_depleted_upsell_1766902100000.png"
      />


    </div>
  )
}
