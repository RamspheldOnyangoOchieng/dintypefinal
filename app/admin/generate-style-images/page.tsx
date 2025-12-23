'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Image as ImageIcon, CheckCircle2, XCircle } from 'lucide-react';

export default function GenerateStyleImagesPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    realistic: string | null;
    anime: string | null;
    errors: string[];
  } | null>(null);

  const generateBothImages = async () => {
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/generate-style-images', {
        method: 'GET',
      });

      const data = await response.json();
      
      if (data.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Error:', error);
      setResults({
        realistic: null,
        anime: null,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSingleImage = async (style: 'realistic' | 'anime') => {
    setLoading(true);

    try {
      const response = await fetch('/api/generate-style-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ style }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(prev => ({
          realistic: style === 'realistic' ? data.imageUrl : (prev?.realistic || null),
          anime: style === 'anime' ? data.imageUrl : (prev?.anime || null),
          errors: prev?.errors || [],
        }));
      } else {
        setResults(prev => ({
          realistic: prev?.realistic || null,
          anime: prev?.anime || null,
          errors: [...(prev?.errors || []), data.error || 'Unknown error'],
        }));
      }
    } catch (error) {
      console.error('Error:', error);
      setResults(prev => ({
        realistic: prev?.realistic || null,
        anime: prev?.anime || null,
        errors: [...(prev?.errors || []), error instanceof Error ? error.message : 'Unknown error'],
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Generate Style Selection Images</h1>
          <p className="text-gray-400">
            Generate AI images for the Realistic and Anime style selection cards
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={generateBothImages}
              disabled={loading}
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Generate Both Images
                </>
              )}
            </Button>

            <Button
              onClick={() => generateSingleImage('realistic')}
              disabled={loading}
              size="lg"
              variant="outline"
            >
              Generate Realistic Only
            </Button>

            <Button
              onClick={() => generateSingleImage('anime')}
              disabled={loading}
              size="lg"
              variant="outline"
            >
              Generate Anime Only
            </Button>
          </div>

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              <strong>Note:</strong> Each image takes 30-60 seconds to generate. Cost: ~$0.01-0.02 per image.
              Images are automatically uploaded to your Supabase storage bucket.
            </p>
          </div>
        </div>

        {results && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Realistic Style */}
              <div className="border border-[#2a2a2a] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Realistic Style</h3>
                  {results.realistic ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>

                {results.realistic ? (
                  <div>
                    <div className="relative aspect-[3/4] bg-[#0a0a0a] rounded-lg overflow-hidden mb-3">
                      <img
                        src={results.realistic}
                        alt="Realistic Style"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 break-all">{results.realistic}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(results.realistic!);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Copy URL
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-[#0a0a0a] rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Not generated yet</p>
                  </div>
                )}
              </div>

              {/* Anime Style */}
              <div className="border border-[#2a2a2a] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Anime Style</h3>
                  {results.anime ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>

                {results.anime ? (
                  <div>
                    <div className="relative aspect-[3/4] bg-[#0a0a0a] rounded-lg overflow-hidden mb-3">
                      <img
                        src={results.anime}
                        alt="Anime Style"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 break-all">{results.anime}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(results.anime!);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Copy URL
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-[#0a0a0a] rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Not generated yet</p>
                  </div>
                )}
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="text-red-400 font-semibold mb-2">Errors:</h4>
                <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
                  {results.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.realistic && results.anime && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h4 className="text-green-400 font-semibold mb-2">✅ Next Steps:</h4>
                <ol className="list-decimal list-inside text-sm text-green-300 space-y-2">
                  <li>Copy the URLs above</li>
                  <li>
                    Update <code className="px-1 py-0.5 bg-black/50 rounded">components/create-character-flow.tsx</code>
                  </li>
                  <li>
                    Replace the src attributes in Step 0:
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>
                        Realistic: <code className="px-1 py-0.5 bg-black/50 rounded">src=&quot;{results.realistic}&quot;</code>
                      </li>
                      <li>
                        Anime: <code className="px-1 py-0.5 bg-black/50 rounded">src=&quot;{results.anime}&quot;</code>
                      </li>
                    </ul>
                  </li>
                  <li>Test the character creation flow!</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-400">
            <li>Click &quot;Generate Both Images&quot; to create both style selection images at once</li>
            <li>The system uses NOVITA to generate professional, tasteful portrait images</li>
            <li>Images are automatically downloaded and uploaded to your Supabase storage bucket</li>
            <li>Once generated, copy the URLs and update your create-character-flow component</li>
            <li>Images are cached in Supabase, so they load instantly for all users</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
