import { Suspense } from "react"
export const dynamic = "force-dynamic"
import Link from "next/link"
import { CharacterList } from "@/components/character-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getCharacters } from "@/app/actions/character-actions"

async function CharactersContent() {
  const characters = await getCharacters()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white/5 p-8 rounded-[2rem] border border-white/10 mb-8 backdrop-blur-xl">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic">Alla karaktärer</h1>
          <p className="text-white/40 text-sm font-medium mt-1">Utforska publika karaktärer och hantera dina egna.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all duration-300 rounded-xl px-6 h-12 font-bold text-white border-none scale-100 active:scale-95">
          <Link href="/create-character">
            <Plus className="mr-2 h-5 w-5" />
            Skapa karaktär
          </Link>
        </Button>
      </div>

      <CharacterList characters={characters} />
    </div>
  )
}

export default function CharactersPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={<div>Loading characters...</div>}>
        <CharactersContent />
      </Suspense>
    </div>
  )
}
