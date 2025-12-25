import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - Vanliga frågor | Dintyp.se",
  description: "Behöver du hjälp eller har du frågor? Besök vår supportsektion och FAQ där du hittar svar på vanliga frågor och användbara guider för att optimera din upplevelse.",
};

export const dynamic = 'force-dynamic';

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Vanliga frågor: FAQ</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p className="text-xl">
          Välkommen till Dintyp FAQ! Vi har sammanställt en lista över vanliga frågor för att hjälpa dig att förstå vår plattform och få ut det mesta av din upplevelse. Om du inte hittar svaret du letar efter, tveka inte att kontakta vårt supportteam på{" "}
          <a href="mailto:support@dintyp.se" className="text-primary hover:underline">
            support@dintyp.se
          </a>
        </p>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">Kom igång med Dintyp</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Vad är Dintyp?</h3>
              <p>
                Dintyp är en innovativ plattform som låter dig skapa unika AI-karaktärer och delta i interaktiva konversationer med dem med hjälp av generativ artificiell intelligens. Du kan anpassa din upplevelse och utforska kreativa interaktioner. Dessutom erbjuder Dintyp en AI-driven funktion för bildgenerering baserat på dina textbeskrivningar.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Hur fungerar er plattform?</h3>
              <p>
                Vår plattform använder avancerade AI-modeller för att förstå dina textinmatningar och generera relevanta och engagerande svar från dina AI-karaktärer. För bildgenerering ger du textprompter, och vår AI skapar visuellt innehåll baserat på dessa beskrivningar. Våra system inkluderar också innehållsmoderering för att säkerställa en trygg och respektfull miljö.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Är er tjänst gratis att använda?</h3>
              <p>
                Dintyp erbjuder både gratis- och premiumfunktioner. Gratisversionen kan ha begränsningar i användning, antalet AI-interaktioner eller tillgång till vissa funktioner. Vår premiumprenumeration låser upp ytterligare fördelar och tar bort dessa begränsningar.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Vad är en premiumprenumeration och vad kostar den?</h3>
              <p>
                Vår premiumprenumeration erbjuder förbättrade funktioner som obegränsade meddelanden, snabbare svarstider, tillgång till exklusiva funktioner och högre gränser för bildgenerering. Du kan hitta detaljerad prisinformation på vår prissida.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Hur skapar jag ett konto?</h3>
              <p>Att skapa ett konto på Dintyp är enkelt! Du kan registrera dig med en av följande metoder:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Social inloggning:</strong> Logga in snabbt med ditt befintliga Discord- eller Google-konto.</li>
                <li><strong>E-postregistrering:</strong> Registrera dig med en giltig e-postadress och skapa ett säkert lösenord. Du behöver vanligtvis verifiera din e-postadress efter registreringen.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">Dina AI-karaktärer och interaktioner</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Kan jag anpassa min AI-karaktär?</h3>
              <p>
                Ja, Dintyp låter dig anpassa dina AI-karaktärer. Du kan vanligtvis definiera olika aspekter som namn, personlighetsdrag, bakgrundshistoria och intressen. Graden av anpassning kan variera beroende på de specifika funktioner som erbjuds.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Kan jag be om foton i chatten?</h3>
              <p>
                Möjligheten att begära och ta emot foton i chattgränssnittet med din AI-karaktär kan vara en funktion i Dintyp. Vänligen se de specifika funktionerna som är tillgängliga i chattgränssnittet. Tänk på att allt genererat innehåll är föremål för våra innehållsmodereringspolicyer för att säkerställa säkerhet och lämplighet.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Genereras bilderna i realtid?</h3>
              <p>
                Genereringstiden för bilder kan variera beroende på hur komplex din förfrågan är och den aktuella systembelastningen. Även om vi strävar efter snabb generering, kanske det inte alltid är omedelbart.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">Konto- och prenumerationshantering</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Hur betalar jag för premiumprenumerationen?</h3>
              <p>
                Du kan betala för premiumprenumerationen via vår webbplats eller app med de tillgängliga betalningsmetoderna. Du väljer vanligtvis en prenumerationslängd (t.ex. månadsvis, årsvis) och anger dina betalningsuppgifter under kassaprocessen.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Vilka betalningsmetoder använder ni?</h3>
              <p>Vi accepterar en mängd olika betalningsmetoder, inklusive:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Kredit- och betalkort (Visa, MasterCard, American Express)</li>
                <li>PayPal, Google Pay, Apple Pay</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Observera att tillgängligheten av specifika betalningsmetoder kan variera beroende på din region.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Hur säger jag upp min prenumeration?</h3>
              <p>Du kan säga upp din prenumeration när som helst med någon av följande metoder:</p>
              
              <div className="bg-muted/50 p-4 rounded-lg mt-4 space-y-3">
                <div>
                  <p className="font-semibold">Metod 1: Snabbåtkomst</p>
                  <p className="text-sm">Klicka här för att gå direkt till dina profilinställningar och hantera din prenumeration.</p>
                </div>
                
                <div>
                  <p className="font-semibold">Metod 2: Självservice-navigering</p>
                  <ol className="list-decimal pl-6 space-y-1 text-sm mt-2">
                    <li>Öppna menyn Mitt konto (finns vanligtvis i det övre högra hörnet eller i appens navigeringsmeny)</li>
                    <li>Klicka på Profil eller Kontoinställningar</li>
                    <li>Under avsnittet som beskriver din nuvarande plan, klicka på "Avprenumerera" eller "Säg upp prenumeration"</li>
                    <li>Följ instruktionerna på skärmen för att bekräfta din uppsägning</li>
                  </ol>
                </div>
                
                <div>
                  <p className="font-semibold">Metod 3: Kontakta supporten</p>
                  <p className="text-sm">
                    Alternativt kan du mejla vårt supportteam på{" "}
                    <a href="mailto:support@dintyp.se" className="text-primary hover:underline">
                      support@dintyp.se
                    </a>{" "}
                    för att begära uppsägning av din prenumeration.
                  </p>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-muted-foreground">
                <strong>Effekt av uppsägning:</strong> Din tillgång till premiumfunktioner fortsätter till slutet av din nuvarande faktureringsperiod. Du kommer inte att få någon återbetalning för den oanvända delen av din prenumeration.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Hur raderar jag mitt konto?</h3>
              <p>Du kan permanent radera ditt Dintyp-konto via dina kontoinställningar. Följ dessa steg:</p>
              <ol className="list-decimal pl-6 space-y-2 mt-2">
                <li>Gå till din Profil eller Kontoinställningar</li>
                <li>Leta efter ett alternativ som "Radera konto", "Stäng konto" eller liknande</li>
                <li>Läs informationen noggrant, eftersom denna åtgärd är oåterkallelig och kommer att resultera i en permanent förlust av dina data</li>
                <li>Bekräfta att du vill fortsätta med raderingen av kontot</li>
              </ol>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">Sekretess och säkerhet</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Är det säkert att använda er plattform?</h3>
              <p>Ja, våra användares säkerhet är högsta prioritet. Vi implementerar olika åtgärder för att säkerställa en trygg och respektfull miljö, inklusive:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Innehållsmoderering:</strong> Vi använder både automatiserade och manuella modereringssystem för att upptäcka och ta bort olämpligt innehåll och beteende.</li>
                <li><strong>Rapporteringsverktyg:</strong> Vi förser användare med verktyg för att enkelt rapportera innehåll som bryter mot våra <a href="/riktlinjer" className="text-primary hover:underline">Riktlinjer för communityn</a>.</li>
                <li><strong>Datasäkerhet:</strong> Vi använder säkerhetsåtgärder för att skydda dina personuppgifter. Se vår <a href="/integritetspolicy" className="text-primary hover:underline">Sekretesspolicy</a> för mer information.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Är mina konversationer verkligen privata?</h3>
              <p>
                Vi förstår vikten av sekretess. Dina direkta konversationer med dina AI-karaktärer anses generellt vara privata för dig. Tänk dock på att:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Våra system kan behandla och lagra dessa konversationer i syfte att tillhandahålla och förbättra tjänsten, inklusive träning av AI-modeller.</li>
                <li>I vissa fall, för att uppfylla rättsliga skyldigheter eller hantera säkerhetsproblem, kan vi behöva få åtkomst till och granska konversationer.</li>
              </ul>
              <p className="mt-2">
                Vänligen se vår <a href="/integritetspolicy" className="text-primary hover:underline">Sekretesspolicy</a> för en omfattande förklaring av hur vi hanterar din kommunikation.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Kan andra användare komma åt mina chattar?</h3>
              <p>
                Generellt sett kan andra användare inte direkt komma åt dina privata konversationer med dina AI-karaktärer. Vårt system är utformat för att hålla dessa interaktioner privata för dig. Men om du väljer att dela dina konversationer eller innehåll offentligt via de funktioner vi erbjuder, kan den informationen bli tillgänglig för andra.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Hur hanterar ni mina personuppgifter?</h3>
              <p>
                Vi är fast beslutna att skydda dina personuppgifter i enlighet med tillämpliga dataskyddslagar. Vår <a href="/integritetspolicy" className="text-primary hover:underline">Sekretesspolicy</a> ger detaljerad information om:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Vilka typer av personuppgifter vi samlar in</li>
                <li>Hur vi använder dina personuppgifter</li>
                <li>Hur vi lagrar och skyddar dina personuppgifter</li>
                <li>Dina rättigheter angående dina personuppgifter</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Hur rapporterar jag olämpligt innehåll?</h3>
              <p>
                Vi uppmuntrar våra användare att hjälpa oss att upprätthålla en trygg och respektfull community. Om du stöter på innehåll som bryter mot våra <a href="/riktlinjer" className="text-primary hover:underline">Riktlinjer för communityn</a>, vänligen rapportera det omedelbart:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Rapportering i appen:</strong> Klicka på "Rapportera"-knappen nära innehållet</li>
                <li><strong>Kontakta supporten:</strong> Mejla oss på <a href="mailto:info@dintyp.se" className="text-primary hover:underline">info@dintyp.se</a></li>
              </ul>
              <p className="mt-2">
                Läs mer i vår <a href="/rapportera" className="text-primary hover:underline">Policy för rapportering och klagomål</a>.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">Fakturering och återbetalningar</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Erbjuder ni återbetalningar?</h3>
              <p>
                Generellt, på grund av våra tjänsters karaktär och den omedelbara tillgången till premiumfunktioner, erbjuder vi inga återbetalningar för prenumerationsavgifter eller köp, såvida det inte krävs enligt tillämpliga konsumentskyddslagar. Vi kan erbjuda en gratis provperiod eller en begränsad gratisversion så att du kan utvärdera våra tjänster innan du binder dig till en betald prenumeration.
              </p>
              <p className="mt-2">
                Vänligen granska vår <a href="/villkor" className="text-primary hover:underline">Återbetalningspolicy i våra Användarvillkor</a> för detaljerad information.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">Tekniska problem och support</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-3">Vad ska jag göra om jag stöter på ett tekniskt problem?</h3>
              <p>Om du upplever några tekniska svårigheter när du använder Dintyp, vänligen prova följande steg:</p>
              <ol className="list-decimal pl-6 space-y-2 mt-2">
                <li>Kontrollera din internetanslutning</li>
                <li>Se till att din app eller webbläsare är uppdaterad till den senaste versionen</li>
                <li>Prova att rensa din webbläsares cache och cookies eller appens cache</li>
                <li>Starta om appen eller din webbläsare</li>
              </ol>
              <p className="mt-4">
                Om problemet kvarstår, vänligen kontakta vårt supportteam på{" "}
                <a href="mailto:support@dintyp.se" className="text-primary hover:underline">
                  support@dintyp.se
                </a>{" "}
                med en detaljerad beskrivning av problemet, inklusive eventuella felmeddelanden du ser, stegen du tog när problemet uppstod och information om din enhet/webbläsare.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 bg-primary/10 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-semibold mb-4">Har du fler frågor?</h2>
          <p className="mb-6">
            Vi hoppas att denna FAQ-sida har varit till hjälp! Om du har ytterligare frågor eller behöver hjälp, tveka inte att kontakta vårt supportteam.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a 
              href="mailto:support@dintyp.se" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Kontakta support
            </a>
            <a 
              href="/kontakta" 
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Fler kontaktalternativ
            </a>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Tack för att du är en del av Dintyp-communityn!
          </p>
        </section>
      </div>
    </div>
  );
}
