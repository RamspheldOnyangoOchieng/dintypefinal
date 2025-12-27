import { Metadata } from "next";
import Link from "next/link";
import { 
  Sparkles, 
  MessageSquare, 
  ImagePlus, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Crown,
  Coins,
  FolderOpen,
  Settings,
  Trash2,
  Mail,
  Lock
} from "lucide-react";

export const metadata: Metadata = {
  title: "Guide - Användarguide | Dintyp.se",
  description: "Komplett guide för att komma igång med Dintyp.se. Lär dig hur du skapar AI-karaktärer, chattar, genererar bilder och mycket mer.",
};

export const dynamic = 'force-dynamic';

export default function GuidePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Plattformsguide</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Din kompletta guide till Dintyp.se - från registrering till avancerade funktioner
        </p>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
        
        {/* Section 1: Getting Started */}
        <section className="border-l-4 border-primary pl-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold m-0">1. Kom igång - Registrering</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Skapa ditt konto</h3>
              <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Steg 1: Öppna inloggningsrutan</p>
                    <p className="text-sm text-muted-foreground">
                      Klicka på "Logga in" knappen i det övre högra hörnet på sidan.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Steg 2: Välj registreringsmetod</p>
                    <p className="text-sm text-muted-foreground">
                      Du har tre alternativ:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                      <li>• <strong>E-post och lösenord:</strong> Fyll i din e-postadress och välj ett säkert lösenord</li>
                      <li>• <strong>Google:</strong> Logga in med ditt Google-konto</li>
                      <li>• <strong>Discord:</strong> Logga in med ditt Discord-konto</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Steg 3: Klicka på "Skapa konto"</p>
                    <p className="text-sm text-muted-foreground">
                      Om du ser inloggningsrutan klickar du på länken "Skapa konto" längst ner för att växla till registreringsformuläret.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Steg 4: Klar!</p>
                    <p className="text-sm text-muted-foreground">
                      Du är nu inloggad och kan börja utforska plattformen.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-5">
              <p className="text-sm">
                <strong>💡 Tips:</strong> Om du glömt ditt lösenord kan du klicka på länken "Glömt lösenord?" i inloggningsrutan för att återställa det.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Image Generation */}
        <section className="border-l-4 border-primary pl-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <ImagePlus className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold m-0">2. Bildgenerering</h2>
          </div>

          <div className="space-y-6">
            <p>
              Skapa unika AI-genererade bilder med vår avancerade bildgenerator.
            </p>

            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold">Så här genererar du bilder:</h3>
              
              <ol className="space-y-4 list-decimal list-inside">
                <li className="font-medium">
                  Navigera till <Link href="/generate" className="text-primary hover:underline">Skapa bild</Link>
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    Hitta "Skapa bild" i menyn eller sidofältet.
                  </p>
                </li>
                
                <li className="font-medium">
                  Skriv din prompt
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    Beskriv detaljerat vad du vill se i bilden. Ju mer specifik beskrivning, desto bättre resultat.
                  </p>
                  <div className="bg-background border border-border rounded p-3 ml-6 mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Exempel på bra prompt:</p>
                    <p className="text-sm font-mono">
                      "En ung kvinna med långt brunt hår, blå ögon, vänligt leende, solnedgång i bakgrunden, fotorealistisk stil"
                    </p>
                  </div>
                </li>
                
                <li className="font-medium">
                  Lägg till negativ prompt (valfritt)
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    Klicka på "Visa negativ prompt" för att specificera vad du INTE vill ha i bilden. Exempel: "suddigt, dålig kvalitet, distorderat"
                  </p>
                </li>
                
                <li className="font-medium">
                  Välj antal bilder
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    Välj hur många bilder du vill generera samtidigt:
                  </p>
                  <ul className="text-sm text-muted-foreground ml-6 mt-1 space-y-1">
                    <li>• <strong>1 bild:</strong> 5 tokens</li>
                    <li>• <strong>4 bilder:</strong> 20 tokens</li>
                    <li>• <strong>6 bilder:</strong> 30 tokens</li>
                    <li>• <strong>8 bilder:</strong> 40 tokens</li>
                  </ul>
                </li>
                
                <li className="font-medium">
                  Använd förslag (valfritt)
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    Ovanför promptfältet finns kategorier med förslag. Klicka på en kategori och sedan på ett förslag för att snabbt fylla i en prompt.
                  </p>
                </li>

                <li className="font-medium">
                  Klicka på "Generera"
                  <p className="text-sm text-muted-foreground ml-6 mt-1">
                    Dina bilder genereras på några sekunder. Du kan se framstegsindikatorn medan bilderna skapas.
                  </p>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Hantera genererade bilder</h3>
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Automatisk sparning i Galleri</h4>
                  </div>
                  <p className="text-sm">
                    Alla genererade bilder sparas automatiskt i ditt <Link href="/collections" className="text-primary hover:underline">Galleri</Link> (Collection). Du behöver inte göra något - de finns där direkt efter generering.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold">Bildhantering</h4>
                  <p className="text-sm text-muted-foreground">I galleriet kan du:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Markera bilder som favoriter med hjärtikonen</li>
                    <li>• Ladda ner bilder till din enhet</li>
                    <li>• Radera bilder du inte vill behålla</li>
                    <li>• Skapa samlingar för att organisera dina bilder</li>
                    <li>• Lägg till bilder i specifika samlingar</li>
                    <li>• Använd selektionsläge för att hantera flera bilder samtidigt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: AI Characters */}
        <section className="border-l-4 border-primary pl-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold m-0">3. Skapa AI-karaktär</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">6-stegs guidad process</h3>
              
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Vår karaktärsskapare använder en 6-stegs wizard som guidar dig genom processen:
                </p>

                <div className="space-y-3">
                  <div className="border-l-4 border-primary/50 pl-4">
                    <h4 className="font-semibold">Steg 1: Välj stil och modell</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Börja med att välja från befintliga karaktärsmallar. Du kan filtrera baserat på:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-4 mt-2 space-y-1">
                      <li>• <strong>Ålder (Age)</strong></li>
                      <li>• <strong>Kroppstyp (Body)</strong></li>
                      <li>• <strong>Etnicitet (Ethnicity)</strong></li>
                      <li>• <strong>Språk (Language)</strong></li>
                      <li>• <strong>Relation (Relationship)</strong></li>
                      <li>• <strong>Yrke (Occupation)</strong></li>
                      <li>• <strong>Hobbyer (Hobbies)</strong></li>
                      <li>• <strong>Personlighet (Personality)</strong></li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      När du använder filter highlightas matchande karaktärer. Klicka på en för att välja den som bas.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary/50 pl-4">
                    <h4 className="font-semibold">Steg 2: Grundläggande info</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Granska karaktärens grundegenskaper:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-4 mt-2 space-y-1">
                      <li>• Ålder (Age) 🎂</li>
                      <li>• Kroppstyp (Body) 💪</li>
                      <li>• Etnicitet (Ethnicity) 🌎</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-primary/50 pl-4">
                    <h4 className="font-semibold">Steg 3: Kommunikation</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Se hur karaktären kommunicerar:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-4 mt-2 space-y-1">
                      <li>• Språk (Language) 🗣️</li>
                      <li>• Relationsstatus (Relationship) 💑</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-primary/50 pl-4">
                    <h4 className="font-semibold">Steg 4: Karriär</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Granska karaktärens yrke och arbete: Occupation 💼
                    </p>
                  </div>

                  <div className="border-l-4 border-primary/50 pl-4">
                    <h4 className="font-semibold">Steg 5: Personlighet</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Se karaktärens hobbyer och personlighetsdrag visas som badges/taggar.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary/50 pl-4">
                    <h4 className="font-semibold">Steg 6: Slutlig förhandsgranskning</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Granska all information om din karaktär:
                    </p>
                    <ul className="text-sm text-muted-foreground ml-4 mt-2 space-y-1">
                      <li>• Namn och profilbild</li>
                      <li>• Beskrivning</li>
                      <li>• Alla egenskaper sammanfattade</li>
                      <li>• Hobbyer och personlighetsdrag</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      Klicka på "Create my AI" för att slutföra!
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                  <p className="text-sm">
                    <strong>💡 Tips:</strong> Du kan navigera fram och tillbaka mellan stegen med pil-knapparna för att justera dina val.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Utforska befintliga karaktärer</h3>
              <p className="mb-4">
                Gå till <Link href="/characters" className="text-primary hover:underline">Characters</Link>-sidan för att bläddra bland alla tillgängliga AI-karaktärer. Klicka på "View Character" eller "New Character" för att skapa eller chatta.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Chat */}
        <section className="border-l-4 border-primary pl-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold m-0">4. Chatta med AI-karaktärer</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Starta en konversation</h3>
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <ol className="space-y-3 list-decimal list-inside">
                  <li className="font-medium">
                    Hitta en karaktär
                    <p className="text-sm text-muted-foreground ml-6 mt-1">
                      Gå till <Link href="/characters" className="text-primary hover:underline">Characters</Link> för att se alla tillgängliga karaktärer, eller gå till <Link href="/chat" className="text-primary hover:underline">Chatta</Link> för att se dina senaste konversationer.
                    </p>
                  </li>
                  
                  <li className="font-medium">
                    Klicka på karaktären
                    <p className="text-sm text-muted-foreground ml-6 mt-1">
                      Klicka på ett karaktärskort för att öppna chattfönstret med den karaktären.
                    </p>
                  </li>
                  
                  <li className="font-medium">
                    Börja prata
                    <p className="text-sm text-muted-foreground ml-6 mt-1">
                      Skriv ditt meddelande i textfältet längst ner och tryck Enter eller klicka på skicka-knappen (pil-ikon). Karaktären svarar baserat på sin personlighet och konversationshistorik.
                    </p>
                  </li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Chattfunktioner</h3>
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">� Automatisk sparning</h4>
                  <p className="text-sm text-muted-foreground">
                    All chatthistorik sparas automatiskt i localStorage. Du kan se dina tidigare konversationer på <Link href="/chat" className="text-primary hover:underline">Chatta</Link>-sidan under "Recent Conversations".
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">�️ Rensa chatt</h4>
                  <p className="text-sm text-muted-foreground">
                    Klicka på menyikonen (tre prickar) längst upp i chattfönstret för att öppna menyn. Välj alternativet för att rensa chatthistoriken. Detta startar en helt ny konversation utan tidigare kontext.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">� Sidofält med chattlista</h4>
                  <p className="text-sm text-muted-foreground">
                    I chattfönstret kan du öppna sidofältet för att se alla karaktärer du har chattat med. Det visar den senaste meddelandet från varje konversation. Klicka på en karaktär för att byta konversation.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">�️ Begär bilder i chatten</h4>
                  <p className="text-sm text-muted-foreground">
                    AI:n kan identifiera när du ber om bilder. Skriv något som "Visa mig en bild av..." eller "Skapa en bild av..." så kommer karaktären att generera en bild baserat på din beskrivning.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">🔊 Röstfunktioner (experimentell)</h4>
                  <p className="text-sm text-muted-foreground">
                    Vissa karaktärer kan ha röstfunktioner där du kan lyssna på AI:ns svar. Klicka på högtalare-ikonen för att höra meddelandet uppläst.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">📹 Videosamtal (om tillgängligt)</h4>
                  <p className="text-sm text-muted-foreground">
                    Om karaktären har en video-URL kan du initiera ett videosamtal för en mer immersiv upplevelse.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Chatttips</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Kontextmedvetenhet
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    AI:n kommer ihåg hela konversationshistoriken i den aktuella sessionen, så du kan referera tillbaka till tidigare ämnen.
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Personlighetsanpassning
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Varje karaktär har sin egen personlighet, yrke, hobbyer och kommunikationsstil baserat på sina egenskaper.
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Rensa vid behov
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Om konversationen känns utdaterad eller du vill börja om, använd "Rensa chatt" funktionen för en ny start.
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Följ riktlinjerna
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Håll konversationer respektfulla och följ våra <Link href="/riktlinjer" className="text-primary hover:underline">community-riktlinjer</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Tokens & Premium */}
        <section className="border-l-4 border-primary pl-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold m-0">5. Tokens och Premium</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Vad är tokens?</h3>
              <p className="mb-4">
                Tokens är plattformens valuta som används för bildgenerering. Token-kostnader per bildgenerering:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">1 bild</h4>
                  <p className="text-sm text-muted-foreground">5 tokens</p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">4 bilder</h4>
                  <p className="text-sm text-muted-foreground">20 tokens</p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">6 bilder</h4>
                  <p className="text-sm text-muted-foreground">30 tokens</p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">8 bilder</h4>
                  <p className="text-sm text-muted-foreground">40 tokens</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Köp token-paket</h3>
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  På <Link href="/premium" className="text-primary hover:underline">Premium</Link>-sidan kan du köpa olika token-paket. Paket och priser hanteras av administratörer och kan variera.
                </p>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Så här köper du tokens:</h4>
                  <ol className="space-y-2 list-decimal list-inside text-sm text-muted-foreground">
                    <li>Gå till <Link href="/premium" className="text-primary hover:underline">Premium</Link>-sidan</li>
                    <li>Scrolla ner till "Token-paket" sektionen</li>
                    <li>Välj ett paket som passar dina behov</li>
                    <li>Klicka på "Köp nu"</li>
                    <li>Fyll i betalningsuppgifter via Stripe</li>
                    <li>Dina tokens läggs till på ditt konto direkt efter betalning</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Premium-medlemskap</h3>
              <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-primary" />
                  <h4 className="text-xl font-bold">Premium Membership</h4>
                </div>
                
                <p className="text-muted-foreground">
                  Premium-medlemmar får förbättrade funktioner och förmåner. Exakta funktioner konfigureras av administratörer i "Plan Features" tabellen.
                </p>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>💡 Obs:</strong> Premium-funktioner kan inkludera obegränsade tokens, snabbare generering, högre bildkvalitet, prioriterad support och mycket mer. Besök <Link href="/premium" className="text-primary hover:underline">Premium</Link>-sidan för att se aktuella förmåner och priser.
                  </p>
                </div>

                <div className="pt-4">
                  <Link 
                    href="/premium" 
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-semibold"
                  >
                    Se priser och uppgradera
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>

                <div className="pt-4 border-t border-primary/20">
                  <p className="text-sm">
                    <strong>Hur uppgraderar jag?</strong>
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-1 mt-2 ml-4 list-decimal">
                    <li>Gå till <Link href="/premium" className="text-primary hover:underline">Premium</Link>-sidan</li>
                    <li>Välj önskat Premium-paket</li>
                    <li>Klicka på "Uppgradera" knappen</li>
                    <li>Fyll i betalningsuppgifter via säker Stripe-betalning</li>
                    <li>Bekräfta köpet - Premium aktiveras direkt!</li>
                  </ol>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Kontrollera din premiumstatus</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Premium-sidan visar automatiskt din nuvarande status när du är inloggad. Systemet kontrollerar din prenumeration och visar om du är Free eller Premium-användare.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Settings & Account */}
        <section className="border-l-4 border-primary pl-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold m-0">6. Inställningar</h2>
          </div>

          <div className="space-y-6">
            <p>
              Hantera ditt konto och preferenser via <Link href="/settings" className="text-primary hover:underline">Inställningar</Link>-sidan.
            </p>

            <div>
              <h3 className="text-xl font-semibold mb-3">Profilinställningar</h3>
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Tillgängliga inställningar:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Användarnamn (Nickname):</strong> Ändra ditt visningsnamn
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Kön (Gender):</strong> Välj Man, Kvinna eller annat
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>E-mail:</strong> Din registrerade e-postadress
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Lösenord:</strong> Visas maskerat (********)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Telefonnummer (Phone):</strong> Valfritt kontaktnummer
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Crown className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Nuvarande Plan:</strong> Visar "Gratis" eller "Premium"
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Klicka på "Spara ändringar" knappen längst ner för att uppdatera din profil.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Språk och notifikationer</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-5 space-y-3">
                  <h4 className="font-semibold">🌍 Språk</h4>
                  <p className="text-sm text-muted-foreground">
                    Välj mellan Svenska (sv) och English (en). Språkinställningen påverkar plattformens gränssnitt.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-5 space-y-3">
                  <h4 className="font-semibold">🔔 Automatiska aviseringar</h4>
                  <p className="text-sm text-muted-foreground">
                    Aktivera eller inaktivera automatiska notifikationer från plattformen genom att markera/avmarkera checkboxen.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Chatbot-begränsningar</h3>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-5">
                <p className="text-sm text-muted-foreground mb-3">
                  På inställningssidan finns en omfattande lista över chatbot-begränsningar och förbjudet innehåll, inklusive:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Olagliga aktiviteter och kriminellt beteende</li>
                  <li>• Innehåll relaterat till minderåriga (absolut förbjudet)</li>
                  <li>• Våld, hot och hatretorik</li>
                  <li>• Integritetskränkningar och personuppgiftsdelning</li>
                  <li>• Spam och irrelevant innehåll</li>
                  <li>• Och många fler kategorier...</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  Läs igenom hela listan på <Link href="/settings" className="text-primary hover:underline">Inställningar</Link>-sidan för att förstå vad som är tillåtet.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Premium-uppgradering</h3>
              <div className="border border-primary rounded-lg p-5 bg-primary/5">
                <p className="text-sm text-muted-foreground mb-3">
                  Om du har ett gratis konto kommer du att se en "Uppgradera till Premium" knapp på inställningssidan som tar dig till <Link href="/premium" className="text-primary hover:underline">Premium</Link>-sidan.
                </p>
              </div>
            </div>

            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-lg text-destructive m-0">Radera konto</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Längst ner på inställningssidan finns en "Danger Zone" sektion. Här kan du permanent radera ditt konto och all associerad data.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                <strong>Så här raderar du ditt konto:</strong>
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 ml-4 list-decimal">
                <li>Scrolla ner till "Danger Zone" sektionen</li>
                <li>Klicka på "Radera konto" knappen</li>
                <li>En bekräftelsedialog visas där du kan lämna feedback om varför du lämnar</li>
                <li>Bekräfta borttagningen</li>
                <li>Ditt konto och all data raderas permanent</li>
              </ol>
              <p className="text-sm text-destructive mt-3 font-semibold">
                ⚠️ Varning: Detta kan inte ångras! All din data, karaktärer, chattar och bilder försvinner permanent.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: Support */}
        <section className="border-l-4 border-primary pl-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold m-0">7. Support och hjälp</h2>
          </div>

          <div className="space-y-6">
            <p>Behöver du hjälp? Vi finns här för dig!</p>

            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/faq" className="border border-border rounded-lg p-5 hover:border-primary transition-colors space-y-2">
                <h3 className="font-semibold text-lg">❓ Vanliga frågor (FAQ)</h3>
                <p className="text-sm text-muted-foreground">
                  Hitta svar på de mest ställda frågorna om plattformen.
                </p>
              </Link>

              <Link href="/kontakta" className="border border-border rounded-lg p-5 hover:border-primary transition-colors space-y-2">
                <h3 className="font-semibold text-lg">📧 Kontakta support</h3>
                <p className="text-sm text-muted-foreground">
                  Skicka ett meddelande till vårt supportteam.
                </p>
              </Link>

              <Link href="/riktlinjer" className="border border-border rounded-lg p-5 hover:border-primary transition-colors space-y-2">
                <h3 className="font-semibold text-lg">📋 Community-riktlinjer</h3>
                <p className="text-sm text-muted-foreground">
                  Läs våra regler för att skapa en trygg miljö.
                </p>
              </Link>

              <Link href="/rapportera" className="border border-border rounded-lg p-5 hover:border-primary transition-colors space-y-2">
                <h3 className="font-semibold text-lg">🚨 Rapportera problem</h3>
                <p className="text-sm text-muted-foreground">
                  Rapportera olämpligt innehåll eller tekniska problem.
                </p>
              </Link>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-3">💡 Tips för snabbare support</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Kontrollera FAQ först - många vanliga frågor besvaras där</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Inkludera skärmdumpar när du rapporterar problem</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Beskriv problemet så detaljerat som möjligt</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Premium-medlemmar får prioriterad support med snabbare svarstid</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Final Section: Next Steps */}
        <section className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 rounded-lg p-8 text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Redo att börja?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Nu när du känner till alla funktioner är det dags att utforska Dintyp.se! Skapa din första AI-karaktär, generera fantastiska bilder och ha roliga konversationer.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              href="/create-character" 
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-semibold"
            >
              <Users className="h-5 w-5" />
              Skapa karaktär
            </Link>
            <Link 
              href="/generate" 
              className="inline-flex items-center gap-2 border-2 border-primary text-primary px-6 py-3 rounded-md hover:bg-primary/10 transition-colors font-semibold"
            >
              <ImagePlus className="h-5 w-5" />
              Generera bild
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
