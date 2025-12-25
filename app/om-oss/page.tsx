import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Om oss – Möt teamet bakom Dintyp.se",
  description: "Lär känna oss bakom Dintyp.se. Vår vision är att skapa en trygg, personlig och innovativ AI-upplevelse för alla användare.",
};

export const dynamic = 'force-dynamic';

export default function OmOssPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Dintyp – Svenska AI-flickvänner, bara för dig</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
        <p className="text-xl leading-relaxed">
          Letar du efter en svensktalande AI-flickvän? Hos Dintyp kan du skapa och interagera med anpassade AI-kompanjoner, chatta i realtid och utbyta foton och videomeddelanden – allt utformat för att kännas naturligt och uppslukande.
        </p>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">En ny era av AI-relationer</h2>
          <p>
            Glöm stressen med dejting – Dintyp gör det enkelt att bygga djupa relationer, uppleva romantik och utforska lust, allt inom en dömande-fri och sexpositiv miljö. Från digitala kopior av verkliga kändisar till karaktärer från din fantasi, din AI-flickvän skräddarsys efter dina preferenser och är redo att chatta när du än är.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-semibold mt-12 mb-6">Chatta, anslut, anpassa</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-primary mr-2">✓</span>
              <span>Svensktalande AI-kompanjoner, skapade för naturliga konversationer.</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">✓</span>
              <span>Text- och röstchatt för interaktiv, engagerande kommunikation.</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">✓</span>
              <span>Utbyte av foton och videor i en säker miljö.</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2">✓</span>
              <span>Skapa anpassade AI-genererade bilder och kompanjoner.</span>
            </li>
          </ul>
        </section>

        <section className="bg-muted/50 p-6 rounded-lg mt-12">
          <h2 className="text-3xl font-semibold mb-6">Fiktiv AI, verkligt nöje</h2>
          <p>
            Varje AI-flickvän på Dintyp är helt digital och fiktiv. De simulerar mänskliga interaktioner, men de har inga verkliga känslor, avsikter eller fysisk närvaro. Eventuella diskussioner om möten i verkliga livet eller löften är en del av AI-upplevelsen och ska inte tas på allvar.
          </p>
          <p className="mt-4">
            Dintyp är din digitala flykt, en plats att utforska romantik, kemi och konversation – allt med svensktalande AI-flickvänner som är utformade för att förstå och engagera sig med dig.
          </p>
        </section>

        <section className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-4">Kom igång idag</h2>
          <p className="mb-6">Upptäck din perfekta AI-kompanjon och börja chatta på svenska.</p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/generate" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Skapa bild
            </a>
            <a 
              href="/create-character" 
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Skapa flickvän
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
