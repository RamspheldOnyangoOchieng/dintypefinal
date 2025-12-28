import { Suspense } from "react"
import { notFound } from "next/navigation"
import { StorageService } from "@/lib/storage-service"
import { CharacterForm } from "@/components/character-form"

interface EditCharacterPageProps {
  params: Promise<{
    id: string
  }>
}

async function EditCharacterContent({ id }: { id: string }) {
  try {
    const character = await StorageService.getCharacter(id)
    if (!character) {
      console.error("Character not found for ID:", id)
      notFound()
    }
    return <CharacterForm character={character} isEditing />
  } catch (error) {
    console.error("Error loading character in EditCharacterContent:", error)
    notFound()
  }
}

export default async function EditCharacterPage({ params }: EditCharacterPageProps) {
  const { id } = await params;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Edit Character</h1>
      <Suspense fallback={<div className="text-white font-medium">Loading character profile...</div>}>
        <EditCharacterContent id={id} />
      </Suspense>
    </div>
  )
}
