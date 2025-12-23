"use client";

import { useState } from 'react';
import { Loader2, RefreshCw, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';

export default function ImageGeneratorAdmin() {
  const [style, setStyle] = useState<'realistic' | 'anime'>('realistic');
  const [category, setCategory] = useState<string>('age');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);

  const categories = {
    age: ['18-22', '23-27', '28-32', '33-37', '38+'],
    body: ['Slim', 'Athletic', 'Curvy', 'Average', 'Plus-size'],
    ethnicity: ['European', 'East Asian', 'South Asian', 'Middle Eastern', 'African', 'Latina', 'Caribbean', 'Mixed']
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    setProgress('Starting generation...');
    setResults([]);

    try {
      const values = categories[category as keyof typeof categories];

      const response = await fetch('/api/attribute-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch',
          category,
          values,
          style
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.images);
        setProgress(`✓ Generated ${data.generated}/${data.total} images successfully!`);
      } else {
        setProgress(`✗ Failed: ${data.error}`);
      }
    } catch (error: any) {
      setProgress(`✗ Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateOne = async (value: string) => {
    try {
      const response = await fetch('/api/attribute-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          category,
          value,
          style
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update results
        setResults(prev => 
          prev.map(img => 
            img.value === value ? data.image : img
          )
        );
        alert(`Successfully regenerated image for ${value}`);
      } else {
        alert(`Failed to regenerate: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎨 Attribute Image Generator</h1>
          <p className="text-gray-400">Generate and manage images for character creation attributes</p>
        </div>

        {/* Controls */}
        <div className="bg-[#18181f] rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as 'realistic' | 'anime')}
                className="w-full px-4 py-2 bg-[#23232b] rounded-lg border border-[#252525] focus:border-primary focus:outline-none"
                disabled={generating}
              >
                <option value="realistic">Realistic</option>
                <option value="anime">Anime</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-[#23232b] rounded-lg border border-[#252525] focus:border-primary focus:outline-none"
                disabled={generating}
              >
                <option value="age">Age</option>
                <option value="body">Body Type</option>
                <option value="ethnicity">Ethnicity</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateAll}
                disabled={generating}
                className="w-full px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Generate All
                  </>
                )}
              </button>
            </div>
          </div>

          {progress && (
            <div className={`p-4 rounded-lg ${
              progress.includes('✓') ? 'bg-green-500/10 text-green-400' :
              progress.includes('✗') ? 'bg-red-500/10 text-red-400' :
              'bg-blue-500/10 text-blue-400'
            }`}>
              {progress}
            </div>
          )}
        </div>

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="bg-[#18181f] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Generated Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.map((img) => (
                <div key={img.id} className="bg-[#23232b] rounded-lg overflow-hidden border border-[#252525]">
                  <div className="relative aspect-[3/4] bg-[#1a1a1a]">
                    {img.image_url ? (
                      <img
                        src={img.image_url}
                        alt={img.value}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => handleRegenerateOne(img.value)}
                        className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-semibold mb-1">{img.value}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      {img.image_url ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          Generated
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-400" />
                          Failed
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">📝 Instructions</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>1. Select the <strong>Style</strong> (Realistic or Anime)</li>
            <li>2. Choose a <strong>Category</strong> (Age, Body Type, or Ethnicity)</li>
            <li>3. Click <strong>"Generate All"</strong> to create images for all values in that category</li>
            <li>4. Images are automatically cached in the database</li>
            <li>5. Use the regenerate button (↻) to create a new version of any image</li>
            <li>6. Generated images will appear in the character creation flow</li>
          </ul>
        </div>

        {/* Warning */}
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">⚠️ Important Notes</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Image generation can take 30-60 seconds per image</li>
            <li>• Make sure your NOVITA_API is configured in environment variables</li>
            <li>• Images are generated with tasteful, professional, non-explicit prompts</li>
            <li>• Each category has 5-8 values, so full generation may take several minutes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
