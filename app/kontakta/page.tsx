import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakta oss | Dintyp.se",
  description: "Har du frågor eller behöver hjälp? Tveka inte att kontakta oss! Vi finns här för att ge dig support, svara på dina frågor och hjälpa dig att få ut det bästa av din upplevelse.",
};

export const dynamic = 'force-dynamic';

export default function KontaktaPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Dintyp Support: Vi är här för att hjälpa!</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p className="text-xl">
          På Dintyp strävar vi efter att ge dig en smidig, trevlig och problemfri upplevelse. Vårt dedikerade kundsupportteam finns här för att hjälpa dig med alla frågor, funderingar eller tekniska problem du kan stöta på. Vi strävar efter att ge professionell, konfidentiell och opartisk hjälp för att garantera din tillfredsställelse.
        </p>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">Hur kan vi hjälpa dig idag?</h2>
          <p>Vårt kunniga supportteam kan hjälpa dig med en mängd olika ämnen, inklusive:</p>

          <div className="space-y-6 mt-6">
            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Hjälp med konto och profil:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Felsökning av inloggningsproblem (t.ex. återställning av lösenord, kontoåterställning)</li>
                <li>Vägledning om hur du hanterar dina profilinställningar och anpassar ditt konto</li>
                <li>Hjälp med verifieringsprocesser för konton</li>
                <li>Hjälp med att uppdatera din kontoinformation</li>
              </ul>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Teknisk support:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Lösa tekniska problem, buggar eller prestandaproblem på vår webbplats, i vår(a) app(ar) eller i våra tjänster</li>
                <li>Ge vägledning om webbläsar- och appkompatibilitet</li>
                <li>Hjälpa till med felsökning av felmeddelanden</li>
                <li>Erbjuda lösningar för anslutningsproblem</li>
              </ul>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Frågor om fakturering och betalning:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Klargöra transaktionsdetaljer och faktureringscykler</li>
                <li>Ge information om våra prenumerationsplaner och priser</li>
                <li>Besvara frågor relaterade till betalningsmetoder och behandling</li>
                <li>Hantera förfrågningar angående potentiella återbetalningar</li>
                <li>Hjälpa till med att hantera eller säga upp dina prenumerationer</li>
              </ul>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Innehåll och riktlinjer för communityn:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ge klargöranden om våra <a href="/villkor" className="text-primary hover:underline">Användarvillkor</a> och <a href="/riktlinjer" className="text-primary hover:underline">Riktlinjer för communityn</a></li>
                <li>Hantera rapporter och klagomål om användargenererat innehåll eller beteende (se vår <a href="/rapportera" className="text-primary hover:underline">Policy för klagomål och rapporter</a>)</li>
                <li>Besvara frågor om processer för innehållsmoderering</li>
                <li>Vägleda dig om hur du rapporterar överträdelser</li>
              </ul>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Funktionsförklaringar och användning:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ge information om hur du använder specifika funktioner i Dintyp (t.ex. skapande av AI-karaktärer, bildgenerering, chattfunktioner)</li>
                <li>Erbjuda tips och tricks för att förbättra din upplevelse</li>
                <li>Besvara frågor om funktionsbegränsningar eller uppdateringar</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">Hur du kontaktar oss</h2>
          <p>Vi erbjuder flera bekväma sätt att nå vårt supportteam:</p>

          <div className="space-y-6 mt-6">
            <div className="border border-border p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">📧 E-post</h3>
              <p>
                För detaljerade förfrågningar eller när du behöver skicka med bilagor, vänligen mejla oss på{" "}
                <a href="mailto:support@dintyp.se" className="text-primary hover:underline font-semibold">
                  support@dintyp.se
                </a>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Vi strävar efter att svara på alla mejlförfrågningar inom 24 timmar.
              </p>
            </div>

            <div className="border border-border p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">💬 Livechatt</h3>
              <p>
                För snabba frågor och hjälp i realtid är vår Livechatt-funktion ofta tillgänglig på vår webbplats och i vår(a) app(ar). Leta efter chattikonen i det nedre högra hörnet av skärmen.
              </p>
            </div>

            <div className="border border-border p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">❓ Hjälpcenter/FAQ</h3>
              <p>
                Innan du kontaktar oss direkt, uppmuntrar vi dig att bläddra igenom vårt omfattande <a href="/faq" className="text-primary hover:underline">Hjälpcenter eller avsnittet Vanliga frågor (FAQ)</a>. Du kan snabbt och enkelt hitta svaret på din fråga här. Denna resurs täcker vanliga ämnen och ger guider för felsökning.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">Vad du kan förvänta dig när du kontaktar support</h2>
          
          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">✓</span>
              <div>
                <h3 className="font-semibold mb-1">Snabb bekräftelse</h3>
                <p className="text-sm text-muted-foreground">Vi strävar efter att bekräfta alla förfrågningar inom 24 timmar efter mottagandet.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">✓</span>
              <div>
                <h3 className="font-semibold mb-1">Effektiv och verkningsfull hjälp</h3>
                <p className="text-sm text-muted-foreground">Vårt team är dedikerat till att ge dig korrekta och hjälpsamma lösningar så snabbt som möjligt.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">✓</span>
              <div>
                <h3 className="font-semibold mb-1">Professionell och respektfull kommunikation</h3>
                <p className="text-sm text-muted-foreground">Du kan förvänta dig att bli behandlad med artighet och respekt av våra supportagenter.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">✓</span>
              <div>
                <h3 className="font-semibold mb-1">Konfidentialitet</h3>
                <p className="text-sm text-muted-foreground">Vi hanterar dina personuppgifter och supportförfrågningar med största konfidentialitet, i enlighet med vår <a href="/integritetspolicy" className="text-primary hover:underline">Sekretesspolicy</a>.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="text-2xl">✓</span>
              <div>
                <h3 className="font-semibold mb-1">Opartiskhet</h3>
                <p className="text-sm text-muted-foreground">Vi strävar efter att hantera alla frågor rättvist och opartiskt, i enlighet med våra policyer och riktlinjer.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 bg-primary/10 p-8 rounded-lg">
          <h2 className="text-3xl font-semibold mb-6">Vi värdesätter din feedback</h2>
          <p>
            Din feedback är avgörande för att hjälpa oss att förbättra våra tjänster och vår support. Efter att ha interagerat med vårt supportteam kan du få en enkät eller bli inbjuden att dela med dig av din upplevelse. Vi uppmuntrar dig att ge din ärliga feedback så att vi kan fortsätta att förbättra våra supporttjänster.
          </p>
        </section>

        <section className="mt-12 text-center bg-gradient-to-br from-primary/20 to-primary/10 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Redo att komma igång?</h2>
          <p className="mb-6 text-muted-foreground">
            Tack för att du är en del av Dintyp-communityn. Vi är här för att hjälpa dig att få ut det mesta av din upplevelse!
          </p>
          <a 
            href="mailto:support@dintyp.se" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-4 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Kontakta support
          </a>
        </section>
      </div>
    </div>
  );
}
