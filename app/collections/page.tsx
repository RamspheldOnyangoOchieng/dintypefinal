"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Download,
  Trash2,
  ImageIcon,
  Plus,
  X,
  RefreshCw,
  Heart,
  MoreVertical,
  FolderPlus,
  Folder,
  CheckSquare,
  Square,
  CheckCircle,
  Circle,
  Lock,
} from "lucide-react"
import { PremiumUpgradeModal } from "@/components/premium-upgrade-modal"
import { getAllImages, deleteExistingImage, toggleImageFavorite, addImageToExistingCollection } from "@/lib/image-actions"
import { getAllCollections, createNewCollection } from "@/lib/collection-actions"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface GeneratedImage {
  id: string
  prompt: string
  image_url: string
  created_at: string
  model_used: string
  tags?: string[]
  favorite?: boolean
  collection_id?: string
  is_locked?: boolean
}

interface Collection {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  image_count: number
}

export default function CollectionsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [images, setImages] = useState<GeneratedImage[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])

  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)

  const [showAddToCollectionDialog, setShowAddToCollectionDialog] = useState(false)
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)
  const [showBulkAddToCollectionDialog, setShowBulkAddToCollectionDialog] = useState(false)
  const [showCreateCollectionDialog, setShowCreateCollectionDialog] = useState(false)
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)

  const [isFavoriting, setIsFavoriting] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isAddingToCollection, setIsAddingToCollection] = useState(false)
  const [selectedImageForCollection, setSelectedImageForCollection] = useState<string | null>(null)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [showExpiredModal, setShowExpiredModal] = useState(false)

  const fetchImages = async () => {
    if (userId === null) return;
    setIsLoading(true);
    try {
      const result = await getAllImages({ userId });
      if (result && result.success && Array.isArray(result.images)) {
        setImages(result.images);
      } else {
        setImages([]);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const fetchCollections = async () => {
    if (!userId) return
    setIsLoadingCollections(true)
    try {
      const result = await getAllCollections(userId)
      if (result.success) {
        setCollections(result.collections || [])
      }
    } finally {
      setIsLoadingCollections(false)
    }
  }

  useEffect(() => {
    const getUserId = async () => {
      try {
        const { createClient } = await import("@/utils/supabase/client")
        const { getAnonymousUserId } = await import("@/lib/anonymous-user")
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) {
          setUserId(user.id)
        } else {
          // Use the random ID from localStorage
          setUserId(getAnonymousUserId())
        }
      } catch (e) {
        console.error("Error identifying user:", e)
        const { getAnonymousUserId } = await import("@/lib/anonymous-user")
        setUserId(getAnonymousUserId())
      }
    }
    getUserId()
  }, [])

  useEffect(() => {
    if (userId !== null) {
      fetchImages();
      fetchCollections();
    }
  }, [userId]);

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([fetchImages(), fetchCollections()]);
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreateCollection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreatingCollection(true)
    try {
      const formData = new FormData(e.currentTarget)
      const result = await createNewCollection(formData)
      if (result.success) {
        toast({ title: "Collection created successfully" })
        setShowCreateCollectionDialog(false)
        fetchCollections()
      } else {
        toast({ title: "Error creating collection", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error creating collection", variant: "destructive" })
    } finally {
      setIsCreatingCollection(false)
    }
  }

  const handleDownload = (url: string, prompt: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = `${prompt.substring(0, 50).replace(/[^a-z0-9]/gi, "_")}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return
    setIsDeleting(id)
    try {
      await deleteExistingImage(id, userId || undefined)
      setImages(images.filter((img) => img.id !== id))
      toast({ title: "Image deleted successfully" })
    } catch (error) {
      toast({ title: "Error deleting image", variant: "destructive" })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleToggleFavorite = async (id: string, favorite: boolean) => {
    setIsFavoriting(id)
    try {
      await toggleImageFavorite(id, !favorite, userId || undefined)
      setImages(
        images.map((img) => (img.id === id ? { ...img, favorite: !favorite } : img))
      )
      toast({
        title: !favorite ? "Added to favorites" : "Removed from favorites",
      })
    } catch (error) {
      toast({
        title: "Error updating favorite status",
        variant: "destructive",
      })
    } finally {
      setIsFavoriting(null)
    }
  }

  const handleOpenAddToCollection = (imageId: string) => {
    setSelectedImageForCollection(imageId)
    setShowAddToCollectionDialog(true)
  }

  const handleAddToCollection = async (collectionId: string) => {
    if (!selectedImageForCollection) return
    setIsAddingToCollection(true)
    try {
      await addImageToExistingCollection(selectedImageForCollection, collectionId)
      toast({ title: "Image added to collection" })
      setShowAddToCollectionDialog(false)
      fetchCollections() // Update image counts
    } catch (error) {
      toast({
        title: "Error adding image to collection",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCollection(false)
    }
  }

  const toggleSelectImage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const newSelectedImages = new Set(selectedImages)
    if (newSelectedImages.has(id)) {
      newSelectedImages.delete(id)
    } else {
      newSelectedImages.add(id)
    }
    setSelectedImages(newSelectedImages)
    setIsSelectionMode(newSelectedImages.size > 0)
  }

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set())
      setIsSelectionMode(false)
    } else {
      setSelectedImages(new Set(images.map((img) => img.id)))
      setIsSelectionMode(true)
    }
  }

  const cancelSelection = () => {
    setSelectedImages(new Set())
    setIsSelectionMode(false)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedImages.size} images?`)) return
    setIsBulkDeleting(true)
    try {
      await Promise.all(Array.from(selectedImages).map((id) => deleteExistingImage(id)))
      setImages(images.filter((img) => !selectedImages.has(img.id)))
      toast({ title: `${selectedImages.size} images deleted` })
      cancelSelection()
    } catch (error) {
      toast({ title: "Error deleting images", variant: "destructive" })
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkAddToCollection = async (collectionId: string) => {
    setIsAddingToCollection(true)
    try {
      await Promise.all(
        Array.from(selectedImages).map((imageId) =>
          addImageToExistingCollection(imageId, collectionId)
        )
      )
      toast({
        title: `${selectedImages.size} images added to collection`,
      })
      setShowBulkAddToCollectionDialog(false)
      fetchCollections()
      cancelSelection()
    } catch (error) {
      toast({
        title: "Error adding images to collection",
        variant: "destructive",
      })
    } finally {
      setIsAddingToCollection(false)
    }
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Mina bilder</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {!isSelectionMode ? (
              <>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Uppdatera
                </Button>
                <Button onClick={() => router.push("/generate")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa nya bilder
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={cancelSelection}>
                  <X className="h-4 w-4 mr-2" />
                  Avbryt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkAddToCollectionDialog(true)}
                  className="bg-secondary"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Lägg till i samling
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                  {isBulkDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Radera markerade
                </Button>
              </>
            )}
          </div>
        </div>

        {collections.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {collections.map(col => (
              <Button
                key={col.id}
                variant="outline"
                size="sm"
                className="rounded-full bg-card/50"
                onClick={() => router.push(`/collections/${col.id}`)}
              >
                <Folder className="h-3 w-3 mr-2" />
                {col.name} ({col.image_count})
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-primary"
              onClick={() => setShowCreateCollectionDialog(true)}
            >
              <Plus className="h-3 w-3 mr-1" /> Ny samling
            </Button>
          </div>
        )}

        {images.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-border pt-4">
            <Button variant="ghost" size="sm" onClick={handleSelectAll} className="text-sm flex items-center gap-2">
              {selectedImages.size === images.length ? (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Avmarkera alla
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  Markera alla
                </>
              )}
            </Button>
            {isSelectionMode && (
              <span className="text-sm text-muted-foreground font-medium">
                {selectedImages.size} av {images.length} markerade
              </span>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Hämtar dina mästerverk...</p>
        </div>
      ) : images.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-secondary/30 p-8 rounded-full mb-6">
              <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Inga bilder än</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Ditt galleri är tomt. Börja skapa fantastiska bilder med vår AI-generator!
            </p>
            <Button size="lg" onClick={() => router.push("/generate")} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
              Skapa din första bild
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {images.map((image) => (
            <Card
              key={image.id}
              className={`bg-card border-border overflow-hidden transition-all duration-300 group hover:shadow-xl hover:shadow-primary/5 ${selectedImages.has(image.id) ? "ring-2 ring-primary ring-offset-4 ring-offset-background scale-[0.98]" : ""
                }`}
            >
              <div
                className="relative aspect-[3/4] cursor-pointer"
                onClick={() => {
                  if (image.is_locked) {
                    setShowExpiredModal(true)
                    return
                  }
                  if (isSelectionMode) {
                    toggleSelectImage(image.id)
                  } else {
                    setSelectedImage(image)
                  }
                }}
              >
                <Image
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.prompt}
                  fill
                  className={`object-cover transition-transform duration-500 group-hover:scale-110 ${image.is_locked ? 'blur-md grayscale' : ''}`}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  unoptimized
                />

                {image.is_locked && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-2 z-10 transition-colors group-hover:bg-black/60">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center mb-2 shadow-lg ring-2 ring-amber-500/30">
                      <Lock className="h-5 w-5 text-black" />
                    </div>
                    <p className="text-white text-[10px] uppercase font-black tracking-tight text-center leading-none italic">
                      Låst Premium
                    </p>
                    <p className="text-white/70 text-[8px] font-bold text-center mt-1">
                      Förnya för låsa upp
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div
                  className={`absolute top-3 right-3 z-20 rounded-full shadow-lg p-1.5 transition-all duration-300 ${isSelectionMode || selectedImages.has(image.id)
                    ? "bg-primary scale-110"
                    : "bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 scale-100"
                    }`}
                  onClick={(e) => toggleSelectImage(image.id, e)}
                >
                  {selectedImages.has(image.id) ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <Circle className="h-5 w-5 text-white/90" />
                  )}
                </div>

                {!isSelectionMode && (
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavorite(image.id, !!image.favorite)
                      }}
                    >
                      <Heart className={`h-4 w-4 ${image.favorite ? "fill-red-500 text-red-500" : "text-white"}`} />
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(image.image_url, image.prompt)
                        }}
                      >
                        <Download className="h-4 w-4 text-white" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-lg border-border">
                          <DropdownMenuItem onClick={() => handleOpenAddToCollection(image.id)}>
                            <FolderPlus className="h-4 w-4 mr-2 text-primary" /> Lägg till i samling
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(image.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" /> Radera bild
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border shadow-2xl rounded-2xl">
            <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
              <div className="relative flex-1 bg-black/20 flex items-center justify-center min-h-[300px]">
                <Image
                  src={selectedImage.image_url || "/placeholder.svg"}
                  alt={selectedImage.prompt}
                  fill
                  className="object-contain p-4"
                  unoptimized
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="w-full lg:w-[350px] flex flex-col p-6 border-l border-border bg-card/30">
                <div className="flex-1 overflow-y-auto mb-6">
                  <h3 className="text-lg font-bold mb-4">Bilddetaljer</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Prompt</p>
                      <p className="text-sm bg-secondary/50 p-4 rounded-xl leading-relaxed border border-border/50 italic">
                        "{selectedImage.prompt}"
                      </p>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Modell</span>
                      <span className="text-sm font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-md uppercase text-[10px] tracking-widest">{selectedImage.model_used || "Stability"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Skapad</span>
                      <span className="text-sm font-medium">{new Date(selectedImage.created_at).toLocaleDateString("sv-SE")}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl bg-secondary/50 hover:bg-secondary border-border"
                    onClick={() => handleToggleFavorite(selectedImage.id, !!selectedImage.favorite)}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${selectedImage.favorite ? "fill-red-500 text-red-500" : ""}`} />
                    Favorit
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl bg-secondary/50 hover:bg-secondary border-border"
                    onClick={() => handleDownload(selectedImage.image_url, selectedImage.prompt)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Hämta
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl bg-secondary/50 hover:bg-secondary border-border"
                    onClick={() => handleOpenAddToCollection(selectedImage.id)}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Samling
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full rounded-xl"
                    onClick={() => {
                      handleDelete(selectedImage.id)
                      setSelectedImage(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Radera
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Bulk Add to Collection Dialogs */}
      <Dialog open={showAddToCollectionDialog || showBulkAddToCollectionDialog} onOpenChange={(open) => {
        setShowAddToCollectionDialog(open)
        setShowBulkAddToCollectionDialog(open)
      }}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Spara i samling
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            {isLoadingCollections ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : collections.length === 0 ? (
              <div className="text-center py-4 bg-secondary/20 rounded-xl p-6 border border-dashed border-border">
                <p className="text-muted-foreground mb-6">Du har inga samlingar än.</p>
                <Button onClick={() => setShowCreateCollectionDialog(true)} className="w-full rounded-xl shadow-lg shadow-primary/20">
                  Skapa din första samling
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant="outline"
                    className="w-full justify-between h-14 px-4 rounded-xl bg-secondary/30 hover:bg-secondary group transition-all"
                    onClick={() => showBulkAddToCollectionDialog ? handleBulkAddToCollection(collection.id) : handleAddToCollection(collection.id)}
                    disabled={isAddingToCollection}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                      <span className="font-medium">{collection.name}</span>
                    </div>
                    <span className="text-xs bg-card px-2 py-1 rounded-full text-muted-foreground border border-border">
                      {collection.image_count}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button variant="ghost" className="w-full" onClick={() => { setShowAddToCollectionDialog(false); setShowBulkAddToCollectionDialog(false) }}>Avbryt</Button>
            <Button className="w-full rounded-xl" onClick={() => setShowCreateCollectionDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Ny samling
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateCollectionDialog} onOpenChange={setShowCreateCollectionDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border-border bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Skapa ny samling</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCollection}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Namn</label>
                <Input id="name" name="name" placeholder="Mina favoritflickvänner" required className="rounded-xl bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Beskrivning (valfritt)</label>
                <Textarea id="description" name="description" placeholder="En samling av mina vackraste skapelser" className="rounded-xl bg-secondary/50 min-h-[100px]" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowCreateCollectionDialog(false)}>Avbryt</Button>
              <Button type="submit" className="rounded-xl px-8" disabled={isCreatingCollection}>
                {isCreatingCollection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Skapa samling
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal Instances */}
      <PremiumUpgradeModal
        isOpen={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        mode="expired"
        feature="Premium-galleri"
        description="Ditt Premium-medlemskap har utgått. Förnya för att låsa upp dina sparade bilder och fortsätta skapa utan gränser."
      />
    </div>
  )
}
