"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

export default function DebugCollectionsPage() {
    const [images, setImages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const supabase = createClient()

                // Fetch stats
                const { data: countData, error: countError } = await supabase
                    .from('generated_images')
                    .select('user_id', { count: 'exact' })

                if (countError) throw countError

                // Fetch last 50 images
                const { data, error } = await supabase
                    .from('generated_images')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50)

                if (error) throw error

                setImages(data || [])

                // Group by user_id for stats
                const userStats: Record<string, number> = {}
                data?.forEach(img => {
                    userStats[img.user_id] = (userStats[img.user_id] || 0) + 1
                })
                setStats(userStats)

            } catch (err: any) {
                console.error(err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <div className="p-10 text-white">Loading debug data...</div>
    if (error) return <div className="p-10 text-red-500">Error: {error}</div>

    return (
        <div className="p-10 text-white bg-black min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Database Debug: generated_images</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Summary (Last 50 images)</h2>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-zinc-900 p-4 rounded">
                        <div className="text-zinc-400 text-sm">Total Images</div>
                        <div className="text-2xl font-bold">{images.length}</div>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">User Distribution (Last 50)</h2>
                <pre className="bg-zinc-900 p-4 rounded overflow-auto">
                    {JSON.stringify(stats, null, 2)}
                </pre>
            </div>

            <h2 className="text-xl font-semibold mb-4">Latest Images</h2>
            <div className="grid grid-cols-1 gap-4">
                {images.map((img, i) => (
                    <div key={img.id} className="bg-zinc-900 p-4 rounded border border-zinc-800 flex gap-4">
                        <img src={img.image_url} className="w-24 h-24 object-cover rounded" />
                        <div>
                            <div className="text-sm font-mono text-zinc-500">ID: {img.id}</div>
                            <div className="text-sm font-mono text-blue-400">User: {img.user_id}</div>
                            <div className="text-sm text-zinc-300">Prompt: {img.prompt}</div>
                            <div className="text-xs text-zinc-500 mt-2">Created: {img.created_at}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
