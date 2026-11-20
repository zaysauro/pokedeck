import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { FavoritesView } from "@/components/favorites/FavoritesView";
import { FavoriteCards } from "@/components/tcg/FavoriteCards";

export const metadata: Metadata = { title: "Favoritos" };

export default function FavoritesPage() {
  return (
    <Container>
      <PageHeader eyebrow="Coleção pessoal" title="Seus" italic="favoritos">
        Os Pokémon e as cartas TCG que você guardou. Filtre por tipo, envie Pokémon direto para um deck e acompanhe sua coleção de cartas.
      </PageHeader>
      <FavoritesView />
      <FavoriteCards />
    </Container>
  );
}
