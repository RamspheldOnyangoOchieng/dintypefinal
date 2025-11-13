"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Video, Sparkles } from "lucide-react"

interface Character {
  id: string
  name: string
  age: number
  occupation: string
  description: string
  personality: string
  image: string
  videoUrl?: string
  category?: string
}

interface CharacterHoverVideoModalProps {
  character: Character | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Category-specific prompt suggestions
const PROMPT_SUGGESTIONS = {
  anime: [
    "anime style character smiling and waving cutely",
    "anime character doing a kawaii pose with sparkles",
    "anime character dancing with energetic movements",
    "anime character making a peace sign and smiling",
    "anime character blushing and looking shy",
  ],
  realistic: [
    "smiling warmly and winking at the camera",
    "dancing gracefully with natural movements",
    "waving hello enthusiastically",
    "blowing a kiss to the camera",
    "laughing and looking joyful",
  ],
  girls: [
    "smiling warmly and winking at the camera",
    "dancing gracefully with natural movements",
    "waving hello enthusiastically",
    "blowing a kiss to the camera",
    "laughing and looking joyful",
  ],
  guys: [
    "giving a charming smile and waving",
    "running hand through hair confidently",
    "winking and giving a thumbs up",
    "laughing warmly at the camera",
    "nodding and smiling encouragingly",
  ]
}

export function CharacterHoverVideoModal({ character, isOpen, onClose, onSuccess }: CharacterHoverVideoModalProps) {
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<string>("")
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && character) {
      setCustomPrompt("")
      setVideoPreviewUrl(null)
      setProgress("")
    }
  }, [isOpen, character])

  if (!character) return null

  // Determine category-specific prompts
  const category = character.category?.toLowerCase() || "realistic"
  const suggestions = PROMPT_SUGGESTIONS[category as keyof typeof PROMPT_SUGGESTIONS] || PROMPT_SUGGESTIONS.realistic

  const handleGenerateVideo = async (prompt: string) => {
    if (!prompt.trim()) {
      toast.error("Please enter or select a prompt")
      return
    }

    try {
      setIsGenerating(true)
      setProgress("Preparing image for video generation...")

      // Step 1: Start video generation
      const generateResponse = await fetch("/api/generate-character-hover-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          prompt: prompt.trim(),
        }),
      })

      if (!generateResponse.ok) {
        const error = await generateResponse.json()
        throw new Error(error.error || "Failed to start video generation")
      }

      const { jobId } = await generateResponse.json()
      setProgress("Video generation started, polling for completion...")

      // Step 2: Poll for completion
      let attempts = 0
      const maxAttempts = 60 // 3 minutes max
      let videoUrl: string | null = null

      while (attempts < maxAttempts && !videoUrl) {
        await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds
        attempts++

        setProgress(`Generating video... (${attempts * 3}s elapsed)`)

        const statusResponse = await fetch("/api/generate-character-hover-video", {
          method: "GET",
          headers: { "x-job-id": jobId },
        })

        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          
          if (statusData.status === "completed") {
            videoUrl = statusData.videoUrl
            setProgress("Video generated! Uploading to CDN...")
          } else if (statusData.status === "failed") {
            throw new Error(statusData.error || "Video generation failed")
          }
        }
      }

      if (!videoUrl) {
        throw new Error("Video generation timed out. Please try again.")
      }

      // Step 3: Save video to character
      setProgress("Saving video to character...")
      const saveResponse = await fetch("/api/save-character-hover-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          videoUrl,
        }),
      })

      if (!saveResponse.ok) {
        throw new Error("Failed to save video")
      }

      const { cdnUrl } = await saveResponse.json()

      setVideoPreviewUrl(cdnUrl)
      setProgress("Success! Video saved.")
      
      toast.success("Hover video generated successfully!")
      
      // Wait a moment to show preview, then close and refresh
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)

    } catch (error: any) {
      console.error("Error generating hover video:", error)
      toast.error(error.message || "Failed to generate hover video")
      setProgress("")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-purple-500" />
            Generate Hover Video for {character.name}
          </DialogTitle>
          <DialogDescription>
            Create an animated video that plays when users hover over this character
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Character Preview */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <img
              src={character.image || "/placeholder.svg"}
              alt={character.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div>
              <h3 className="font-semibold">{character.name}, {character.age}</h3>
              <p className="text-sm text-muted-foreground">{character.occupation}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{character.description}</p>
            </div>
          </div>

          {/* Video Preview */}
          {videoPreviewUrl && (
            <div className="space-y-2">
              <Label>Preview Generated Video</Label>
              <video
                src={videoPreviewUrl}
                controls
                autoPlay
                loop
                className="w-full rounded-lg"
              />
            </div>
          )}

          {/* Prompt Suggestions */}
          <div className="space-y-2">
            <Label>Suggested Prompts ({category} style)</Label>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4"
                  onClick={() => handleGenerateVideo(suggestion)}
                  disabled={isGenerating}
                >
                  <Sparkles className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
                  <span className="text-sm">{suggestion}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="custom-prompt">Or Enter Custom Prompt</Label>
            <Textarea
              id="custom-prompt"
              placeholder="Describe the animation you want... (e.g., 'twirling gracefully with a warm smile')"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={isGenerating}
              rows={3}
            />
          </div>

          {/* Progress */}
          {progress && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <p className="text-sm text-blue-500">{progress}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {customPrompt && (
              <Button
                onClick={() => handleGenerateVideo(customPrompt)}
                disabled={isGenerating || !customPrompt.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Generate with Custom Prompt
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Close
            </Button>
          </div>

          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Video generation takes 1-3 minutes. The video will be approximately 3 seconds long
              and optimized for hover animations. As an admin, this feature is free and doesn't consume tokens.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
