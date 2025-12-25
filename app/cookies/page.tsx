import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies – Hur vi använder kakor | Dintyp.se",
  description: "Dintyp.se använder cookies för att förbättra din upplevelse. Läs mer om vilka typer av kakor vi använder och hur du kan hantera dina inställningar.",
};

export const dynamic = 'force-dynamic';

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Cookiepolicy</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">
          Giltighetsdatum: [Ange datum]<br />
          Senast uppdaterad: [Ange datum]
        </p>
        
        <p>
          Denna Cookiepolicy ("Policy") förklarar hur Dintyp.se ("vi", "oss" eller "vår") använder cookies och liknande tekniker på vår webbplats https://www.dintyp.se ("Webbplatsen").
        </p>
        
        <p>
          Genom att använda vår Webbplats godkänner du användningen av cookies i enlighet med denna Policy. Du kan när som helst hantera eller återkalla ditt samtycke genom att justera dina cookiepreferenser.
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Vilka vi är</h2>
          <p>
            Denna webbplats drivs av Dintyp.se, ett aktiebolag registrerat i Sverige.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Vad är cookies?</h2>
          <p>
            Cookies är små textfiler som lagras på din enhet (dator, surfplatta eller mobil) när du besöker en webbplats. De hjälper webbplatsen att komma ihåg dina handlingar och preferenser över tid för att förbättra din användarupplevelse. Cookies möjliggör också analys och riktad reklam.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Cookies kan vara:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Sessionscookies:</strong> Raderas när du stänger din webbläsare.</li>
            <li><strong>Beständiga cookies:</strong> Finns kvar på din enhet under en angiven period eller tills de raderas manuellt.</li>
            <li><strong>Förstapartscookies:</strong> Sätts av oss.</li>
            <li><strong>Tredjepartscookies:</strong> Sätts av tredjepartstjänster vi använder (t.ex. Google Analytics, annonsplattformar).</li>
          </ul>
          
          <p className="mt-4">
            Cookies samlar inte in personlig information direkt, men i vissa fall kan de kopplas till uppgifter som identifierar dig, särskilt när de kombineras med annan information (t.ex. inloggningsstatus).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Typer av cookies vi använder</h2>

          <div className="space-y-6">
            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">A. Absolut nödvändiga cookies</h3>
              <p>
                Dessa cookies är avgörande för att Webbplatsen ska fungera korrekt. De:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Möjliggör grundläggande funktionalitet (t.ex. sidnavigering, säker inloggning)</li>
                <li>Kan inte inaktiveras via cookiebannern</li>
                <li>Lagrar ingen personligt identifierbar information</li>
              </ul>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">B. Funktionella cookies</h3>
              <p>
                Dessa cookies förbättrar funktionalitet och anpassning genom att komma ihåg dina preferenser och inställningar. De kan:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Lagra inloggningsuppgifter eller språkinställningar</li>
                <li>Komma ihåg dina val av cookiesamtycke</li>
                <li>Tillhandahålla förbättrade funktioner anpassade till din användning</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                Om de inaktiveras kanske vissa delar av webbplatsen inte fungerar korrekt.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">C. Analytiska / prestandacookies</h3>
              <p>
                Används för att samla in anonym data om hur användare interagerar med Webbplatsen, vilket hjälper oss att förbättra innehåll och användarupplevelse. Dessa inkluderar:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Google Analytics-cookies</li>
                <li>Spårning av sidbesök</li>
                <li>Insikter om enhets- och webbläsaranvändning</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                Dessa cookies samlar inte in personuppgifter och används endast för att förstå användningsmönster.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">D. Riktade / reklamcookies</h3>
              <p>
                Dessa cookies spårar dina surfvanor för att:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Visa relevanta annonser</li>
                <li>Begränsa antalet gånger du ser en annons</li>
                <li>Mäta resultatet av annonskampanjer</li>
                <li>Förhindra bedräglig aktivitet</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">
                De aktiveras endast med ditt uttryckliga samtycke.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Hur du hanterar dina cookiepreferenser</h2>
          <p>
            När du besöker vår Webbplats första gången ser du en cookiebanner som låter dig acceptera eller anpassa cookieinställningarna. Dina preferenser lagras i ett system för hantering av samtycken.
          </p>
          
          <div className="bg-primary/10 p-6 rounded-lg mt-4">
            <h3 className="text-lg font-semibold mb-3">Du kan:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ändra dina inställningar när som helst genom att återbesöka länken för cookiepreferenser på webbplatsen.</li>
              <li>Radera eller blockera cookies via dina webbläsarinställningar. Notera dock att vissa funktioner på webbplatsen kanske inte fungerar som avsett.</li>
            </ul>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground">
            <strong>Obs:</strong> Om du rensar cookies eller använder en annan enhet eller webbläsare måste du ställa in dina preferenser igen.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Webbläsarspecifik cookie-kontroll:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Chrome</a></li>
            <li><a href="https://support.mozilla.org/sv/kb/webbplatscookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Firefox</a></li>
            <li><a href="https://support.apple.com/sv-se/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
            <li><a href="https://support.microsoft.com/sv-se/microsoft-edge/ta-bort-cookies-i-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Edge</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Skydd av dina uppgifter</h2>
          <p>
            Vi är fast beslutna att skydda din integritet. Alla uppgifter som samlas in via cookies hanteras i enlighet med vår <a href="/integritetspolicy" className="text-primary hover:underline">Sekretesspolicy</a> och tillämpliga dataskyddslagar, inklusive den allmänna dataskyddsförordningen (GDPR).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Policyuppdateringar</h2>
          <p>
            Vi kan uppdatera denna Policy från tid till annan för att återspegla förändringar i teknik, juridiska krav eller vår verksamhet. Alla uppdateringar kommer att publiceras på denna sida med det nya giltighetsdatumet.
          </p>
          <p className="mt-4">
            Vi uppmuntrar dig att granska denna sida regelbundet för att hålla dig informerad.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Kontakta oss</h2>
          <p>
            Om du har frågor om denna Cookiepolicy eller vill utöva dina dataskyddsrättigheter, kan du kontakta oss på:
          </p>
          <p className="mt-4">
            📧 E-post: <a href="mailto:info@dintyp.se" className="text-primary hover:underline">info@dintyp.se</a>
          </p>
        </section>
      </div>
    </div>
  );
}
