import { Metadata } from "next";
import Link from "next/link";
import { 
  Sparkles, 
  MessageSquare, 
  ImagePlus, 
  Users, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export const metadata: Metadata = {
  title: "Hur det fungerar | Dintyp.se",
  description: "Lär dig hur Dintyp.se fungerar - Skapa AI-karaktärer, chatta och generera bilder på några enkla steg.",
};

export const dynamic = 'force-dynamic';

export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Hur det fungerar
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Upptäck hur lätt det är att skapa och interagera med AI-karaktärer på Dintyp.se
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-16 mb-16">
        
        {/* Step 1 */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Skapa din AI-karaktär</h2>
            <p className="text-muted-foreground mb-4">
              Välj från hundratals fördefinierade karaktärer eller skapa din egen från grunden. 
              Anpassa allt från utseende till personlighet, yrke och intressen.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Välj ålder, kroppstyp och etnicitet</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Bestäm yrke och hobbyer</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Anpassa personlighetsdrag</span>
              </li>
            </ul>
            <Link 
              href="/create-character"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-semibold"
            >
              Skapa karaktär nu
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="order-1 md:order-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 md:p-12 flex items-center justify-center min-h-[300px]">
            <Users className="h-32 w-32 text-primary/30" />
          </div>
        </div>

        {/* Step 2 */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-2xl p-8 md:p-12 flex items-center justify-center min-h-[300px]">
            <MessageSquare className="h-32 w-32 text-blue-500/30" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div className="bg-blue-500/10 p-3 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Chatta med AI:n</h2>
            <p className="text-muted-foreground mb-4">
              Starta meningsfulla konversationer med din AI-karaktär. 
              Varje karaktär har sin egen unika personlighet och svarar baserat på sina egenskaper.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Naturliga konversationer i realtid</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>AI:n kommer ihåg tidigare i konversationen</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Personlighetsanpassade svar</span>
              </li>
            </ul>
            <Link 
              href="/chat"
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors font-semibold"
            >
              Börja chatta
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Step 3 */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <ImagePlus className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Generera AI-bilder</h2>
            <p className="text-muted-foreground mb-4">
              Skapa fantastiska AI-genererade bilder med vår kraftfulla bildgenerator. 
              Skriv helt enkelt vad du vill se och låt AI:n skapa det åt dig.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Fotorealistiska resultat</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Generera 1-8 bilder samtidigt</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Automatisk sparning i galleri</span>
              </li>
            </ul>
            <Link 
              href="/generate"
              className="inline-flex items-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-md hover:bg-purple-600 transition-colors font-semibold"
            >
              Generera bilder
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="order-1 md:order-2 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-2xl p-8 md:p-12 flex items-center justify-center min-h-[300px]">
            <ImagePlus className="h-32 w-32 text-purple-500/30" />
          </div>
        </div>

      </div>

      {/* Features Overview */}
      <div className="bg-muted/50 rounded-2xl p-8 md:p-12 mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Kraftfulla funktioner</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Avancerad AI</h3>
            <p className="text-sm text-muted-foreground">
              Powered av de senaste AI-modellerna för naturliga konversationer och högkvalitativa bilder
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Obegränsad kreativitet</h3>
            <p className="text-sm text-muted-foreground">
              Skapa så många karaktärer du vill och utforska olika personligheter och stilar
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">24/7 Tillgängligt</h3>
            <p className="text-sm text-muted-foreground">
              Dina AI-karaktärer är alltid redo att chatta, när som helst på dygnet
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Redo att komma igång?</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Gå med idag och börja skapa dina egna AI-karaktärer helt gratis
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link 
            href="/create-character" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-md hover:bg-primary/90 transition-colors font-semibold text-lg"
          >
            Kom igång nu
            <ArrowRight className="h-6 w-6" />
          </Link>
          <Link 
            href="/guide" 
            className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-4 rounded-md hover:bg-primary/10 transition-colors font-semibold text-lg"
          >
            Läs fullständig guide
          </Link>
        </div>
      </div>

      {/* Need Help */}
      <div className="text-center mt-12">
        <p className="text-muted-foreground">
          Har du frågor? Besök vår{" "}
          <Link href="/faq" className="text-primary hover:underline font-semibold">
            FAQ-sida
          </Link>
          {" "}eller{" "}
          <Link href="/kontakta" className="text-primary hover:underline font-semibold">
            kontakta support
          </Link>
        </p>
      </div>
    </div>
  );
}
