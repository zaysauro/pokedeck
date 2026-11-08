import type { Metadata } from "next";
import { PokedexExplorer } from "@/components/pokedex/PokedexExplorer";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { filtersFromQuery } from "@/lib/filters";

export const metadata: Metadata = { title: "Pokédex Nacional" };

export default async function PokedexPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return (
    <Container>
      <PageHeader eyebrow="National Pokédex · Todas as espécies" title="A coleção" italic="completa">
        Cada espécie como uma carta colecionável. Busque, combine tipos, filtre por geração, região e raridade e
        ordene por atributos.
      </PageHeader>
      <PokedexExplorer initial={filtersFromQuery(sp)} />
    </Container>
  );
}
