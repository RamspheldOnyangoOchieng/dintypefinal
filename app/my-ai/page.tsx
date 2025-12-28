"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Heart, MessageCircle, Trash2, Plus, Sparkles, Edit } from 'lucide-react';
import { useAuthModal } from '@/components/auth-modal-context';
import { useAuth } from '@/components/auth-context';
import { PremiumUpgradeModal } from '@/components/premium-upgrade-modal';

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
  is_locked?: boolean;
}

export default function MyAIPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { openLoginModal } = useAuthModal();
  const { user } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  useEffect(() => {
    checkAuthAndFetchCharacters();
  }, []);

  async function checkAuthAndFetchCharacters() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // If logged in, fetch characters
      if (session) {
        await fetchCharacters();
      } else {
        // Not logged in - just show empty state
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsLoading(false);
    }
  }

  async function fetchCharacters() {
    try {
      const response = await fetch('/api/my-characters');

      if (response.status === 401) {
        // Unauthorized - show empty state
        setIsLoading(false);
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

  function handleChat(character: Character) {
    if (character.is_locked) {
      setShowExpiredModal(true);
      return;
    }
    router.push(`/chat/${character.id}`);
  }

  function handleCreateNew() {
    if (!user) {
      openLoginModal();
      return;
    }

    if (!user.isPremium && !user.isAdmin) {
      setShowPremiumModal(true);
      return;
    }

    router.push('/create-character');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Laddar dina AI flickvänner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2">
                <Sparkles className="h-3 w-3" />
                Ditt Galleri
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-4 italic">
                Min <span className="text-primary">AI</span> Flickvän
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-2xl">
                {characters.length === 0
                  ? 'Du har inga AI flickvänner ännu. Släpp loss din fantasi och skapa din perfekta match!'
                  : `Du har format ${characters.length} unik${characters.length !== 1 ? 'a' : ''} AI flickvän${characters.length !== 1 ? 'ner' : ''} hittills.`
                }
              </p>
            </div>

            <button
              onClick={handleCreateNew}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300"
            >
              <Plus className="h-6 w-6" />
              SKAPA NY
            </button>
          </div>
        </div>

        {/* Empty State */}
        {characters.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-3xl bg-card/40 border border-border/50 backdrop-blur-xl">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-primary/5">
              <Heart className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 italic">
              INGA AI FLICKVÄNNER ÄNNU
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-10 max-w-md mx-auto text-lg leading-relaxed">
              Världen väntar på dig. Skapa din första unika AI-karaktär med personlighet, minnen och stil.
            </p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-primary/25 hover:shadow-primary/45 hover:scale-105 transition-all duration-300"
            >
              <Sparkles className="h-6 w-6" />
              BÖRJA SKAPA NU
            </button>
          </div>
        ) : (
          /* Characters Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {characters.map((character) => (
              <div
                key={character.id}
                className="group relative bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col"
              >
                {/* Character Image Container */}
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse -z-10" />
                  {(character.image || character.image_url) ? (
                    <img
                      src={character.image || character.image_url || ''}
                      alt={character.name}
                      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${character.is_locked ? 'blur-sm grayscale' : ''}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="h-16 w-16 text-primary/20" />
                    </div>
                  )}

                  {character.is_locked && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 z-10">
                      <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-amber-500/30">
                        <Sparkles className="h-8 w-8 text-black" />
                      </div>
                      <h3 className="text-white font-black text-center text-lg leading-tight italic uppercase tracking-tighter mb-2">
                        Premium-innehåll låst
                      </h3>
                      <p className="text-white/80 text-center text-xs font-medium leading-normal italic">
                        Förnya ditt medlemskap för att fortsätta chatta med {character.name}.
                      </p>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {character.personality && (
                      <div className="px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5 text-primary" />
                        {character.personality}
                      </div>
                    )}
                  </div>

                  {/* Absolute-positioned Content/Buttons */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="space-y-3">
                      <button
                        onClick={() => handleChat(character)}
                        className={`w-full h-12 flex items-center justify-center gap-2 ${character.is_locked ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'} text-white rounded-xl font-black text-sm tracking-wide shadow-lg shadow-primary/20 transition-all active:scale-95`}
                      >
                        {character.is_locked ? (
                          <>
                            <Sparkles className="h-4 w-4" />
                            LÅS UPP NU
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-4 w-4" />
                            STARTA CHATT
                          </>
                        )}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/characters/${character.id}/edit`)}
                          className="flex-1 h-12 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl font-bold text-xs transition-all"
                        >
                          <Edit className="h-3.5 w-3.5 opacity-60" />
                          REDIGERA
                        </button>
                        <button
                          onClick={() => handleDelete(character.id)}
                          disabled={deletingId === character.id}
                          className="flex-1 h-12 flex items-center justify-center gap-2 bg-white/10 hover:bg-red-500/20 backdrop-blur-md border border-white/20 text-white hover:border-red-500/40 rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                        >
                          {deletingId === character.id ? (
                            <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5 opacity-60" />
                              TA BORT
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Character Info */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate italic">
                      {character.name}
                    </h3>

                    <div className="flex items-center gap-2 mt-1">
                      {character.age && (
                        <span className="text-sm font-bold text-primary">{character.age} ÅR</span>
                      )}
                      {character.relationship && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                          {character.relationship}
                        </span>
                      )}
                    </div>

                    {character.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-3 font-medium leading-relaxed italic opacity-80">
                        "{character.description}"
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(character.created_at).toLocaleDateString('sv-SE')}
                    </span>
                    <Heart className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="Skapa AI Flickvänner"
        description="Uppgradera till Premium för att skapa AI flickvänner"
        imageSrc="https://res.cloudinary.com/ddg02aqiw/image/upload/v1766963048/premium-modals/create_character_premium.jpg"
      />

      <PremiumUpgradeModal
        isOpen={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        mode="expired"
        feature="Premium Utgått"
        description="Ditt Premium-medlemskap har utgått. Förnya för att låsa upp dina sparade karaktärer och fortsätta chatta."
      />
    </div>
  );
}
