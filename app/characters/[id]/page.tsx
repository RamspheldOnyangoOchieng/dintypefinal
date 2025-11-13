"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCharacters } from "@/components/character-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, ArrowLeft, Globe, MessageCircle } from "lucide-react"
import type { Character } from "@/lib/types"

interface CharacterDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CharacterDetailPage({ params }: CharacterDetailPageProps) {
  const router = useRouter()
  const { characters, isLoading } = useCharacters()
  const [character, setCharacter] = useState<Character | null>(null)
  const [characterId, setCharacterId] = useState<string | null>(null)

  // Unwrap params for Next.js 15
  useEffect(() => {
    params.then(p => setCharacterId(p.id))
  }, [params])

  // Find character when ID is available
  useEffect(() => {
    if (characterId && !isLoading) {
      const found = characters.find(c => c.id === characterId)
      if (found) {
        setCharacter(found)
      } else {
        console.error("Character not found:", characterId)
      }
    }
  }, [characterId, characters, isLoading])

  if (isLoading || !characterId) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading character...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="container py-8">
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">Character not found</p>
          <Button asChild>
            <Link href="/characters">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Characters
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Button variant="ghost" asChild>
            <Link href="/characters">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Characters
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="default">
              <Link href={`/chat/${character.id}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Chatting
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                  {(character.imageUrl || character.image) ? (
                    <Image
                      src={character.imageUrl || character.image || "/placeholder.svg"}
                      alt={character.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-2/3">
                <div className="flex items-center gap-2 mb-4">
                  <h1 className="text-3xl font-bold">{character.name}</h1>
                  {character.isPublic && (
                    <div className="bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </div>
                  )}
                </div>

                {character.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">About</h2>
                    <p className="text-muted-foreground leading-relaxed">{character.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {character.age && (
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="font-medium">{character.age}</p>
                    </div>
                  )}
                  {character.ethnicity && (
                    <div>
                      <p className="text-sm text-muted-foreground">Ethnicity</p>
                      <p className="font-medium capitalize">{character.ethnicity}</p>
                    </div>
                  )}
                  {character.body && (
                    <div>
                      <p className="text-sm text-muted-foreground">Body Type</p>
                      <p className="font-medium capitalize">{character.body}</p>
                    </div>
                  )}
                  {character.personality && (
                    <div>
                      <p className="text-sm text-muted-foreground">Personality</p>
                      <p className="font-medium capitalize">{character.personality}</p>
                    </div>
                  )}
                  {character.relationship && (
                    <div>
                      <p className="text-sm text-muted-foreground">Relationship</p>
                      <p className="font-medium capitalize">{character.relationship}</p>
                    </div>
                  )}
                  {character.occupation && (
                    <div>
                      <p className="text-sm text-muted-foreground">Occupation</p>
                      <p className="font-medium">{character.occupation}</p>
                    </div>
                  )}
                </div>

                <Button asChild size="lg" className="w-full">
                  <Link href={`/chat/${character.id}`}>
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Start Chatting with {character.name}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
