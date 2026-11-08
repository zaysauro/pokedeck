import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { FavoritesView } from "@/components/favorites/FavoritesView";

export const metadata: Metadata = { title: "Favoritos" };

export default function FavoritesPage() {
  return (
    <Container>
      <PageHeader eyebrow="Coleção pessoal" title="Seus" italic="favoritos">
        As cartas que você guardou. Filtre por tipo e envie qualquer uma direto para um deck.
      </PageHeader>
      <FavoritesView />
    </Container>
  );
}
