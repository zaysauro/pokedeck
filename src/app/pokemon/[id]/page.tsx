import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getPokemonDetail } from "@/services/pokeapi";
import { PokemonDetailView } from "@/components/detail/PokemonDetailView";

export const revalidate = 86400;

const load = cache((id: string) => getPokemonDetail(id));

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const p = await load(id);
  if (!p) return { title: "Pokémon não encontrado" };
  return {
    title: `${p.display} #${String(p.speciesId).padStart(4, "0")}`,
    description: p.flavor?.text ?? `Ficha completa de ${p.display} na PokéDeck.`,
    openGraph: { images: p.sprites.artwork ? [p.sprites.artwork] : [] },
  };
}

export default async function PokemonPage({ params }: Params) {
  const { id } = await params;
  const p = await load(id);
  if (!p) notFound();
  return <PokemonDetailView p={p} />;
}
