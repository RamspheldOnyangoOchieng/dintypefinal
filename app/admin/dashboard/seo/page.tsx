'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Save, Plus, CheckCircle, AlertCircle } from 'lucide-react'

interface PageMeta {
  id: string
  page_path: string
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  og_title: string | null
  og_description: string | null
  og_image: string | null
  og_type: string
  twitter_card: string
  canonical_url: string | null
  robots: string
  language: string
}

export default function SEOMetaAdminPage() {
  const [pages, setPages] = useState<PageMeta[]>([])
  const [selectedPage, setSelectedPage] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/admin/seo-meta')
      if (!response.ok) throw new Error('Failed to fetch pages')
      const data = await response.json()
      setPages(data.pages || [])
      if (data.pages && data.pages.length > 0) {
        setSelectedPage(data.pages[0])
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
      setMessage({ type: 'error', text: 'Failed to load SEO data' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedPage) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/seo-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedPage),
      })

      if (!response.ok) throw new Error('Failed to save')

      setMessage({ type: 'success', text: 'SEO meta tags saved successfully!' })
      await fetchPages()
    } catch (error) {
      console.error('Error saving:', error)
      setMessage({ type: 'error', text: 'Failed to save SEO data' })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof PageMeta, value: string) => {
    if (!selectedPage) return
    setSelectedPage({ ...selectedPage, [field]: value })
  }

  const filteredPages = pages.filter((page) =>
    page.page_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.meta_title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading SEO data...</div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">SEO Meta Tags Manager</h1>
        <p className="text-muted-foreground">
          Manage meta titles, descriptions, and OpenGraph tags for each page
        </p>
      </div>

      {/* Message */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Pages List */}
        <Card>
          <CardHeader>
            <CardTitle>Pages</CardTitle>
            <CardDescription>Select a page to edit SEO</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Pages List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => setSelectedPage(page)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedPage?.id === page.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="font-medium">{page.page_path}</div>
                  <div className="text-xs opacity-70 truncate">{page.meta_title || 'No title set'}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SEO Editor */}
        {selectedPage && (
          <div className="space-y-6">
            {/* Basic SEO */}
            <Card>
              <CardHeader>
                <CardTitle>Basic SEO</CardTitle>
                <CardDescription>Title, description, and keywords</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Page Path</Label>
                  <Input value={selectedPage.page_path} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input
                    value={selectedPage.meta_title || ''}
                    onChange={(e) => updateField('meta_title', e.target.value)}
                    placeholder="AI Character Explorer - Skapa Din AI Flickvän"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedPage.meta_title?.length || 0}/60 characters (optimal: 50-60)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={selectedPage.meta_description || ''}
                    onChange={(e) => updateField('meta_description', e.target.value)}
                    placeholder="Beskrivning av sidan för sökmotorer..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedPage.meta_description?.length || 0}/160 characters (optimal: 150-160)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Meta Keywords</Label>
                  <Input
                    value={selectedPage.meta_keywords || ''}
                    onChange={(e) => updateField('meta_keywords', e.target.value)}
                    placeholder="ai flickvän, virtuell dating, ai chat"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
                </div>
              </CardContent>
            </Card>

            {/* OpenGraph / Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>OpenGraph / Social Media</CardTitle>
                <CardDescription>How your page appears on Facebook, LinkedIn, etc.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>OG Title</Label>
                  <Input
                    value={selectedPage.og_title || ''}
                    onChange={(e) => updateField('og_title', e.target.value)}
                    placeholder="Leave empty to use Meta Title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>OG Description</Label>
                  <Textarea
                    value={selectedPage.og_description || ''}
                    onChange={(e) => updateField('og_description', e.target.value)}
                    placeholder="Leave empty to use Meta Description"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>OG Image URL</Label>
                  <Input
                    value={selectedPage.og_image || ''}
                    onChange={(e) => updateField('og_image', e.target.value)}
                    placeholder="https://example.com/og-image.jpg"
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 1200x630px</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>OG Type</Label>
                    <Select value={selectedPage.og_type} onValueChange={(value) => updateField('og_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="article">Article</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Twitter Card</Label>
                    <Select value={selectedPage.twitter_card} onValueChange={(value) => updateField('twitter_card', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced</CardTitle>
                <CardDescription>Canonical URL, robots, language</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Canonical URL</Label>
                  <Input
                    value={selectedPage.canonical_url || ''}
                    onChange={(e) => updateField('canonical_url', e.target.value)}
                    placeholder="https://example.com/page"
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to auto-generate</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Robots</Label>
                    <Select value={selectedPage.robots} onValueChange={(value) => updateField('robots', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="index,follow">Index, Follow</SelectItem>
                        <SelectItem value="noindex,follow">No Index, Follow</SelectItem>
                        <SelectItem value="index,nofollow">Index, No Follow</SelectItem>
                        <SelectItem value="noindex,nofollow">No Index, No Follow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={selectedPage.language} onValueChange={(value) => updateField('language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sv">Swedish (sv)</SelectItem>
                        <SelectItem value="en">English (en)</SelectItem>
                        <SelectItem value="no">Norwegian (no)</SelectItem>
                        <SelectItem value="da">Danish (da)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setSelectedPage(pages.find((p) => p.id === selectedPage.id) || null)}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
