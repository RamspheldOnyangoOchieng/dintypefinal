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
  feature = "Obegränsat Skapande",
  description = "Skapa utan gränser",
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
      <DialogContent className="sm:max-w-[800px] p-0 gap-0 bg-[#0a0a0a] border-zinc-800/50 overflow-hidden text-white shadow-2xl rounded-3xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-black/40 p-2 opacity-70 transition-all hover:opacity-100 hover:bg-black/60"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        <div className="flex flex-col md:flex-row min-h-[450px]">
          {/* Left side - Image */}
          <div className="md:w-1/2 relative h-64 md:h-auto group">
            <Image
              src={imageSrc}
              alt="Premium Feature"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized
            />
            {/* Artistic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent md:hidden" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a0a] hidden md:block opacity-60" />
            
            {/* Premium Badge */}
            <div className="absolute top-4 left-4 bg-[#ff4b7d] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
              Premium
            </div>
          </div>

          {/* Right side - Content */}
          <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-[#0a0a0a] relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff4b7d]/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
                  Upgrade to Unlock
                </h3>
                <MessageCircle className="h-6 w-6 text-white fill-white/20" />
              </div>
              
              <h2 className="text-2xl md:text-4xl font-black text-[#ff4b7d] mb-6 leading-tight tracking-tighter uppercase italic">
                {description || "Unlimited Messages"}
              </h2>

              <p className="text-zinc-400 mb-6 text-sm font-medium">
                With subscription you get access to:
              </p>

              <div className="space-y-4 mb-10">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <div className="bg-[#ccff00] rounded-full p-1 shadow-[0_0_10px_rgba(204,255,0,0.3)] transition-transform group-hover:scale-110">
                      <CheckCircle2 className="h-3 w-3 text-black stroke-[3px]" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleUpgrade}
                className="w-full py-7 text-lg font-black bg-[#ff4b7d] hover:bg-[#ff4b7d]/90 text-white rounded-2xl shadow-[0_10px_30px_rgba(255,75,125,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wide"
              >
                <Crown className="mr-3 h-6 w-6 fill-white" />
                Upgrade to Premium
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

