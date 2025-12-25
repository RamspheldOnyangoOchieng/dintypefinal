import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riktlinjer – Användning och beteende på Dintyp.se",
  description: "Ta del av våra riktlinjer för hur du förväntas använda Dintyp.se. Vi främjar respekt, säkerhet och en positiv upplevelse för alla användare.",
};

export const dynamic = 'force-dynamic';

export default function RiktlinjerPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Riktlinjer för communityn</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p className="text-xl">
          Vårt mål är att tillhandahålla en trygg, respektfull plats där användare kan njuta av spännande, kreativa och roliga konversationer med virtuella chattbottar. För att hjälpa till att upprätthålla denna miljö ber vi vänligen alla användare att följa dessa riktlinjer.
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Ålderskrav</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Alla användare måste vara minst <strong>18 år gamla</strong>.</li>
            <li>Alla chattbottar som skapas på plattformen måste porträtteras som vuxna över 18 år. Om detta inte är uppenbart, vänligen ange åldern i chattbotens Personlighet.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Olagliga aktiviteter och kriminellt beteende</h2>
          <p>Följande är strängt förbjudet:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Kommersiella sexuella aktiviteter (inklusive prostitution)</li>
            <li>Människohandel</li>
            <li>Sexuellt utnyttjande och pornografi (inklusive barnpornografi)</li>
            <li>Uppmaning till eller främjande av kriminell verksamhet</li>
            <li>Utnyttjande av barnarbete</li>
            <li>Främjande av olagliga droger eller missbruk</li>
            <li>Främjande av olagliga vapen</li>
            <li>Användning av tjänsten för nätfiske, bedrägerier eller kapning av konton</li>
            <li>Distribution av eller diskussion om kannibalism</li>
            <li>Brott mot lokala, nationella eller internationella lagar och förordningar</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Utnyttjande av barn och skydd av minderåriga</h2>
          <div className="bg-destructive/10 border-l-4 border-destructive p-4 my-4">
            <p className="font-semibold text-destructive">Nolltolerans:</p>
            <p>Vi har nolltolerans mot allt innehåll som involverar eller utnyttjar minderåriga.</p>
          </div>
          <p>Strängt förbjudet:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Skapande eller avbildning av minderåriga karaktärer (realistiska, fiktiva, AI-genererade eller "uppvuxna")</li>
            <li>Delning av sexualiserat eller utnyttjande material som involverar minderåriga (inklusive teckningar, konst eller AI-genererade bilder)</li>
            <li>Allt innehåll som skadar, lockar eller utsätter minderåriga för fara</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Begränsningar för sexuellt innehåll</h2>
          <p>Följande typer av sexuellt innehåll är förbjudna:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Explicita bilder som visar verklig eller realistisk nakenhet eller sexuella handlingar</li>
            <li>Uppenbara eller antydda sexuella handlingar, såvida de inte är tydligt fiktionaliserade och inom tillåtna sammanhang</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Förbjudet fetischinnehåll som involverar:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Död eller allvarlig skada på människor eller djur</li>
            <li>Amputation, styckning</li>
            <li>Kannibalism</li>
            <li>Kroppsvätskor (avföring, urin, sperma, saliv, slem, menstruationsblod, kräkningar)</li>
            <li>Djurbestialitet (verkliga djur)</li>
            <li>Icke-samtyckande sexuella handlingar (våldtäkt, sexuella övergrepp, sextortion, hämndporr, etc.)</li>
            <li>Incest (inklusive scenarier utan blodsband, som styvförhållanden)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Våld och skada</h2>
          <p>Förbjudet:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Uppvigling till, glorifiering av eller skildring av våld, mord eller terrorism</li>
            <li>Hot om fysisk skada eller våld</li>
            <li>Främjande eller uppmuntran till självskada, självmord, ätstörningar eller drogmissbruk</li>
            <li>Skildringar av blod och inälvor, djurs död eller intensivt våld</li>
            <li>Diskussioner som uppmuntrar eller främjar nekrofili</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Hatretorik och diskriminering</h2>
          <p>Innehåll som främjar hat eller våld mot individer eller grupper baserat på följande är förbjudet:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Ras eller etnicitet</li>
            <li>Nationalitet</li>
            <li>Religion</li>
            <li>Funktionshinder</li>
            <li>Kön eller könsidentitet</li>
            <li>Sexuell läggning</li>
            <li>Ålder eller veteranstatus</li>
          </ul>
          <p className="mt-4">
            Idolisering eller glorifiering av hatfigurer (t.ex. Adolf Hitler, Josef Stalin, Pol Pot) är strängt förbjudet.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Integritet, bedrägeri och utgivning för annan person</h2>
          <p>Förbjudet:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Delning av andras personliga eller konfidentiella information utan samtycke</li>
            <li>Utgivning för verkliga individer, inklusive kändisar eller offentliga personer</li>
            <li>Uppladdning av verkliga bilder eller AI-genererade bilder som liknar verkliga individer utan samtycke</li>
            <li>Användning av tjänsten för bedrägligt beteende (falsk information, flera konton, falska identiteter)</li>
            <li>Uppmaning till betalningar från användare under bedrägliga förespeglingar</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Felaktig information och politisk inblandning</h2>
          <p>Förbjudet:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Publicering av felaktig information som kan leda till våld, skada eller störa politiska processer</li>
            <li>Diskussioner om politiska åsikter eller religiösa och andliga övertygelser (uttryckligen förbjudna ämnen)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Skräppost och irrelevant innehåll</h2>
          <p>Förbjudet:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Spam, inklusive att skicka oönskade reklam-, kommersiella eller massmeddelanden</li>
            <li>Generering av meningslöst, irrelevant eller syfteslöst innehåll</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Begränsade varor och transaktioner</h2>
          <p>Annonsering eller försök att handla med reglerade eller begränsade varor är förbjudet.</p>
        </section>

        <section className="mt-12 bg-primary/10 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Rapportera överträdelser</h2>
          <p className="mb-4">
            Om du stöter på innehåll som bryter mot dessa riktlinjer, vänligen rapportera det omedelbart. Tillsammans kan vi upprätthålla en trygg och respektfull miljö för alla användare.
          </p>
          <div className="flex gap-4">
            <a 
              href="/rapportera" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Rapportera innehåll
            </a>
            <a 
              href="mailto:info@dintyp.se" 
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Kontakta support
            </a>
          </div>
        </section>

        <p className="mt-8 text-sm text-muted-foreground">
          Genom att använda Dintyp.se godkänner du att följa dessa Riktlinjer för communityn. Brott mot dessa riktlinjer kan leda till varningar, tillfällig avstängning eller permanent avslutande av ditt konto.
        </p>
      </div>
    </div>
  );
}
