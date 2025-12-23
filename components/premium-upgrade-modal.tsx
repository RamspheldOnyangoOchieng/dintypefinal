"use client"

import React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Crown, MessageCircle, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface PremiumUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  description: string
  imageSrc?: string
}

export function PremiumUpgradeModal({
  isOpen,
  onClose,
  feature = "Unlimited Messages",
  description = "Chat without limits",
  imageSrc = "/login-placeholder.jpeg"
}: PremiumUpgradeModalProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    onClose()
    router.push("/premium")
  }

  const benefits = [
    "Create AI Video",
    "Create your own AI Girls",
    "Unlimited text messages",
    "Remove image blur",
    "Get 100 FREE tokens / month"
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] p-0 gap-0 bg-[#0f0f0f] border-zinc-800 overflow-hidden text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-black/70"
        >
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col md:flex-row h-full">
          {/* Left side - Image */}
          <div className="md:w-5/12 relative h-48 md:h-auto overflow-hidden">
            <Image
              src={imageSrc}
              alt="Premium Feature"
              fill
              className="object-cover"
              unoptimized
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0f0f0f] opacity-90" />
          </div>

          {/* Right side - Content */}
          <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-center bg-[#0f0f0f]">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
                Upgrade to Unlock <MessageCircle className="h-5 w-5 md:h-6 md:w-6 fill-white" />
              </h2>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#ff4b7d] mb-6">
                Unlimited Messages
              </h2>

              <p className="text-gray-400 mb-4 text-sm">
                With subscription you get access to:
              </p>

              <div className="space-y-3 mb-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="bg-[#ccff00] rounded-full p-0.5 flex-shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-black font-bold" />
                    </div>
                    <span className="text-sm font-medium text-gray-200">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleUpgrade}
              className="w-full py-6 text-base font-bold bg-[#ff4b7d] hover:bg-[#ff4b7d]/90 text-white rounded-xl shadow-[0_0_20px_rgba(255,75,125,0.4)] transition-all transform hover:scale-[1.02]"
            >
              <Crown className="mr-2 h-5 w-5 fill-white" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

