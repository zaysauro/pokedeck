import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireViewer } from "@/server/auth";
import { getMyProfile, listMyCollection } from "@/server/trading";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { CollectionManager } from "@/components/social/CollectionManager";

export const metadata: Metadata = { title: "Minha Coleção", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyCollectionPage() {
  const viewer = await requireViewer("/colecao");
  const profile = await getMyProfile(viewer.id);
  if (!profile) redirect("/conta?novo=1&next=/colecao");
  const data = await listMyCollection(viewer.id);
  return (
    <Container className="pb-10">
      <PageHeader eyebrow="Minha Coleção" title="Suas cartas," italic="organizadas.">
        Cadastre cópias, idioma e estado de conservação. Marque quantas estão disponíveis para troca e o que você procura —
        o PokéDeck encontra os matches.
      </PageHeader>
      <CollectionManager initialItems={data.items} initialWants={data.wants} username={profile.username} />
    </Container>
  );
}
