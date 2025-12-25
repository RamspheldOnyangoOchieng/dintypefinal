import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regler och användarvillkor | Dintyp.se",
  description: "Läs våra regler och villkor för att förstå hur Dintyp.se fungerar, vad som gäller för användning och hur vi skyddar din integritet.",
};

export const dynamic = 'force-dynamic';

export default function VillkorPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Villkor</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">Senast uppdaterad: [Datum för senaste uppdatering - Lägg till om tillgängligt]</p>
        
        <p>
          Vänligen läs dessa Användarvillkor noggrant innan du använder vår webbplats, våra applikationer och tjänster (gemensamt kallade "Tjänsten"). Genom att få tillgång till eller använda vår Tjänst godkänner du att vara bunden av dessa villkor samt alla tillämpliga lagar och förordningar.
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Godkännande av villkor och behörighet</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Godkännande av villkor:</h3>
          <p>
            Genom att använda vår Tjänst bekräftar du att du har läst, förstått och godkänt dessa Användarvillkor, vår <a href="/integritetspolicy" className="text-primary hover:underline">Integritetspolicy</a> och våra <a href="/riktlinjer" className="text-primary hover:underline">Riktlinjer för communityn</a>, som är införlivade här genom hänvisning. Om du inte godkänner någon del av dessa dokument får du inte använda vår Tjänst och bör omedelbart radera alla nedladdade applikationer eller material.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Ålderskrav:</h3>
          <p>Du måste vara minst 18 år gammal och juridiskt kapabel att ingå bindande avtal för att använda vår Tjänst.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Konto i gott skick:</h3>
          <p>Du intygar och garanterar att du inte tidigare har blivit avstängd eller bannlyst från att använda vår Tjänst.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Användning i god tro:</h3>
          <p>Du godkänner att använda vår Tjänst i god tro och i enlighet med dessa Villkor.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Kontoregistrering och säkerhet</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Skapa konto:</h3>
          <p>
            För att få tillgång till vissa funktioner i Tjänsten kan du behöva skapa ett konto. Du godkänner att tillhandahålla korrekt, aktuell och fullständig information under registreringsprocessen och att hålla din kontoinformation uppdaterad. Dina personuppgifter kommer att hanteras i enlighet med vår <a href="/integritetspolicy" className="text-primary hover:underline">Integritetspolicy</a>.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Endast ett konto:</h3>
          <p>Du får endast skapa och använda ett konto.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Åldersverifiering:</h3>
          <p>
            Genom att registrera dig bekräftar du att du är minst 18 år gammal. Det är inte tillåtet att använda Tjänsten där det är juridiskt förbjudet. Att tillhandahålla falsk eller föråldrad information kan leda till omedelbar avstängning eller uppsägning av ditt konto.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Kontosäkerhet:</h3>
          <p>Du är ansvarig för att upprätthålla sekretessen för dina inloggningsuppgifter och för all aktivitet som sker under ditt konto. Du godkänner att:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Hålla dina inloggningsuppgifter konfidentiella.</li>
            <li>Ta fullt ansvar för all aktivitet som sker under ditt konto.</li>
            <li>Logga ut i slutet av varje session.</li>
            <li>Meddela oss omedelbart om du misstänker obehörig åtkomst till eller användning av ditt konto, eller något annat säkerhetsbrott.</li>
          </ul>
          <p>Vi är inte ansvariga för någon förlust eller skada som orsakas av din underlåtenhet att skydda din kontoinformation.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Användning av Tjänsten och begränsningar</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Användarens ansvar:</h3>
          <p>Du är ensam ansvarig för din användning av Tjänsten och allt innehåll som du skapar, laddar upp, publicerar, delar eller överför genom den.</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Förbjudna tekniska aktiviteter:</h3>
          <p>Du godkänner att inte:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Ändra, anpassa, översätta, omformatera eller modifiera Tjänsten eller någon del av dess kod eller design.</li>
            <li>Utföra omvänd ingenjörskonst, dekompilera, demontera eller försöka extrahera Tjänstens källkod.</li>
            <li>Störa eller inaktivera några säkerhetsfunktioner eller användningsbegränsningar inom Tjänsten.</li>
            <li>Få obehörig åtkomst till något system, nätverk, konto eller data som är relaterat till oss eller tredje parter.</li>
            <li>Ladda upp eller införa virus, skadlig programvara, korrupta filer eller någon annan skadlig kod.</li>
            <li>Använda Tjänsten på ett sätt som stör dess prestanda eller stör andra användare.</li>
            <li>Hyra ut, leasa, sälja, licensiera, överlåta, distribuera eller på annat sätt kommersiellt utnyttja Tjänsten utan vårt uttryckliga skriftliga samtycke.</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Förbjudet innehåll:</h3>
          <p>Du får inte ladda upp, publicera, dela eller överföra något innehåll som:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Är olagligt, hotfullt, kränkande, ärekränkande, trakasserande, obscent, pornografiskt, våldsamt eller hatfullt.</li>
            <li>Uppmuntrar eller ger instruktioner för olaglig verksamhet.</li>
            <li>Gör intrång i immateriella rättigheter som tillhör andra.</li>
            <li>Innehåller oönskade kampanjer, spam eller reklam.</li>
            <li>Inkluderar personlig eller privat information om andra utan deras samtycke.</li>
            <li>Utnyttjar, utsätter för fara eller riktar sig mot minderåriga på något sätt.</li>
            <li>Innehåller skadlig programvara eller destruktiv kod.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Innehållsmoderering</h2>
          <p>
            Vi använder automatiserade system, inklusive AI och stora språkmodeller (LLM), för att övervaka innehåll i realtid för efterlevnad av våra säkerhetsriktlinjer. Detta inkluderar granskning av prompter, meddelanden och genererade bilder.
          </p>
          <p>
            Ett dedikerat modereringsteam granskar visst innehåll, såsom offentliga inlägg och AI-karaktärer i community-sektionen. Vi tillhandahåller ett rapporteringssystem för användare att flagga olämpligt innehåll. Du kan rapportera genom att kontakta oss på <a href="mailto:info@dintyp.se" className="text-primary hover:underline">info@dintyp.se</a>.
          </p>
          <p>
            Läs mer i vår <a href="/rapportera" className="text-primary hover:underline">Policy för rapportering och klagomål</a>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Immateriella rättigheter</h2>
          <p>
            Tjänsten och allt dess innehåll, funktioner och funktionalitet är exklusiv egendom som tillhör Företaget, dess licensgivare eller andra innehållsleverantörer och skyddas av lagar om immateriella rättigheter.
          </p>
          <p>
            Du får inte kopiera, modifiera, reproducera, ladda ner, distribuera eller använda något material från Tjänsten utan vårt uttryckliga skriftliga förhandsgodkännande.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Innehåll och länkar från tredje part</h2>
          <p>
            Vi är inte ansvariga för riktigheten, tillförlitligheten eller lagligheten av användargenererat innehåll eller innehåll från tredje parter. Tjänsten kan innehålla länkar till tredje parts webbplatser som inte ägs eller kontrolleras av oss. Åtkomst till och användning av dem sker på egen risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Betalningar, prenumerationer och uppsägningar</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Betalningar:</h3>
          <p>
            Vi använder pålitliga tredjepartsleverantörer för att behandla betalningar. Genom att prenumerera godkänner du att betala tillämpliga avgifter. Se till att din faktureringsinformation är korrekt och uppdaterad.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Medlemskap och uppsägning:</h3>
          <p>
            Medlemskap faktureras vanligtvis på en återkommande basis. Du kan när som helst säga upp ditt medlemskap. Vid uppsägning fortsätter din åtkomst till slutet av den aktuella faktureringsperioden.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Återbetalningspolicy</h2>
          <p>
            På grund av de operativa kostnaderna för våra AI-tjänster erbjuder vi generellt sett inte återbetalningar för prenumerationsavgifter eller köp, såvida det inte krävs enligt tillämplig konsumentskyddslagstiftning.
          </p>
          <p>
            Vi kan erbjuda en gratis provperiod eller ett begränsat antal gratis interaktioner för nya användare att utvärdera Tjänsten innan de binder sig till en betald prenumeration.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Policy för återkrav (chargebacks)</h2>
          <p>
            Om en tvist om återkrav uppstår kommer vi att genomföra en grundlig utredning. Vi har nolltolerans mot bedräglig verksamhet, inklusive missbruk av återkrav.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Kontoavslut, avstängning och uppsägning</h2>
          <p>
            Du kan permanent radera ditt konto när som helst via Tjänsten. Vi förbehåller oss rätten att stänga av eller säga upp ditt konto efter eget gottfinnande för brott mot dessa villkor.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Datatillgänglighet och lagring</h2>
          <p>
            Vi prioriterar sekretessen och säkerheten för din personliga information och chatthistorik. Vi använder kryptering och anonymiseringstekniker och uppdaterar regelbundet våra säkerhetsprotokoll.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Friskrivning och ansvarsbegränsning</h2>
          <p>
            Din användning av Tjänsten sker på egen risk. Tjänsten tillhandahålls "I BEFINTLIGT SKICK" och "I MÅN AV TILLGÄNGLIGHET" utan några garantier.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Skadeersättning</h2>
          <p>
            Du godkänner att hålla Företaget skadeslöst från alla anspråk som uppstår till följd av ditt brott mot dessa Villkor.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">14. Ändringar av villkor och tjänster</h2>
          <p>
            Vi kan när som helst uppdatera dessa Användarvillkor. Din fortsatta användning av Tjänsten efter publiceringen av reviderade Villkor utgör ditt godkännande av ändringarna.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">15. Policy för minderåriga</h2>
          <p>
            Vår Tjänst är avsedd för användare som är 18 år eller äldre. Vi samlar inte medvetet in personligt identifierbar information från individer under 13 år.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">16. Kontakta oss</h2>
          <p>
            Om du har några frågor angående dessa Användarvillkor, vänligen kontakta oss på <a href="/kontakta" className="text-primary hover:underline">vår kontaktsida</a> eller via e-post: <a href="mailto:info@dintyp.se" className="text-primary hover:underline">info@dintyp.se</a>
          </p>
        </section>

        <p className="mt-8 text-sm text-muted-foreground">
          Genom att använda vår Tjänst bekräftar du att du har läst, förstått och godkänner att vara bunden av dessa Användarvillkor.
        </p>
      </div>
    </div>
  );
}
