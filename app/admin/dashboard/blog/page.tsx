"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Save, Plus, Search, Edit, Trash2, Eye, Calendar, FileText } from "lucide-react"
import Link from "next/link"

interface BlogPost {
  id: string
  title_sv: string
  title_en: string
  slug: string
  content_sv: string
  content_en: string
  excerpt_sv: string
  excerpt_en: string
  category_id: string | null
  status: string
  featured_image: string | null
  meta_title: string
  meta_description: string
  created_at: string
  published_at: string | null
  blog_categories?: { name_sv: string; slug: string }
}

interface Category {
  id: string
  name_sv: string
  name_en: string
  slug: string
}

interface Tag {
  id: string
  name_sv: string
  name_en: string
  slug: string
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title_sv: "",
    title_en: "",
    slug: "",
    content_sv: "",
    content_en: "",
    excerpt_sv: "",
    excerpt_en: "",
    category_id: "",
    status: "draft",
    featured_image: "",
    meta_title: "",
    meta_description: "",
  })

  useEffect(() => {
    fetchPosts()
    fetchCategories()
    fetchTags()
  }, [statusFilter])

  const fetchPosts = async () => {
    try {
      const url = new URL("/api/admin/blog/posts", window.location.origin)
      if (statusFilter !== "all") {
        url.searchParams.set("status", statusFilter)
      }

      const res = await fetch(url.toString())
      const data = await res.json()

      if (res.ok) {
        setPosts(data.posts || [])
      }
    } catch (error) {
      toast.error("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/blog/categories")
      const data = await res.json()
      if (res.ok) setCategories(data)
    } catch (error) {
      console.error("Failed to load categories")
    }
  }

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/admin/blog/tags")
      const data = await res.json()
      if (res.ok) setTags(data)
    } catch (error) {
      console.error("Failed to load tags")
    }
  }

  const handleCreate = () => {
    setEditingPost(null)
    setFormData({
      title_sv: "",
      title_en: "",
      slug: "",
      content_sv: "",
      content_en: "",
      excerpt_sv: "",
      excerpt_en: "",
      category_id: "",
      status: "draft",
      featured_image: "",
      meta_title: "",
      meta_description: "",
    })
    setSelectedTags([])
    setIsCreating(true)
  }

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post)
    setFormData({
      title_sv: post.title_sv,
      title_en: post.title_en,
      slug: post.slug,
      content_sv: post.content_sv,
      content_en: post.content_en,
      excerpt_sv: post.excerpt_sv,
      excerpt_en: post.excerpt_en,
      category_id: post.category_id || "",
      status: post.status,
      featured_image: post.featured_image || "",
      meta_title: post.meta_title,
      meta_description: post.meta_description,
    })
    setIsCreating(false)
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/å/g, "a")
      .replace(/ä/g, "a")
      .replace(/ö/g, "o")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const handleTitleChange = (title: string, lang: "sv" | "en") => {
    if (lang === "sv") {
      setFormData((prev) => ({
        ...prev,
        title_sv: title,
        slug: prev.slug || generateSlug(title),
        meta_title: prev.meta_title || title,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        title_en: title,
      }))
    }
  }

  const handleSave = async (publish = false) => {
    if (!formData.title_sv.trim() || !formData.slug.trim()) {
      toast.error("Title and slug are required")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/admin/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPost?.id,
          ...formData,
          status: publish ? "published" : formData.status,
          tags: selectedTags,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(publish ? "Post published!" : "Post saved!")
        setEditingPost(null)
        setIsCreating(false)
        fetchPosts()
      } else {
        toast.error(data.error || "Save failed")
      }
    } catch (error) {
      toast.error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return

    try {
      const res = await fetch(`/api/admin/blog/posts?id=${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Post deleted")
        fetchPosts()
      } else {
        toast.error("Delete failed")
      }
    } catch (error) {
      toast.error("Delete failed")
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title_sv.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title_en.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-500",
      published: "bg-green-500",
      scheduled: "bg-blue-500",
    }
    return <Badge className={colors[status as keyof typeof colors] || "bg-gray-500"}>{status}</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">Create and manage blog posts</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {!isCreating && !editingPost ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-12 text-gray-500">Loading...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-center py-12 text-gray-500">No posts found</p>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 flex items-center gap-4 hover:bg-gray-50">
                    {post.featured_image && (
                      <img
                        src={post.featured_image}
                        alt={post.title_sv}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{post.title_sv}</h3>
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt_sv}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        {post.blog_categories && <span>• {post.blog_categories.name_sv}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id, post.title_sv)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isCreating ? "Create New Post" : "Edit Post"}</CardTitle>
            <CardDescription>Write your blog post in Swedish and English</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="sv" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="sv">Swedish Content</TabsTrigger>
                <TabsTrigger value="en">English Content</TabsTrigger>
                <TabsTrigger value="meta">Settings & SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="sv" className="space-y-4 mt-4">
                <div>
                  <Label>Title (Swedish)</Label>
                  <Input
                    value={formData.title_sv}
                    onChange={(e) => handleTitleChange(e.target.value, "sv")}
                    placeholder="Titel på svenska"
                  />
                </div>
                <div>
                  <Label>Excerpt (Swedish)</Label>
                  <Textarea
                    value={formData.excerpt_sv}
                    onChange={(e) => setFormData({ ...formData, excerpt_sv: e.target.value })}
                    placeholder="Kort sammanfattning..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Content (Swedish)</Label>
                  <Textarea
                    value={formData.content_sv}
                    onChange={(e) => setFormData({ ...formData, content_sv: e.target.value })}
                    placeholder="Skriv ditt inlägg här..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Supports HTML and Markdown</p>
                </div>
              </TabsContent>

              <TabsContent value="en" className="space-y-4 mt-4">
                <div>
                  <Label>Title (English)</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => handleTitleChange(e.target.value, "en")}
                    placeholder="Title in English"
                  />
                </div>
                <div>
                  <Label>Excerpt (English)</Label>
                  <Textarea
                    value={formData.excerpt_en}
                    onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
                    placeholder="Short summary..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Content (English)</Label>
                  <Textarea
                    value={formData.content_en}
                    onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                    placeholder="Write your post here..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="meta" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Slug (URL)</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="url-friendly-slug"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name_sv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Featured Image URL</Label>
                  <Input
                    value={formData.featured_image}
                    onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label>Meta Title (SEO)</Label>
                  <Input
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="SEO title (60 chars)"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.meta_title.length}/60</p>
                </div>

                <div>
                  <Label>Meta Description (SEO)</Label>
                  <Textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="SEO description (160 chars)"
                    rows={2}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.meta_description.length}/160</p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => handleSave(false)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving} variant="default">
                Publish
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingPost(null)
                  setIsCreating(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
