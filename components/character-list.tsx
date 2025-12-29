"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { CharacterProfile } from "@/lib/storage-service"
import { deleteCharacter } from "@/app/actions/character-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Edit, Trash2, Plus, Globe, MessageSquare } from "lucide-react"
import { useAuth } from "@/components/auth-context"

interface CharacterListProps {
  characters: CharacterProfile[]
}

export function CharacterList({ characters }: CharacterListProps) {
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (characterId: string) => {
    console.error(`Image load error for character: ${characterId}`)
    setImageErrors(prev => new Set(prev).add(characterId))
  }

  // Filter out characters that had image load errors
  const validCharacters = characters.filter(char => char.id && !imageErrors.has(char.id)) as (CharacterProfile & { id: string })[]

  async function handleDelete(id: string) {
    setIsDeleting(id)
    try {
      const result = await deleteCharacter(id)
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Character Deleted",
          description: "The character has been successfully deleted.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  if (validCharacters.length === 0) {
    return (
      <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
        <h3 className="text-2xl font-bold mb-2">Inga karaktärer hittades</h3>
        <p className="text-white/40 mb-8 max-w-xs mx-auto text-sm">Skapa din första karaktär för att komma igång med ditt äventyr.</p>
        <Button asChild className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-xl font-bold text-white shadow-lg shadow-primary/20">
          <Link href="/create-character">
            <Plus className="mr-2 h-5 w-5" />
            Skapa karaktär
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
      {validCharacters.map((character) => (
        <div key={character.id} className="group relative bg-[#0a0a0a] rounded-[2rem] overflow-hidden border border-white/10 transition-all duration-700 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(14,165,233,0.15)] hover:-translate-y-2">
          {/* Image Container */}
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            {(character.image_url || character.image || (character as any).image) ? (
              <Image
                src={character.image_url || character.image || (character as any).image || "/placeholder.svg"}
                alt={character.name}
                fill
                className="object-cover object-top transition-transform duration-[1501ms] group-hover:scale-110"
                onError={() => character.id && handleImageError(character.id)}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="h-full w-full bg-[#111] flex items-center justify-center">
                <span className="text-white/20 text-xs uppercase tracking-widest font-bold">No Portrait</span>
              </div>
            )}

            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent opacity-100 transition-opacity duration-500 group-hover:opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Top Accents */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
              {character.is_public ? (
                <div className="bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-2 text-white shadow-lg">
                  <Globe className="h-3 w-3 text-primary animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter drop-shadow-md">Publik</span>
                </div>
              ) : (
                <div />
              )}

              {(user?.isAdmin || (!character.is_public && (character.user_id === user?.id || (character as any).userId === user?.id))) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#111] border-white/10 text-white p-1 rounded-xl shadow-2xl">
                    <DropdownMenuItem asChild className="rounded-lg hover:bg-white/10 focus:bg-white/10 transition-colors">
                      <Link href={`/characters/${character.id}/edit`} className="flex items-center w-full px-2 py-1.5">
                        <Edit className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Redigera profil</span>
                      </Link>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="flex items-center w-full px-2 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Radera karaktär
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#0f0f0f] border-white/10 text-white rounded-[2rem] p-8">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-2xl font-bold">Radera "{character.name}"?</AlertDialogTitle>
                          <AlertDialogDescription className="text-white/40 text-base">
                            Denna åtgärd är permanent och kommer att radera allt minne och alla prompter associerade med denna AI.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6">
                          <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl transition-all">Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => character.id && handleDelete(character.id)}
                            disabled={isDeleting === character.id}
                            className="bg-red-500 hover:bg-red-600 border-none rounded-xl font-bold transition-all"
                          >
                            {isDeleting === character.id ? "Raderar..." : "Bekräfta radering"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Character Details Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transition-all duration-500 translate-y-2 group-hover:translate-y-0 text-white">
            <div className="mb-4">
              <h3 className="text-2xl font-black text-white tracking-tight mb-1 group-hover:text-primary transition-colors drop-shadow-lg">{character.name}</h3>
              {character.description && (
                <p className="text-white/60 text-xs line-clamp-1 group-hover:line-clamp-3 group-hover:text-white/90 transition-all duration-500 leading-relaxed drop-shadow-md">
                  {character.description}
                </p>
              )}
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100">
              <Button asChild className="flex-1 bg-white text-black hover:bg-white/90 font-bold rounded-xl transition-all scale-95 group-hover:scale-100">
                <Link href={`/characters/${character.id}`}>Visa profil</Link>
              </Button>
              <Button asChild variant="outline" className="h-10 w-10 p-0 border-white/20 hover:bg-white/20 rounded-xl bg-black/20 backdrop-blur-md text-white group/chat transition-all duration-300">
                <Link href={`/chat/${character.id}`} className="flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 group-hover/chat:scale-110 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}