import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, ArrowLeft, Tag, Share2 } from "lucide-react";
import { notFound } from "next/navigation";

// Blog posts data - matching main blog page
const blogPosts = [
  {
    id: "1",
    slug: "fran-richard-gere-till-zendaya",
    title: "Från Richard Gere till Zendaya: Amerikas kändiskrossar genom generationerna",
    excerpt: "Dröm A från 1929 till 2024. Vilken är din kändis, låter den märkas din publik genom kända crushers varvlar om du bara förra – det är bara lite för allt.",
    content: `
      <h2>En resa genom Hollywoods hjärtekrossare</h2>
      <p>Från den gyllene eran av Hollywood till dagens moderna kändisar, har amerikanska publikens kändiskrossar utvecklats och förändrats genom generationerna.</p>
      
      <h3>1920-1950: Den klassiska eran</h3>
      <p>Stjärnor som Clark Gable, Humphrey Bogart och senare James Dean definierade vad det betydde att vara en Hollywood-legend.</p>
      
      <h3>1960-1980: Nya ikoner</h3>
      <p>Richard Gere, Harrison Ford och andra blev symbolen för den moderna manliga idealet. Kvinnliga stjärnor som Audrey Hepburn och Marilyn Monroe fortsatte att fascinera.</p>
      
      <h3>1990-2010: Millenniegenerationen</h3>
      <p>Leonardo DiCaprio, Brad Pitt, Jennifer Aniston och många fler tog över som generationens kändiskrossar.</p>
      
      <h3>2020-idag: Den nya generationen</h3>
      <p>Zendaya, Timothée Chalamet och andra unga stjärnor representerar en ny era av diversitet och representation i Hollywood.</p>
      
      <h3>Vad gör en kändiskross tidlös?</h3>
      <p>Vissa kvaliteter går igen genom alla generationer: karisma, talang, och förmågan att ansluta med publiken på en djupare nivå.</p>
    `,
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop&q=80",
    category: "Kultur",
    author: "Adam Sending-Power",
    publishedAt: "2024-09-25",
    readTime: "6 min läsning",
  },
  {
    id: "2",
    slug: "varldsvida-alert-de-varsta-staderna",
    title: "Världsvida Alert: De värsta städerna för äkta onlinedejting, avslöjas",
    excerpt: "Se de värsta. In just a natural sign of things like for others do is think, and you should matter a matter bailure approach is the business in any case. However that you too, single fathers, these, dont worry. Here's a color match.",
    content: `
      <h2>Onlinedejting runt om i världen</h2>
      <p>En ny studie har kartlagt var det är svårast att hitta genuin kärlek online. Resultaten är överraskande.</p>
      
      <h3>Metodologin</h3>
      <p>Studien baseras på användarbeteenden, svarsfrekvens och matchningsframgång i olika städer världen över.</p>
      
      <h3>De mest utmanande städerna</h3>
      <p>Storstäder med högt tempo och stress toppar listan över svåraste platser för onlinedejting.</p>
      
      <h3>Varför är vissa städer svårare?</h3>
      <ul>
        <li>Högt tempo och tidsbrist</li>
        <li>För stort utbud skapar "paradox of choice"</li>
        <li>Mindre genuint intresse för långsiktiga relationer</li>
        <li>Demografiska faktorer</li>
      </ul>
      
      <h3>Tips för framgång</h3>
      <p>Oavsett var du bor kan du öka dina chanser genom att vara autentisk, tydlig med vad du söker och ha tålamod.</p>
    `,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop",
    category: "Dejting",
    author: "Adam Sending-Power",
    publishedAt: "2024-09-22",
    readTime: "5 min läsning",
  },
  {
    id: "3",
    slug: "ny-undersokning-avslojar-39-procent",
    title: "Ny undersökning avslöjar: 39% av amerikanerna erkänner att de har en BDSM-fetisch",
    excerpt: "39% läst varje. In just a natural part of being like for others. do is think, and you... when that you also, maybe resistance approach is the business in any case, moved that you, too, single fathers a fetish, don't worry: We in order teller.",
    content: `
      <h2>Sexualitet och öppenhet i modern tid</h2>
      <p>En ny omfattande undersökning visar att fler människor än någonsin är öppna med sina sexuella preferenser.</p>
      
      <h3>Undersökningens resultat</h3>
      <p>39% av de tillfrågade amerikanska vuxna erkände att de har intresse för BDSM-relaterade aktiviteter.</p>
      
      <h3>Vad betyder detta?</h3>
      <p>Den ökade öppenheten reflekterar ett samhälle som blir mer accepterande av olika sexuella uttryck.</p>
      
      <h3>Säkerhet och samtycke först</h3>
      <p>Oavsett preferenser är det viktigt att alltid prioritera:</p>
      <ul>
        <li>Tydligt samtycke från alla parter</li>
        <li>Säkra ord och gränser</li>
        <li>Öppen kommunikation</li>
        <li>Respekt för varandra</li>
      </ul>
      
      <h3>Normalisering av konversationen</h3>
      <p>Att prata öppet om sexualitet hjälper till att minska stigma och skapa hälsosammare relationer.</p>
    `,
    image: "https://images.unsplash.com/photo-1583001680373-0c815e327759?w=800&h=600&fit=crop",
    category: "Forskning",
    author: "Adam Sending-Power",
    publishedAt: "2024-09-20",
    readTime: "4 min läsning",
  },
  {
    id: "4",
    slug: "topp-10-ai-flickvan-generatorer",
    title: "Topp 10 AI-flickvän generatorer",
    excerpt: "The advancement of artificial intelligence (AI) has began and it began subs/ding for realistic AI GF. Different characters can be used on diverse purposes in the world of NSFW content and more. AI has bringing out new...",
    content: `
      <h2>AI-kompanjoner: Den nya generationens digitala interaktion</h2>
      <p>AI-teknologi har revolutionerat hur vi skapar och interagerar med virtuella karaktärer.</p>
      
      <h3>1. Dintyp.se - Svensk kvalitet</h3>
      <p>Vår egen plattform erbjuder avancerad AI-teknologi med svenskt fokus och högsta säkerhet.</p>
      
      <h3>2-10. Internationella alternativ</h3>
      <p>Det finns många alternativ på marknaden, var och en med sina egna styrkor och fokusområden.</p>
      
      <h3>Vad ska man tänka på?</h3>
      <ul>
        <li>Integritet och datasäkerhet</li>
        <li>Kvalitet på AI-modellen</li>
        <li>Anpassningsmöjligheter</li>
        <li>Pris och funktioner</li>
        <li>Stöd för svenska språket</li>
      </ul>
      
      <h3>Framtiden för AI-kompanjoner</h3>
      <p>Teknologin utvecklas snabbt och vi kan förvänta oss ännu mer avancerade och naturliga interaktioner framöver.</p>
    `,
    image: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=600&fit=crop",
    category: "Guide",
    author: "Adam Sending-Power",
    publishedAt: "2024-09-18",
    readTime: "8 min läsning",
  },
  {
    id: "5",
    slug: "vad-ar-en-ai-flickvan",
    title: "Vad är en AI-flickvän?",
    excerpt: "In 2024, technology has reached the point for inter-wave in many of commonplace in the digital era. The introduction of AI girlfriends, virtual companions driven by artificial intelligence is only such trend...",
    content: `
      <h2>Introduktion till AI-kompanjoner</h2>
      <p>AI-flickvänner och virtuella kompanjoner har blivit en naturlig del av det digitala landskapet 2024.</p>
      
      <h3>Vad är en AI-flickvän?</h3>
      <p>En AI-flickvän är en virtuell karaktär driven av artificiell intelligens som kan föra naturliga konversationer, anpassa sig till dina preferenser och erbjuda digitalt sällskap.</p>
      
      <h3>Hur fungerar det?</h3>
      <p>Avancerade språkmodeller kombineras med personlighetsanpassning för att skapa unika och engagerande upplevelser.</p>
      
      <h3>Fördelar med AI-kompanjoner</h3>
      <ul>
        <li>Tillgänglig 24/7</li>
        <li>Omdömesfri kommunikation</li>
        <li>Anpassningsbar personlighet</li>
        <li>Praktisera social interaktion</li>
        <li>Kreativ utforskning</li>
      </ul>
      
      <h3>Etiska överväganden</h3>
      <p>Det är viktigt att komma ihåg att AI-kompanjoner är verktyg och inte ska ersätta verkliga mänskliga relationer.</p>
    `,
    image: "https://images.unsplash.com/photo-1620794108219-ba1d8b93e194?w=800&h=600&fit=crop",
    category: "Guide",
    author: "Adam Sending-Power",
    publishedAt: "2024-09-15",
    readTime: "5 min läsning",
  },
  {
    id: "6",
    slug: "virtuellt-companionship",
    title: "Virtuellt Companionship",
    excerpt: "Will you explore for a virtual companion but don't know the significant high on the market and especially to meet your needs?",
    content: `
      <h2>Hitta rätt virtuell kompanjon</h2>
      <p>Med så många alternativ på marknaden kan det vara svårt att veta var man ska börja.</p>
      
      <h3>Definiera dina behov</h3>
      <p>Innan du väljer en plattform, tänk på vad du söker:</p>
      <ul>
        <li>Casual konversation eller djupa diskussioner?</li>
        <li>Kreativ utforskning eller praktiskt stöd?</li>
        <li>Visuell representation viktigt?</li>
        <li>Språkstöd och kulturell kontext?</li>
      </ul>
      
      <h3>Utvärdera plattformar</h3>
      <p>Kolla på recensioner, prova gratis versioner och jämför funktioner innan du bestämmer dig.</p>
      
      <h3>Säkerhet och integritet</h3>
      <p>Välj alltid plattformar som tar din data och integritet på allvar.</p>
      
      <h3>Kom igång</h3>
      <p>När du valt en plattform, ta dig tid att anpassa din upplevelse för bästa resultat.</p>
    `,
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop",
    category: "Guide",
    author: "Adam Sending-Power",
    publishedAt: "2024-09-12",
    readTime: "4 min läsning",
  },
  {
    id: "7",
    slug: "heta-ai-tjejer",
    title: "Heta AI-tjejer",
    excerpt: "Are you looking for hot AI Girls? Look and Further you are in the right place!",
    content: `
      <h2>Skapa din perfekta AI-karaktär</h2>
      <p>Med moderna AI-bildgeneratorer och karaktärsskapare kan du designa exakt den karaktär du vill ha.</p>
      
      <h3>Anpassning är nyckeln</h3>
      <p>Från utseende till personlighet - allt kan skräddarsys efter dina preferenser:</p>
      <ul>
        <li>Fysiska attribut och utseende</li>
        <li>Klädstil och mode</li>
        <li>Personlighetsdrag</li>
        <li>Intressen och hobbyer</li>
        <li>Kommunikationsstil</li>
      </ul>
      
      <h3>Högkvalitativa bilder</h3>
      <p>Använd avancerade bildgenereringsverktyg för professionella resultat.</p>
      
      <h3>Respektfull användning</h3>
      <p>Kom ihåg att alltid följa plattformens riktlinjer och använd teknologin ansvarsfullt.</p>
      
      <h3>Börja skapa idag</h3>
      <p>På Dintyp.se kan du enkelt skapa och anpassa din AI-karaktär på bara några minuter.</p>
    `,
    image: "https://images.unsplash.com/photo-1534008757030-27299c4371b6?w=800&h=600&fit=crop",
    category: "Guide",
    author: "Adam Sending-Power",
    publishedAt: "2024-09-10",
    readTime: "3 min läsning",
  },
];

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = blogPosts.find(p => p.slug === params.slug);
  
  if (!post) {
    return {
      title: "Artikel hittades inte - Dintyp.se",
    };
  }

  return {
    title: `${post.title} - Dintyp Blogg`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find(p => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  // Get related posts (excluding current post)
  const relatedPosts = blogPosts.filter(p => p.id !== post.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Link 
            href="/blogg" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Tillbaka till bloggen</span>
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Meta Info */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
              <Tag className="h-3 w-3" />
              {post.category}
            </span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.publishedAt).toLocaleDateString('sv-SE', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

        {/* Author */}
        <div className="flex items-center justify-between mb-8 pb-8 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              {post.author[0]}
            </div>
            <div>
              <div className="font-semibold">{post.author}</div>
              <div className="text-sm text-muted-foreground">Författare</div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors">
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium">Dela</span>
          </button>
        </div>

        {/* Featured Image */}
        <div className="relative h-96 rounded-2xl overflow-hidden mb-12">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Content */}
        <div 
          className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6 prose-ul:mb-6 prose-li:mb-2 prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Call to Action */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
          <h3 className="text-2xl font-bold mb-4">Redo att börja?</h3>
          <p className="text-muted-foreground mb-6">
            Skapa din första AI-karaktär idag och upplev framtidens konversationer.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/create-character"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Skapa karaktär
            </Link>
            <Link 
              href="/guide"
              className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition-colors"
            >
              Läs guiden
            </Link>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-16 max-w-6xl">
            <h2 className="text-3xl font-bold mb-8">Relaterade artiklar</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blogg/${relatedPost.slug}`}>
                  <article className="group h-full">
                    <div className="bg-card border rounded-xl overflow-hidden hover:border-primary transition-all duration-300 shadow-sm hover:shadow-lg h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-semibold">
                            <Tag className="h-3 w-3" />
                            {relatedPost.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">
                          {relatedPost.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                          <span>Läs artikel</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
