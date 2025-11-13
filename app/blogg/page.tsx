"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BlogPost {
  id: string
  title_sv: string
  title_en: string
  slug: string
  excerpt_sv: string
  excerpt_en: string
  featured_image: string | null
  published_at: string
  blog_categories?: {
    id: string
    name_sv: string
    slug: string
  }
}

interface Category {
  id: string
  name_sv: string
  name_en: string
  slug: string
}

export default function BloggPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [selectedCategory, currentPage])

  const fetchPosts = async () => {
    try {
      const url = new URL("/api/blog/posts", window.location.origin)
      url.searchParams.set("page", currentPage.toString())
      url.searchParams.set("limit", "12")
      if (selectedCategory !== "all") {
        url.searchParams.set("category", selectedCategory)
      }

      const res = await fetch(url.toString())
      const data = await res.json()

      if (res.ok) {
        setPosts(data.posts || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/blog/categories")
      const data = await res.json()
      if (res.ok) setCategories(data || [])
    } catch (error) {
      console.error("Failed to load categories")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">BLOGG</h1>
          <div className="flex justify-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Alla kategorier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla kategorier</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name_sv}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {loading ? (
          <div className="text-center py-12">Laddar inlägg...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Inga inlägg hittades</div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link key={post.id} href={`/blogg/${post.slug}`}>
                  <article className="group h-full">
                    <div className="bg-card border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                      {post.featured_image && (
                        <div className="relative h-56 overflow-hidden bg-muted">
                          <Image
                            src={post.featured_image}
                            alt={post.title_sv}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}

                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(post.published_at)}</span>
                          </div>
                          {post.blog_categories && <span>• {post.blog_categories.name_sv}</span>}
                        </div>

                        <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                          {post.title_sv}
                        </h3>

                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-grow">
                          {post.excerpt_sv}
                        </p>

                        <div className="mt-auto pt-4 border-t">
                          <span className="inline-flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                            Läs mer →
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Föregående
                </Button>
                <span className="flex items-center px-4">
                  Sida {currentPage} av {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Nästa
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
