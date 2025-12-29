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
  const [isMounted, setIsMounted] = useState(false)

  // Unwrap params for Next.js 15
  useEffect(() => {
    const unwrap = async () => {
      const p = await params;
      setCharacterId(p.id);
      setIsMounted(true)
    };
    unwrap();
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

  if (!isMounted || isLoading || !characterId) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar karaktär...</p>
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
          <p className="text-xl text-muted-foreground mb-8">Karaktären hittades inte</p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-white">
            <Link href="/characters">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till karaktärer
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
          <Button variant="ghost" asChild className="hover:text-primary">
            <Link href="/characters">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till karaktärer
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-white">
              <Link href={`/chat/${character.id}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Starta chatt
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
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center text-xs font-bold">
                      <Globe className="h-3 w-3 mr-1" />
                      Publik
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
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Kroppstyp</p>
                      <p className="font-bold text-lg capitalize">{character.body}</p>
                    </div>
                  )}
                  {character.personality && (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Personlighet</p>
                      <p className="font-bold text-lg capitalize">{character.personality}</p>
                    </div>
                  )}
                  {character.relationship && (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Relation</p>
                      <p className="font-bold text-lg capitalize">{character.relationship}</p>
                    </div>
                  )}
                  {character.occupation && (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Sysselsättning</p>
                      <p className="font-bold text-lg">{character.occupation}</p>
                    </div>
                  )}
                </div>

                <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-black h-14 rounded-xl shadow-lg shadow-primary/20">
                  <Link href={`/chat/${character.id}`}>
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Börja chatta med {character.name}
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
