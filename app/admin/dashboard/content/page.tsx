"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Save, Search, Plus, Edit } from "lucide-react"

interface ContentBlock {
  id: string
  page: string
  block_key: string
  content_sv: string
  content_en: string
  content_type: string
  is_active: boolean
}

const PAGES = [
  { value: "homepage", label: "Homepage" },
  { value: "premium", label: "Premium" },
  { value: "faq", label: "FAQ" },
  { value: "create-character", label: "Create Character" },
  { value: "about", label: "About Us" },
]

const CONTENT_TYPES = [
  { value: "text", label: "Plain Text" },
  { value: "html", label: "HTML" },
  { value: "markdown", label: "Markdown" },
]

export default function ContentEditorPage() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [filteredBlocks, setFilteredBlocks] = useState<ContentBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPage, setSelectedPage] = useState("homepage")
  const [searchQuery, setSearchQuery] = useState("")
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const [formData, setFormData] = useState({
    page: "homepage",
    block_key: "",
    content_sv: "",
    content_en: "",
    content_type: "text",
  })

  useEffect(() => {
    fetchBlocks()
  }, [])

  useEffect(() => {
    const filtered = blocks.filter(
      (block) =>
        block.page === selectedPage &&
        (block.block_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          block.content_sv.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredBlocks(filtered)
  }, [blocks, selectedPage, searchQuery])

  const fetchBlocks = async () => {
    try {
      const res = await fetch("/api/admin/content")
      const data = await res.json()

      console.log('API Response:', { status: res.status, ok: res.ok, data })

      if (res.ok) {
        console.log('Setting blocks:', data.length, 'blocks')
        setBlocks(data)
      } else {
        console.error('API Error:', data)
        toast.error(data.error || "Failed to load content blocks")
      }
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error("Failed to load content blocks")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (block: ContentBlock) => {
    setEditingBlock(block)
    setFormData({
      page: block.page,
      block_key: block.block_key,
      content_sv: block.content_sv,
      content_en: block.content_en,
      content_type: block.content_type,
    })
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingBlock(null)
    setFormData({
      page: selectedPage,
      block_key: "",
      content_sv: "",
      content_en: "",
      content_type: "text",
    })
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!formData.block_key.trim()) {
      toast.error("Block key is required")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBlock?.id,
          ...formData,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(isCreating ? "Content block created!" : "Content block updated!")
        setEditingBlock(null)
        setIsCreating(false)
        fetchBlocks()
      } else {
        toast.error(data.error || "Save failed")
      }
    } catch (error) {
      toast.error("Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingBlock(null)
    setIsCreating(false)
    setFormData({
      page: selectedPage,
      block_key: "",
      content_sv: "",
      content_en: "",
      content_type: "text",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Editor</h1>
          <p className="text-muted-foreground">Edit page content blocks in Swedish and English</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Block
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Content Blocks</CardTitle>
            <div className="flex items-center gap-2 mt-4">
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGES.map((page) => (
                    <SelectItem key={page.value} value={page.value}>
                      {page.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search blocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : filteredBlocks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No blocks found</p>
            ) : (
              <div className="space-y-2">
                {filteredBlocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => handleEdit(block)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      editingBlock?.id === block.id ? "border-primary bg-primary/5" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-sm">{block.block_key}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">{block.content_sv.substring(0, 60)}...</div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{isCreating ? "Create New Block" : editingBlock ? "Edit Block" : "Select a Block"}</CardTitle>
            <CardDescription>
              {editingBlock || isCreating ? "Edit content in both languages" : "Select a block from the list to edit"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!editingBlock && !isCreating ? (
              <div className="text-center py-16 text-gray-500">
                <Edit className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a content block to edit</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Page</Label>
                    <Select value={formData.page} onValueChange={(val) => setFormData({ ...formData, page: val })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGES.map((page) => (
                          <SelectItem key={page.value} value={page.value}>
                            {page.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Content Type</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(val) => setFormData({ ...formData, content_type: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Block Key (unique identifier)</Label>
                  <Input
                    value={formData.block_key}
                    onChange={(e) => setFormData({ ...formData, block_key: e.target.value })}
                    placeholder="hero_title"
                    disabled={!isCreating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use lowercase with underscores (e.g., hero_title, pricing_description)
                  </p>
                </div>

                <Tabs defaultValue="sv">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sv">Swedish</TabsTrigger>
                    <TabsTrigger value="en">English</TabsTrigger>
                  </TabsList>
                  <TabsContent value="sv" className="space-y-4">
                    <div>
                      <Label>Content (Swedish)</Label>
                      <Textarea
                        value={formData.content_sv}
                        onChange={(e) => setFormData({ ...formData, content_sv: e.target.value })}
                        placeholder="Skriv innehåll på svenska..."
                        rows={formData.content_type === "html" ? 15 : 8}
                        className="font-mono text-sm"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="en" className="space-y-4">
                    <div>
                      <Label>Content (English)</Label>
                      <Textarea
                        value={formData.content_en}
                        onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                        placeholder="Write content in English..."
                        rows={formData.content_type === "html" ? 15 : 8}
                        className="font-mono text-sm"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
