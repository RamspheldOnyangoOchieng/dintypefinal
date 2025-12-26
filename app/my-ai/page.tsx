"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Heart, MessageCircle, Trash2, Plus, Sparkles } from 'lucide-react';
import { useAuthModal } from '@/components/auth-modal-context';

interface Character {
  id: string;
  name: string;
  image: string | null;
  image_url: string | null;
  description: string | null;
  personality: string | null;
  relationship: string | null;
  age: number | null;
  created_at: string;
  metadata?: any;
}

export default function MyAIPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { openLoginModal } = useAuthModal();

  useEffect(() => {
    checkAuthAndFetchCharacters();
  }, []);

  async function checkAuthAndFetchCharacters() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Don't show login modal - let navigation handle it
        // Just show empty state or redirect
        setIsLoading(false);
        router.push('/');
        return;
      }

      await fetchCharacters();
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsLoading(false);
    }
  }

  async function fetchCharacters() {
    try {
      const response = await fetch('/api/my-characters');

      if (response.status === 401) {
        router.push('/');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setCharacters(data.characters);
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(characterId: string) {
    if (!confirm('Är du säker på att du vill ta bort denna AI flickvän?')) {
      return;
    }

    setDeletingId(characterId);

    try {
      const response = await fetch(`/api/delete-character/${characterId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCharacters(characters.filter(c => c.id !== characterId));
      } else {
        alert('Misslyckades att ta bort AI flickvän');
      }
    } catch (error) {
      console.error('Error deleting character:', error);
      alert('Ett fel uppstod');
    } finally {
      setDeletingId(null);
    }
  }

  function handleChat(characterId: string) {
    router.push(`/chat/${characterId}`);
  }

  function handleCreateNew() {
    router.push('/create-character');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Laddar dina AI flickvänner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <Heart className="h-10 w-10 text-pink-500" />
                Min AI flickvän
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {characters.length === 0
                  ? 'Du har inga AI flickvänner ännu. Skapa din första!'
                  : `${characters.length} AI flickvän${characters.length !== 1 ? 'ner' : ''}`
                }
              </p>
            </div>

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              Skapa ny
            </button>
          </div>
        </div>

        {/* Empty State */}
        {characters.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-12 w-12 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
              Inga AI flickvänner ännu
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Skapa din första AI flickvän och börja chatta! Det är enkelt och tar bara några minuter.
            </p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <Sparkles className="h-5 w-5" />
              Skapa din första AI flickvän
            </button>
          </div>
        ) : (
          /* Characters Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {characters.map((character) => (
              <div
                key={character.id}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Character Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 dark:from-gray-700 dark:to-gray-600">
                  {(character.image || character.image_url) ? (
                    <img
                      src={character.image || character.image_url || ''}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="h-16 w-16 text-pink-300" />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="w-full space-y-2">
                      <button
                        onClick={() => handleChat(character.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chatta
                      </button>
                      <button
                        onClick={() => handleDelete(character.id)}
                        disabled={deletingId === character.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        {deletingId === character.id ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Tar bort...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Ta bort
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Character Info */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1 truncate">
                    {character.name}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {character.age && (
                      <span>{character.age} år</span>
                    )}
                    {character.relationship && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{character.relationship}</span>
                      </>
                    )}
                  </div>

                  {character.personality && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-medium mb-2">
                      <Sparkles className="h-3 w-3" />
                      {character.personality}
                    </div>
                  )}

                  {character.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                      {character.description}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Skapad {new Date(character.created_at).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
