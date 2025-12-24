"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Download, Save, RefreshCw, Sparkles, Check } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-context"
import { useAuthModal } from "@/components/auth-modal-context"
import { PremiumUpgradeModal } from "@/components/premium-upgrade-modal"
import { cn } from "@/lib/utils"

export default function ImageGenerationForm() {
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [imageCount, setImageCount] = useState(1)
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [hasUsedFreeImage, setHasUsedFreeImage] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useAuth()
  const { openLoginModal } = useAuthModal()

  useEffect(() => {
    async function checkStatus() {
      if (user) {
        // Check premium status
        try {
          const response = await fetch("/api/check-premium-status")
          const data = await response.json()
          setIsPremium(data.isPremium)
        } catch (error) {
          console.error("Failed to check premium status", error)
        }

        // Check local storage for free usage (simple daily check)
        const today = new Date().toDateString()
        const key = `dintyp_free_used_${user.id}_${today}`
        if (localStorage.getItem(key)) {
          setHasUsedFreeImage(true)
        }
      }
    }
    checkStatus()
  }, [user])

  const handleImageCountSelect = (count: number) => {
    if (!user) {
      openLoginModal()
      return
    }

    if (!isPremium) {
      if (count > 1) {
        setShowUpgradeModal(true)
        return
      }
      if (count === 1 && hasUsedFreeImage) {
        setShowUpgradeModal(true)
        return
      }
    }

    setImageCount(count)
  }

  const handleGenerate = async () => {
    if (!user) {
      openLoginModal()
      return
    }

    if (!isPremium && imageCount > 1) {
      setShowUpgradeModal(true)
      return
    }

    if (!isPremium && imageCount === 1 && hasUsedFreeImage) {
      setShowUpgradeModal(true)
      return
    }

    if (!prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setIsGenerating(true)
    setGeneratedImage(null)
    setTaskId(null)

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          imageCount,
          width,
          height,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate image")
      }

      // Mark free image as used if applicable
      if (!isPremium) {
        setHasUsedFreeImage(true)
        const today = new Date().toDateString()
        localStorage.setItem(`dintyp_free_used_${user.id}_${today}`, "true")
      }

      const data = await response.json()
      setTaskId(data.taskId)
      startStatusCheck(data.taskId)
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate image")
      setIsGenerating(false)
    }
  }

  const startStatusCheck = (taskId: string) => {
    setIsCheckingStatus(true)
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current)
    checkGenerationStatus(taskId)
    checkIntervalRef.current = setInterval(() => {
      checkGenerationStatus(taskId)
    }, 2000)
  }

  const checkGenerationStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/check-generation?taskId=${taskId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to check generation status")
      }

      const data = await response.json()
      console.log("Task status response:", data)

      if (data.status === "TASK_STATUS_SUCCEED") {
        if (data.images && data.images.length > 0) {
          setGeneratedImage(data.images[0])
          setIsGenerating(false)
          setIsCheckingStatus(false)
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
            checkIntervalRef.current = null
          }
          toast.success("Your image has been generated!")
        } else {
          throw new Error("No images returned from the API")
        }
      } else if (data.status === "TASK_STATUS_FAILED") {
        throw new Error(data.reason || "Image generation failed")
      }
    } catch (error) {
      console.error("Error checking generation status:", error)
      toast.error(error instanceof Error ? error.message : "Failed to check generation status")
      setIsGenerating(false)
      setIsCheckingStatus(false)
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
    }
  }

  const handleSaveImage = async () => {
    if (!generatedImage) return
    setIsSaving(true)
    try {
      const response = await fetch("/api/save-generated-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: generatedImage,
          prompt,
          modelUsed: "novita",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save image")
      }
      toast.success("Image saved to your collection")
    } catch (error) {
      console.error("Error saving image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save image")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImage) return
    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `generated_image_${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading image:", error)
      toast.error("Failed to download the image. Please try again.")
    }
  }

  const isFreeGeneration = user && !isPremium && !hasUsedFreeImage && imageCount === 1

  return (
    <div className="container mx-auto px-4 py-8">
      <PremiumUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />

      <h1 className="text-3xl font-bold mb-6">Generate Images</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card className="bg-[#1A1A1A] border-[#252525]">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the image you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="h-32 bg-[#252525] border-[#333333]"
                  />
                </div>

                <div>
                  <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
                  <Textarea
                    id="negative-prompt"
                    placeholder="Elements you want to exclude..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="h-20 bg-[#252525] border-[#333333]"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Image Count: {imageCount}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 4, 6, 8].map((count) => (
                      <Button
                        key={count}
                        type="button"
                        variant={imageCount === count ? "default" : "outline"}
                        className={cn(
                          "w-full h-auto py-3 flex flex-col items-center justify-center gap-1",
                          imageCount === count
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-[#252525] border-[#333333] hover:bg-[#2a2a2a]"
                        )}
                        onClick={() => handleImageCountSelect(count)}
                      >
                        <span className="text-lg font-bold">{count}</span>
                        {count === 1 ? (
                          <span className="text-[10px] uppercase font-bold text-green-400">
                             FREE
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-blue-400">
                            Premium
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Width: {width}px</Label>
                    <Slider
                      value={[width]}
                      min={512}
                      max={1024}
                      step={64}
                      onValueChange={(value) => setWidth(value[0])}
                      className="my-2"
                    />
                  </div>
                  <div>
                    <Label>Height: {height}px</Label>
                    <Slider
                      value={[height]}
                      min={512}
                      max={1024}
                      step={64}
                      onValueChange={(value) => setHeight(value[0])}
                      className="my-2"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (user && !isPremium && hasUsedFreeImage && imageCount === 1 && !prompt.trim())}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isCheckingStatus ? "Processing..." : "Generating..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Image
                        {isFreeGeneration ? (
                          <span className="ml-2 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded border border-green-500/50">FREE</span>
                        ) : (
                          !isPremium && <span className="ml-2 text-xs opacity-70">(5 tokens)</span>
                        )}
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-[#1A1A1A] border-[#252525]">
            <CardContent className="p-6">
              <div className="aspect-square relative bg-[#252525] rounded-md overflow-hidden mb-4">
                {isGenerating ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-gray-400">
                        {isCheckingStatus ? "Processing your image..." : "Starting generation..."}
                      </p>
                    </div>
                  </div>
                ) : generatedImage ? (
                  <Image
                    src={generatedImage || "/placeholder.svg"}
                    alt="Generated image"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-400 text-center px-4">Your generated image will appear here</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex-1 bg-[#252525] border-[#333333]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!generatedImage || isGenerating}
                  className="flex-1 bg-[#252525] border-[#333333]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>

                <Button
                  onClick={handleSaveImage}
                  disabled={!generatedImage || isGenerating || isSaving}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
