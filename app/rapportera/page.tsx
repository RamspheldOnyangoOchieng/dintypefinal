import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rapportering och klagomål – Policy för innehåll | Dintyp.se",
  description: "Läs hur du kan rapportera olämpligt innehåll eller lämna klagomål på Dintyp.se. Vi tar ansvar för trygghet och snabb hantering.",
};

export default function RapporteraPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Policy för rapportering och klagomål av innehåll</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p>
          På Dintyp.se strävar vi efter att främja en trygg, respektfull och regelrätt miljö för alla våra användare. Din uppmärksamhet när det gäller att rapportera innehåll som du anser vara olagligt, skadligt eller som bryter mot våra <a href="/villkor" className="text-primary hover:underline">Användarvillkor</a> och <a href="/riktlinjer" className="text-primary hover:underline">Riktlinjer för communityn</a> är avgörande för att vi ska kunna uppnå detta mål. Vi uppmuntrar dig att rapportera allt sådant innehåll som du stöter på.
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Vad ska man rapportera?</h2>
          <p>Vänligen rapportera innehåll som faller inom, men inte är begränsat till, följande kategorier:</p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Olagligt innehåll:</strong> Innehåll som bryter mot tillämpliga lokala, nationella eller internationella lagar och förordningar.</li>
            <li><strong>Brott mot Användarvillkoren:</strong> Innehåll som strider mot någon av reglerna och riktlinjerna som beskrivs i våra <a href="/villkor" className="text-primary hover:underline">Användarvillkor</a>.</li>
            <li><strong>Brott mot Riktlinjerna för communityn:</strong> Innehåll som strider mot de beteendestandarder och innehållsregler som beskrivs i våra <a href="/riktlinjer" className="text-primary hover:underline">Riktlinjer för communityn</a>, inklusive men inte begränsat till:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Hets mot folkgrupp, trakasserier och diskriminering</li>
                <li>Obscent, pornografiskt eller sexuellt explicit material (om det är förbjudet)</li>
                <li>Våldsamt eller hotfullt innehåll</li>
                <li>Skräppost eller obehörig reklam</li>
                <li>Intrång i immateriella rättigheter</li>
                <li>Impersonation (utgivning för att vara någon annan)</li>
                <li>Innehåll som utnyttjar, missbrukar eller utsätter barn för fara</li>
                <li>Felaktig information eller desinformation (om det uttryckligen är förbjudet)</li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Hur man skickar in ett klagomål eller en rapport</h2>
          <p>För att vi ska kunna utreda och lösa din rapport effektivt, vänligen ange så många detaljer som möjligt. Du kan vanligtvis skicka in en rapport via följande metoder:</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Rapportering i plattformen:</h3>
          <p>
            Leta efter en "Rapportera"-knapp, länk eller flaggikon nära det aktuella innehållet. Detta är det mest effektiva sättet att skicka in en rapport eftersom det ofta inkluderar kontextuell information. Följ instruktionerna på skärmen för att ge detaljer om problemet.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Kontakta supporten:</h3>
          <p>
            Om du inte hittar ett rapporteringsalternativ i plattformen eller har ett mer komplext problem att rapportera, vänligen kontakta vårt dedikerade supportteam på <a href="mailto:info@dintyp.se" className="text-primary hover:underline">info@dintyp.se</a>. När du kontaktar oss, vänligen inkludera följande information:
          </p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Ditt fullständiga namn och e-postadress:</strong> Detta gör att vi kan kontakta dig för klargöranden eller uppdateringar.</li>
            <li><strong>Tydlig beskrivning av problemet:</strong> Var specifik om det innehåll eller beteende du rapporterar och varför du anser att det bryter mot våra policyer eller är olagligt. Inkludera den exakta platsen för innehållet (t.ex. URL, användarnamn, post-ID).</li>
            <li><strong>Datum och tid för händelsen (om tillämpligt):</strong> Detta hjälper oss att hitta det specifika innehållet eller aktiviteten.</li>
            <li><strong>Stödjande dokumentation (om tillämpligt):</strong> Inkludera skärmdumpar, länkar eller andra bevis som stöder din rapport. Se till att skärmdumparna är tydliga och visar hela sammanhanget.</li>
            <li><strong>Kategori av överträdelse:</strong> Om möjligt, ange vilken specifik regel eller riktlinje du anser har överträtts.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Vad händer efter att du skickat in ett klagomål?</h2>
          <p>När ditt klagomål har skickats in kan du förvänta dig följande:</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Bekräftelse:</h3>
              <p>
                Vårt kundsupportteam kommer att bekräfta mottagandet av din rapport inom 24 timmar via e-post till den adress du angav. Denna bekräftelse indikerar att din rapport har mottagits och behandlas.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Granskning och utredning:</h3>
              <p>
                Vårt dedikerade modereringsteam kommer att granska det rapporterade innehållet och all tillhandahållen information noggrant. Vi strävar efter att utföra denna granskning opartiskt och i enlighet med våra policyer och tillämpliga lagar.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Åtgärder som vidtas:</h3>
              <p>Baserat på resultaten av vår granskning kan en eller flera av följande åtgärder vidtas:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Borttagning eller ändring av innehåll:</strong> Om innehållet befinns bryta mot våra policyer eller lagar, kommer det omedelbart att tas bort eller ändras.</li>
                <li><strong>Kontoåtgärder:</strong> Beroende på överträdelsens allvar kan vi utfärda varningar, tillfälligt stänga av kontoåtkomst eller permanent avsluta konton.</li>
                <li><strong>Ingen åtgärd:</strong> Om granskningen fastställer att det rapporterade innehållet inte bryter mot våra policyer, kan det förbli tillgängligt.</li>
                <li><strong>Eskalering till rättsliga myndigheter:</strong> I fall som involverar potentiellt olaglig verksamhet kan vi eskalera ärendet till lämpliga myndigheter.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Tidsram för lösning:</h3>
              <p>
                Vi strävar efter att granska och lösa alla klagomål inom sju (7) arbetsdagar från mottagningsdatumet. Dock kan ärendets komplexitet och antalet rapporter ibland kräva en längre utredningstid. Vi uppskattar ditt tålamod och din förståelse i sådana situationer.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Viktiga överväganden</h2>
          
          <div className="bg-muted/50 p-6 rounded-lg space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Falsk rapportering:</h3>
              <p>
                Vänligen notera att avsiktlig inlämning av falska eller vilseledande rapporter är ett brott mot våra villkor och kan leda till åtgärder mot ditt eget konto.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Objektivitet:</h3>
              <p>
                Vår granskningsprocess är utformad för att vara objektiv och baserad på våra fastställda policyer och lagkrav.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Kontinuerlig förbättring:</h3>
              <p>
                Vi utvärderar och förbättrar kontinuerligt våra rapporterings- och modereringsprocesser för att säkerställa effektivitet och rättvisa.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <p className="text-lg">
            Ditt engagemang i att rapportera olämpligt innehåll är ovärderligt för att hjälpa oss att upprätthålla en trygg och respektfull plattform för alla. Tack för ditt samarbete och för att du bidrar till en positiv användarupplevelse på Dintyp.se.
          </p>
        </section>

        <section className="mt-12 bg-primary/10 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Behöver du rapportera något?</h2>
          <p className="mb-4">Kontakta vårt supportteam direkt:</p>
          <a 
            href="mailto:info@dintyp.se" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Skicka rapport till info@dintyp.se
          </a>
        </section>
      </div>
    </div>
  );
}
