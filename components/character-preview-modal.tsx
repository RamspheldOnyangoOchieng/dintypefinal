"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Heart, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { useAuthModal } from "@/components/auth-modal-context"
import { createClient } from "@/utils/supabase/client"
import Image from "next/image"

interface CharacterPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    redirectPath: string // "/my-ai" or "/collections"
}

interface Character {
    name: string
    description: string
    image_url: string
    personality: string
}

export function CharacterPreviewModal({ isOpen, onClose, redirectPath }: CharacterPreviewModalProps) {
    const router = useRouter()
    const { user } = useAuth()
    const { openLoginModal } = useAuthModal()
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [character, setCharacter] = useState<Character>({
        name: "Luna",
        description: "En vänlig och uppmärksam AI-kompanjon",
        image_url: "",
        personality: "Vänlig, Rolig, Omtänksam"
    })
    const [loadingCharacter, setLoadingCharacter] = useState(true)

    // Fetch character "Ellie" on mount
    useEffect(() => {
        if (isOpen) {
            const fetchCharacter = async () => {
                setLoadingCharacter(true)
                try {
                    const supabase = createClient()
                    const { data, error } = await supabase
                        .from('characters')
                        .select('name, description, image, image_url, personality')
                        .ilike('name', 'Ellie%')
                        .limit(1)
                        .maybeSingle() as any

                    if (data) {
                        // Determine the correct image source
                        let finalImageUrl = data.image_url || ""

                        // If no image_url, check the 'image' column
                        if (!finalImageUrl && data.image) {
                            if (data.image.startsWith('http')) {
                                finalImageUrl = data.image
                            } else {
                                // Assume it's a storage path, generate public URL
                                const { data: publicUrlData } = supabase
                                    .storage
                                    .from('images') // The bucket name is 'images'
                                    .getPublicUrl(data.image)
                                finalImageUrl = publicUrlData.publicUrl
                            }
                        }

                        setCharacter({
                            name: data.name,
                            description: data.description || "En fantastisk AI-vän",
                            image_url: finalImageUrl,
                            personality: data.personality || "Vänlig, Smart"
                        })
                    }
                } catch (e) {
                    console.error("Failed to fetch character Ellie", e)
                } finally {
                    setLoadingCharacter(false)
                }
            }
            fetchCharacter()
        }
    }, [isOpen])

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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Heart className="h-8 w-8 text-primary" />
                        Upptäck AI-vänner
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                        Skapa din egen AI-vän eller upptäck befintliga
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {/* Character Card */}
                    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors bg-card h-full flex flex-col">
                        <div className="relative h-48 sm:h-64 bg-secondary/20">
                            {character.image_url ? (
                                <Image
                                    src={character.image_url}
                                    alt={character.name}
                                    fill
                                    className="object-cover object-top"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center text-primary text-4xl font-bold">
                                        {character.name[0]}
                                    </div>
                                </div>
                            )}
                        </div>
                        <CardContent className="p-4">
                            <h3 className="font-bold text-lg mb-2">{character.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {character.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-3">
                                {character.personality?.split(',').slice(0, 3).map((tag) => (
                                    <span key={tag} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full truncate max-w-[80px]">
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                            <Button variant="outline" className="w-full mt-auto" disabled>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Exempel
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Create New Card */}
                    <Card
                        className="overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer group bg-transparent h-full flex flex-col"
                        onClick={handleCreateClick}
                    >
                        <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
                                <Plus className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="font-bold text-xl mb-2 text-foreground">Skapa din AI-vän</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                                Designa din perfekta AI-kompanjon med unika egenskaper och personlighet
                            </p>
                            <Button
                                className="w-full"
                                disabled={isRedirecting}
                            >
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
