"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download, Share2, X, Save, Loader2 } from "lucide-react"
import Image from "next/image"

interface ImageModalProps {
  images: string[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownload: (imageUrl: string, index: number) => void
  onShare: (imageUrl: string) => void
  onSave?: (index: number) => void
  savingIndex?: number | null
}

export function ImageModal({
  images,
  initialIndex,
  open,
  onOpenChange,
  onDownload,
  onShare,
  onSave,
  savingIndex,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Reset current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case "ArrowLeft":
          handlePrevious()
          break
        case "ArrowRight":
          handleNext()
          break
        case "Escape":
          onOpenChange(false)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!images.length) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-[#0A0A0A] border-[#252525] rounded-lg [&>button]:hidden">
        <DialogTitle className="sr-only">Image View</DialogTitle>
        <DialogDescription className="sr-only">View and manage your generated images</DialogDescription>
        <div className="relative">
          <div className="relative aspect-square max-h-[80vh] overflow-hidden rounded-lg">
            {/* Close button - Moved to top-left */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 z-50 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            <Image
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`Image ${currentIndex + 1}`}
              fill
              className="object-contain rounded-2xl shadow-lg shadow-blue-500/40"
              unoptimized // Important for external URLs
            />
          </div>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white z-40"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white z-40"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Thumbnail Carousel */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 p-3 overflow-x-auto bg-black/40 border-t border-[#252525] scrollbar-none">
              <div className="flex gap-2 mx-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`relative w-16 h-24 rounded-md overflow-hidden border-2 transition-all shrink-0 ${currentIndex === index
                        ? "border-primary scale-105 shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                        : "border-transparent opacity-40 hover:opacity-100"
                      }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image counter */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded z-40 font-medium backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 p-4 bg-[#1A1A1A] rounded-b-lg">
          <Button
            variant="outline"
            onClick={() => onDownload(images[currentIndex], currentIndex)}
            className="bg-[#252525] border-[#333333] hover:bg-[#333333]"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={() => onShare(images[currentIndex])}
            className="bg-[#252525] border-[#333333] hover:bg-[#333333]"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          {onSave && (
            <Button
              variant="outline"
              onClick={() => onSave(currentIndex)}
              disabled={savingIndex === currentIndex}
              className="bg-[#252525] border-[#333333] hover:bg-[#333333]"
            >
              {savingIndex === currentIndex ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
