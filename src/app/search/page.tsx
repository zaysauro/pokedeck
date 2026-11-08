import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { PokedexExplorer } from "@/components/pokedex/PokedexExplorer";
import { DEFAULT_FILTERS } from "@/lib/filters";

export const metadata: Metadata = { title: "Busca" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  return (
    <Container>
      <PageHeader eyebrow="Busca global" title={q ? `“${q}”` : "Buscar"} italic={q ? undefined : "Pokémon"}>
        Pesquise por nome (com ou sem acentos) ou pelo número da National Pokédex.
      </PageHeader>
      <PokedexExplorer key={q} initial={{ ...DEFAULT_FILTERS, q }} />
    </Container>
  );
}
