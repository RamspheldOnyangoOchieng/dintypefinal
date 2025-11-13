import { Metadata } from "next";
import { 
  CheckCircle2, 
  Clock, 
  Rocket,
  Sparkles,
  MessageSquare,
  ImagePlus,
  Mic,
  Video,
  Zap,
  Globe,
  Users,
  Shield,
  TrendingUp,
  Brain,
  Heart
} from "lucide-react";

export const metadata: Metadata = {
  title: "Roadmap - Framtidsplaner | Dintyp.se",
  description: "Se vår produktroadmap och kommande funktioner för Dintyp.se. Upptäck vad vi arbetar på och vad som kommer härnäst.",
};

export default function RoadmapPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
          <Rocket className="h-4 w-4" />
          <span className="text-sm font-semibold">Produktutveckling</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Vår Roadmap
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Följ med på vår resa! Här ser du vad vi har uppnått, vad vi arbetar på just nu, 
          och vad som kommer härnäst för Dintyp.se
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-12">
        
        {/* Completed Features */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-green-500/10 p-3 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Klart & Lanserat</h2>
              <p className="text-muted-foreground">Funktioner som redan är tillgängliga</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-500/5 to-green-500/0 border border-green-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI-karaktärsskapande</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Fullständig 6-stegs wizard för att skapa anpassade AI-karaktärer med personlighet, 
                    utseende och egenskaper.
                  </p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Lanserad Q4 2024</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-green-500/0 border border-green-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI-bildgenerering</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Kraftfull bildgenerator med stöd för 1-8 bilder samtidigt, negativ prompt och 
                    automatisk sparning i galleri.
                  </p>
                  <div className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Lanserad Q4 2024</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-green-500/0 border border-green-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Intelligent chattfunktion</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Realtids-AI-konversationer med kontextmedvetenhet, personlighetsanpassning och 
                    chatthistorik.
                  </p>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Lanserad Q4 2024</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-green-500/0 border border-green-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Premium-system</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Token-baserat system med premium-medlemskap, Stripe-betalningar och 
                    automatisk fakturahantering.
                  </p>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Lanserad Q4 2024</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-green-500/0 border border-green-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Samlingar & Galleri</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Organisera och hantera genererade bilder med samlingar, favoriter och 
                    nedladdningsfunktion.
                  </p>
                  <div className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Lanserad Q4 2024</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/5 to-green-500/0 border border-green-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">OAuth-inloggning</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enkel inloggning med Google, Discord och Twitter/X förutom 
                    traditionell email/lösenord.
                  </p>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Lanserad Q1 2025</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* In Progress */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-500/10 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Pågående Utveckling</h2>
              <p className="text-muted-foreground">Vad vi arbetar på just nu</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/0 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="relative">
                  <Clock className="h-5 w-5 text-blue-500 mt-1 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Röstgenerering (TTS)</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Text-till-tal för karaktärer så att de kan "tala" sina meddelanden med unika röster.
                  </p>
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-500 font-medium">Förväntas Q1 2025</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/0 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <Clock className="h-5 w-5 text-blue-500 mt-1 animate-pulse flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Förbättrad Admin Dashboard</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Utökad administratörspanel med användarhantering, bannfunktion, kostnadsloggning 
                    och detaljerad statistik.
                  </p>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-500 font-medium">Förväntas Q1 2025</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/0 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <Clock className="h-5 w-5 text-blue-500 mt-1 animate-pulse flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Mobilapp (PWA)</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Progressive Web App för bättre mobil-upplevelse med offline-stöd och 
                    push-notifikationer.
                  </p>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-500 font-medium">Förväntas Q2 2025</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/0 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <Clock className="h-5 w-5 text-blue-500 mt-1 animate-pulse flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Community-funktioner</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Dela karaktärer, följ andra användare, kommentera och gilla skapelser i 
                    community-flödet.
                  </p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-500 font-medium">Förväntas Q2 2025</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Planned Features */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-purple-500/10 p-3 rounded-lg">
              <Rocket className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Kommande Funktioner</h2>
              <p className="text-muted-foreground">På vår radar för framtiden</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/0 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <Rocket className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Videosamtal med AI</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Levande videosamtal där karaktärens ansikte animeras baserat på konversationen 
                    med lipsync och känslor.
                  </p>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Planerad Q3 2025</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/0 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <Rocket className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Röstkloning</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ladda upp röstprov för att ge din karaktär en helt unik och naturlig röst baserad 
                    på verkliga inspelningar.
                  </p>
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Planerad Q3 2025</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/0 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <Rocket className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Flerspråksstöd</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Utökat stöd för fler språk utöver svenska och engelska, inklusive automatisk 
                    översättning i realtid.
                  </p>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Planerad Q3 2025</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/0 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <Rocket className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI-modellval</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Välj mellan olika AI-modeller (GPT-4, Claude, Gemini) för varierande 
                    personlighetstyper och svarsstilar.
                  </p>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Planerad Q4 2025</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/0 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <Rocket className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Karaktärsmarknadsplats</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Köp och sälj karaktärer, bildpaket och prompt-mallar från andra kreatörer i 
                    community:t.
                  </p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Planerad Q4 2025</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/5 to-purple-500/0 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-3">
                <Rocket className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">API för utvecklare</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Öppet API för att integrera Dintyp.se's funktioner i egna applikationer och 
                    tjänster.
                  </p>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Planerad 2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Feedback Section */}
      <div className="mt-16 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 text-center">
        <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Din feedback är viktig!</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Vill du se en specifik funktion? Har du idéer om hur vi kan förbättra plattformen? 
          Vi lyssnar på våra användare och din feedback formar vår roadmap.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a 
            href="/kontakta" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-semibold"
          >
            <MessageSquare className="h-5 w-5" />
            Kontakta oss
          </a>
          <a 
            href="/faq" 
            className="inline-flex items-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-md hover:bg-primary/10 transition-colors font-semibold"
          >
            Läs FAQ
          </a>
        </div>
      </div>

      {/* Note */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          <strong>OBS:</strong> Alla datum är uppskattningar och kan ändras baserat på utvecklingsprioriteringar 
          och användarfeedback. Vi strävar alltid efter högsta kvalitet i varje release.
        </p>
      </div>
    </div>
  );
}
