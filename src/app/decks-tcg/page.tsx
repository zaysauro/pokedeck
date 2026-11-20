import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { requireViewer } from "@/server/auth";
import { getMyProfile } from "@/server/trading";
import { listMyDecks, listSavedDecks } from "@/server/community";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { DeckGrid } from "@/components/social/DeckTile";

export const metadata: Metadata = { title: "Meus decks TCG", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyTcgDecksPage() {
  const viewer = await requireViewer("/decks-tcg");
  if (!(await getMyProfile(viewer.id))) redirect("/conta?novo=1&next=/decks-tcg");
  const [mine, saved] = await Promise.all([listMyDecks(viewer.id), listSavedDecks(viewer.id)]);
  return (
    <Container className="pb-10">
      <PageHeader eyebrow="Deck Builder TCG" title="Decks de" italic="60 cartas.">
        Monte listas com cartas reais do Pokémon TCG, escreva a estratégia e publique para a comunidade. Seus times de 6 Pokémon continuam em
        {" "}<Link href="/teams" className="underline underline-offset-4">My Decks</Link>.
      </PageHeader>
      <Link href="/decks-tcg/novo" className="mb-8 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--on-accent)]"><Plus size={16} /> Novo deck TCG</Link>
      {mine.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-white/10 px-6 py-14 text-center text-sm text-white/45">Você ainda não criou decks TCG.</p>
      ) : (
        <DeckGrid decks={mine} showStatus />
      )}
      {saved.length > 0 && (
        <section className="mt-16">
          <h2 className="display mb-6 text-5xl">Decks <em className="italic text-gold">salvos</em></h2>
          <DeckGrid decks={saved} />
        </section>
      )}
    </Container>
  );
}
