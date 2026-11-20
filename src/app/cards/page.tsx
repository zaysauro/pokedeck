import type { Metadata } from "next";
import { DEFAULT_TCG_FILTERS, POPULAR_CARD_IDS, SPECIAL_RARITIES } from "@/lib/tcg/constants";
import { parseTcgFilters } from "@/lib/tcg/query";
import { getCardsByIds, getMeta, getRecentSets, searchCards } from "@/services/tcgdex";
import { TcgExplorer } from "@/components/tcg/TcgExplorer";
import { RecentSets, SpecialCards, TcgHero } from "@/components/tcg/TcgLanding";

type SP = Promise<Record<string, string | string[] | undefined>>;

const DESCRIPTION =
  "Explore cartas reais do Pokémon Estampas Ilustradas (Pokémon TCG) em português: busque por nome, coleção, série, raridade, tipo, ilustrador e HP, e veja ataques, habilidades e ilustrações em alta resolução.";

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const f = parseTcgFilters(await searchParams);
  const bits = [f.q && `“${f.q}”`, f.rarity, f.type, f.illustrator && `ilustradas por ${f.illustrator}`].filter(Boolean);
  const title = bits.length ? `Cartas Pokémon TCG ${bits.join(" · ")}` : "Cartas Pokémon TCG — Cartas Reais";
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: "/cards" },
    openGraph: {
      title: `${title} · PokéDeck`,
      description: DESCRIPTION,
      type: "website",
      images: [{ url: "https://assets.tcgdex.net/pt/sv/sv03.5/199/high.webp", width: 600, height: 825, alt: "Charizard ex — 151" }],
    },
    keywords: ["cartas pokémon", "pokémon tcg", "pokémon estampas ilustradas", "coleção pokémon", "cartas raras pokémon"],
  };
}

const safe = <T,>(p: Promise<T>) => p.catch((e) => {
  console.error("[cards]", e);
  return null;
});

export default async function CardsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters = parseTcgFilters(sp);
  const card = typeof sp.card === "string" ? sp.card : null;

  const [meta, result, specials, popular, recent, all] = await Promise.all([
    safe(getMeta()),
    safe(searchCards(filters)),
    safe(searchCards({ ...DEFAULT_TCG_FILTERS, rarity: SPECIAL_RARITIES[0] }, 12)),
    safe(getCardsByIds(POPULAR_CARD_IDS)),
    safe(getRecentSets(8)),
    safe(searchCards({ ...DEFAULT_TCG_FILTERS, images: false }, 1)),
  ]);

  return (
    <>
      <TcgHero popular={popular ?? []} totalCards={all?.total ?? null} />
      <SpecialCards initial={specials} />
      <RecentSets sets={recent ?? []} />
      <section id="explorar" className="mx-auto max-w-[1440px] scroll-mt-20 px-4 pb-10 md:px-6">
        <p className="eyebrow">Pesquisa completa</p>
        <h2 className="display mb-8 mt-3 text-[48px] md:text-[80px]">
          Todas as <em className="italic text-[var(--accent)]">cartas.</em>
        </h2>
        <TcgExplorer initialFilters={filters} initialResult={result} meta={meta} initialCardId={card} />
        <p className="mt-16 text-center text-[11px] leading-relaxed text-white/30">
          Dados e imagens: <a href="https://tcgdex.dev" target="_blank" rel="noreferrer" className="underline decoration-white/20 underline-offset-4 hover:text-white/60">TCGdex</a> (catálogo em português).
          Pokémon e suas marcas pertencem à Nintendo, Creatures, Game Freak e The Pokémon Company.
        </p>
      </section>
    </>
  );
}
