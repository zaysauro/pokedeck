import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { cardImage, tcgTypeColor } from "@/lib/tcg/constants";
import { getCard } from "@/services/tcgdex";
import { CardArt } from "@/components/tcg/CardArt";
import { CardInfo } from "@/components/tcg/CardInfo";
import { CollectorActions } from "@/components/tcg/CollectorActions";
import { RelatedCards } from "@/components/tcg/RelatedCards";

export const revalidate = 86400;

type Params = { params: Promise<{ id: string }> };
const load = cache((id: string) => getCard(decodeURIComponent(id)));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const card = await load(id).catch(() => null);
  if (!card) return { title: "Carta não encontrada" };
  const title = `${card.name} — ${card.set.name} ${card.localId}`;
  const description = [
    `Carta ${card.name} da coleção ${card.set.name} (${card.localId}${card.set.cardCount?.official ? `/${card.set.cardCount.official}` : ""}) do Pokémon TCG.`,
    card.rarity && card.rarity !== "None" ? `Raridade: ${card.rarity}.` : "",
    card.hp ? `${card.hp} HP.` : "",
    card.illustrator ? `Ilustração de ${card.illustrator}.` : "",
  ].filter(Boolean).join(" ");
  const img = cardImage(card.image, "high");
  return {
    title,
    description,
    alternates: { canonical: `/cards/${encodeURIComponent(card.id)}` },
    openGraph: { title: `${title} · PokéDeck`, description, type: "article", images: img ? [{ url: img, width: 600, height: 825, alt: card.name }] : [] },
    twitter: { card: "summary_large_image", title, description, images: img ? [img] : [] },
  };
}

export default async function CardPage({ params }: Params) {
  const { id } = await params;
  const card = await load(id);
  if (!card) notFound();
  const accent = tcgTypeColor(card.types?.[0]);
  const dex = card.dexId?.[0];

  return (
    <article className="relative isolate">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-[900px]"
        style={{ background: `radial-gradient(55% 50% at 30% 35%, ${accent}33, transparent 70%), linear-gradient(180deg, color-mix(in oklab, ${accent} 14%, #0b0b0d), #0b0b0d)` }}
      />
      <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-28 md:px-6 md:pt-32">
        <nav aria-label="Trilha" className="eyebrow flex flex-wrap items-center gap-2">
          <Link href="/cards" className="inline-flex items-center gap-2 hover:text-white"><ArrowLeft size={12} /> Cartas TCG</Link>
          <span className="text-white/20">/</span>
          <Link href={`/cards/sets/${encodeURIComponent(card.set.id)}`} className="hover:text-white">{card.set.name}</Link>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(300px,0.9fr)_1.25fr] lg:gap-16">
          <div className="mx-auto w-full max-w-[460px] lg:sticky lg:top-28 lg:self-start">
            <CardArt image={card.image} name={card.name} rarity={card.rarity} priority />
          </div>
          <div className="min-w-0">
            <CardInfo card={card} />
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <CollectorActions card={card} />
              {dex && (
                <Link href={`/pokemon/${dex}`} className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white/80 hover:border-white/40">
                  <BookOpen size={15} /> Ver na Pokédex
                </Link>
              )}
            </div>
            <p className="mt-4 text-[11px] text-white/30">Coleção pessoal salva neste navegador. Dados: TCGdex.</p>
          </div>
        </div>
      </div>

      <RelatedCards name={card.name} currentId={card.id} />
    </article>
  );
}
