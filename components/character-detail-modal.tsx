"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import Image from "next/image"

interface CharacterDetailModalProps {
  characterId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CharacterDetailModal({ characterId, open, onOpenChange }: CharacterDetailModalProps) {
  const [character, setCharacter] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (characterId && open) {
      fetchCharacter(characterId)
    }
  }, [characterId, open])

  async function fetchCharacter(id: string) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/characters/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCharacter(data)
      } else {
        console.error('Failed to fetch character')
      }
    } catch (error) {
      console.error('Error fetching character:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleStartChat() {
    if (character?.id) {
      router.push(`/chat/${character.id}`)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : character ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{character.name}</DialogTitle>
              <DialogDescription>
                {character.age && `${character.age} years old`}
                {character.ethnicity && ` • ${character.ethnicity}`}
                {character.personality && ` • ${character.personality}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Character Image */}
              <div className="relative w-full aspect-[3/4] max-h-96 rounded-lg overflow-hidden bg-muted">
                {character.image || character.image_url ? (
                  <Image
                    src={character.image || character.image_url}
                    alt={character.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>

              {/* Character Description */}
              {character.description && (
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {character.description}
                  </p>
                </div>
              )}

              {/* Character Attributes */}
              {character.metadata && (
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {character.metadata.style && (
                      <div>
                        <span className="text-muted-foreground">Style:</span>
                        <span className="ml-2 capitalize">{character.metadata.style}</span>
                      </div>
                    )}
                    {character.metadata.eyeColor && (
                      <div>
                        <span className="text-muted-foreground">Eye Color:</span>
                        <span className="ml-2 capitalize">{character.metadata.eyeColor}</span>
                      </div>
                    )}
                    {character.metadata.hairColor && (
                      <div>
                        <span className="text-muted-foreground">Hair:</span>
                        <span className="ml-2 capitalize">{character.metadata.hairColor} {character.metadata.hairLength}</span>
                      </div>
                    )}
                    {character.metadata.bodyType && (
                      <div>
                        <span className="text-muted-foreground">Body Type:</span>
                        <span className="ml-2 capitalize">{character.metadata.bodyType}</span>
                      </div>
                    )}
                    {character.metadata.relationship && (
                      <div>
                        <span className="text-muted-foreground">Relationship:</span>
                        <span className="ml-2 capitalize">{character.metadata.relationship}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={handleStartChat}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Chat
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Character not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
