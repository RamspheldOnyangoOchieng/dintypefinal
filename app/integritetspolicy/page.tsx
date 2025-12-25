import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integritetspolicy | Dintyp.se",
  description: "Din integritet är viktig för oss. Läs hur Dintyp.se samlar in, använder och skyddar dina personuppgifter enligt GDPR.",
};

export const dynamic = 'force-dynamic';

export default function IntegritetspolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Sekretesspolicy</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p className="text-sm text-muted-foreground">
          Giltighetsdatum: [Ange datum]<br />
          Senast uppdaterad: [Ange datum]
        </p>
        
        <p>
          Välkommen till Dintyp.se. Vi respekterar din integritet och är fast beslutna att skydda dina personuppgifter. Denna Sekretesspolicy förklarar vilka personuppgifter vi samlar in, hur vi använder dem, vem vi delar dem med och dina rättigheter enligt EU:s allmänna dataskyddsförordning (förordning (EU) 2016/679, "GDPR").
        </p>
        
        <p>
          Vänligen läs denna policy noggrant. Om du har frågor är du välkommen att kontakta oss via uppgifterna i avsnittet "Kontakta oss".
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Vilka vi är (personuppgiftsansvarig)</h2>
          <p>
            Denna webbplats, https://www.dintyp.se, är personuppgiftsansvarig för behandlingen av dina personuppgifter.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Vad är personuppgifter?</h2>
          <p>
            "Personuppgifter" avser all information som relaterar till en identifierad eller identifierbar individ. Detta inkluderar namn, e-postadresser, IP-adresser och mer.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Identifierbara uppgifter:</strong> Inkluderar namn, e-postadresser eller IP-adresser.</li>
            <li><strong>Pseudonymiserade uppgifter:</strong> Betraktas fortfarande som personuppgifter om de kan återidentifieras.</li>
            <li><strong>Anonyma uppgifter:</strong> Betraktas inte som personuppgifter enligt GDPR.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Vilka personuppgifter vi samlar in</h2>
          <p>Vi kan samla in följande typer av uppgifter beroende på din interaktion med vår webbplats:</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">a. Besökare (utan inloggning)</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Enhetstyp, webbläsare och operativsystem</li>
            <li>IP-adress och tidszon</li>
            <li>Webbplatsanvändningsdata (t.ex. besökta sidor)</li>
            <li>Cookies och spårningstekniker (se vår <a href="/cookies" className="text-primary hover:underline">Cookiepolicy</a>)</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">b. Registrerade användare</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>E-postadress och användarnamn</li>
            <li>Inloggningsuppgifter för Google eller Patreon (e-post, profilbild)</li>
            <li>Profildetaljer (avatar, inställningar)</li>
            <li>Genererat innehåll och chatthistorik</li>
            <li>Kommunikationshistorik med vårt supportteam</li>
            <li>Användningsdata (t.ex. mest använda funktioner)</li>
            <li>Betalningsrelaterad information (hanteras av tredjepartsleverantörer – vi lagrar inte kortdata)</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">c. Särskilda kategorier av uppgifter (känsliga)</h3>
          <p>
            Om du frivilligt lämnar information om ditt sexliv eller din sexuella läggning när du använder våra tjänster, kommer vi endast att behandla den med ditt uttryckliga samtycke i enlighet med artikel 9(2)(a) i GDPR. Vi delar inte denna data med tredje parter, och du kontrollerar huruvida den lämnas ut.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Hur vi samlar in dina uppgifter</h2>
          <p>Vi samlar in dina personuppgifter genom:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Direkta interaktioner (t.ex. registrering, kontakt med support)</li>
            <li>Automatiserade tekniker (t.ex. cookies, serverloggar)</li>
            <li>Inloggningsintegrationer från tredje part (t.ex. Google, Patreon)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Varför vi behandlar dina uppgifter (laglig grund)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border px-4 py-2 text-left">Syfte</th>
                  <th className="border border-border px-4 py-2 text-left">Laglig grund</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-2">Registrering av konto och åtkomst</td>
                  <td className="border border-border px-4 py-2">Avtalsmässig nödvändighet</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">Tillhandahålla och förbättra våra tjänster</td>
                  <td className="border border-border px-4 py-2">Berättigat intresse</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">Svara på förfrågningar</td>
                  <td className="border border-border px-4 py-2">Berättigat intresse eller samtycke</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">Skicka uppdateringar och servicekommunikationer</td>
                  <td className="border border-border px-4 py-2">Berättigat intresse</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">Analysera användning för att förbättra tjänster</td>
                  <td className="border border-border px-4 py-2">Berättigat intresse</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">Behandla särskilda kategorier av uppgifter</td>
                  <td className="border border-border px-4 py-2">Uttryckligt samtycke</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">Efterlevnad av lagar</td>
                  <td className="border border-border px-4 py-2">Rättslig förpliktelse</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Principer för databehandling</h2>
          <p>Vi följer viktiga GDPR-principer:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Laglighet, rättvisa och öppenhet</li>
            <li>Ändamålsbegränsning</li>
            <li>Uppgiftsminimering</li>
            <li>Korrekthet</li>
            <li>Lagringsminimering</li>
            <li>Integritet och konfidentialitet</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Delning av data</h2>
          <p>Vi kan dela dina uppgifter med betrodda tredjepartstjänstleverantörer för:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Webbhotell och infrastruktur</li>
            <li>Analys- och supportverktyg</li>
            <li>Juridiska, redovisnings- eller konsulttjänster</li>
            <li>Betalningshanterare (för transaktioner)</li>
          </ul>
          <p className="mt-4">
            Dessa tredje parter agerar på våra instruktioner och är bundna av databehandlingsavtal för att säkerställa att dina uppgifter förblir säkra.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Internationella dataöverföringar</h2>
          <p>
            Dina uppgifter behandlas i första hand inom Europeiska ekonomiska samarbetsområdet (EES). Om vi överför dina uppgifter utanför EES kommer vi att säkerställa att lämpliga skyddsåtgärder finns på plats, såsom EU:s standardavtalsklausuler.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Datasäkerhet</h2>
          <p>
            Vi implementerar tekniska och organisatoriska åtgärder som är standard i branschen för att skydda data från obehörig åtkomst, ändring eller förlust. Inget system är dock 100 % säkert. I händelse av ett dataintrång kommer vi att meddela dig och tillsynsmyndigheter i enlighet med lag.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Barns integritet</h2>
          <p>
            Våra tjänster är inte avsedda för personer under 18 år. Vi samlar inte medvetet in data från barn. Om vi blir medvetna om sådana uppgifter kommer vi att radera dem omedelbart.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Datalagring</h2>
          <p>
            Vi behåller dina personuppgifter endast så länge det är nödvändigt för att tillhandahålla våra tjänster, uppfylla rättsliga skyldigheter, lösa tvister och genomdriva avtal. När uppgifterna inte längre behövs, raderar eller anonymiserar vi dem på ett säkert sätt.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Dina rättigheter</h2>
          <p>Om du befinner dig inom EES, Storbritannien eller Schweiz har du rätt att:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Få tillgång till:</strong> Begära en kopia av dina personuppgifter</li>
            <li><strong>Rättelse:</strong> Begära rättelse av felaktiga uppgifter</li>
            <li><strong>Radering:</strong> Begära radering ("rätten att bli bortglömd")</li>
            <li><strong>Begränsa behandlingen:</strong> Be oss att begränsa hur vi använder dina uppgifter</li>
            <li><strong>Invända mot:</strong> Invända mot behandling baserad på berättigat intresse</li>
            <li><strong>Dataportabilitet:</strong> Få dina uppgifter i ett maskinläsbart format</li>
            <li><strong>Återkalla samtycke:</strong> När som helst utan att det påverkar tidigare behandling</li>
          </ul>
          <p className="mt-4">
            För att utöva någon av dina rättigheter, kontakta oss på <a href="mailto:info@dintyp.se" className="text-primary hover:underline">info@dintyp.se</a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Länkar till andra webbplatser</h2>
          <p>
            Vår webbplats kan innehålla länkar till tredjepartswebbplatser. Vi är inte ansvariga för deras integritetsrutiner. Vänligen granska deras sekretesspolicyer innan du lämnar dina personuppgifter.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">14. Ändringar av denna policy</h2>
          <p>
            Vi kan uppdatera denna Sekretesspolicy från tid till annan. Eventuella ändringar kommer att publiceras här, och om de är betydande kommer vi att meddela dig via e-post eller ett meddelande på webbplatsen.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">15. Kontakta oss</h2>
          <p>
            För frågor om denna policy eller dina personuppgifter, vänligen kontakta:<br />
            E-post: <a href="mailto:info@dintyp.se" className="text-primary hover:underline">info@dintyp.se</a>
          </p>
        </section>
      </div>
    </div>
  );
}
