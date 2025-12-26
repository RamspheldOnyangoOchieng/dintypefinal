"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Heart, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { useAuthModal } from "@/components/auth-modal-context"
import Image from "next/image"

interface CharacterPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    redirectPath: string // "/my-ai" or "/collections"
}

export function CharacterPreviewModal({ isOpen, onClose, redirectPath }: CharacterPreviewModalProps) {
    const router = useRouter()
    const { user } = useAuth()
    const { openLoginModal } = useAuthModal()
    const [isRedirecting, setIsRedirecting] = useState(false)

    // Sample character data
    const sampleCharacter = {
        name: "Luna",
        description: "En vänlig och uppmärksam AI-kompanjon",
        image: "/placeholder-character.png", // You can replace with actual image
        tags: ["Vänlig", "Rolig", "Omtänksam"]
    }

    const handleCreateClick = () => {
        if (!user) {
            // Close this modal
            onClose()
            // Open login modal with redirect path
            openLoginModal()
            // Store intended path for after login
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('postLoginRedirect', redirectPath)
            }
        } else {
            // Check if user has characters
            checkUserStatusAndRedirect()
        }
    }

    const checkUserStatusAndRedirect = async () => {
        setIsRedirecting(true)
        try {
            // Check if user has any characters
            const response = await fetch('/api/user-characters-count')
            const data = await response.json()

            if (data.count === 0) {
                // New user with no characters - redirect to create
                router.push('/create-character')
            } else {
                // Existing user - redirect to their collection/characters
                router.push(redirectPath)
            }
        } catch (error) {
            console.error('Error checking user status:', error)
            // Fallback: redirect to the requested path
            router.push(redirectPath)
        } finally {
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <Heart className="w-6 h-6 text-primary" />
                        Upptäck AI-vänner
                    </DialogTitle>
                    <DialogDescription>
                        Skapa din egen AI-vän eller upptäck befintliga
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {/* Sample Character Card */}
                    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                        <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-4xl font-bold">
                                    {sampleCharacter.name[0]}
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-bold text-lg mb-2">{sampleCharacter.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{sampleCharacter.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {sampleCharacter.tags.map((tag) => (
                                    <span key={tag} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <Button variant="outline" className="w-full mt-4" disabled>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Exempel
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Create New Card */}
                    <Card
                        className="overflow-hidden border-2 border-dashed border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                        onClick={handleCreateClick}
                    >
                        <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
                                <Plus className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">Skapa din AI-vän</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Designa din perfekta AI-kompanjon med unika egenskaper och personlighet
                            </p>
                            <Button className="w-full" disabled={isRedirecting}>
                                {isRedirecting ? (
                                    "Laddar..."
                                ) : user ? (
                                    "Kom igång"
                                ) : (
                                    "Logga in för att skapa"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    {!user && (
                        <p>
                            Logga in för att skapa och hantera dina AI-vänner
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
