import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { requireViewer } from "@/server/auth";
import { getMyProfile } from "@/server/trading";
import { followingFeed } from "@/server/community";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { DeckTile } from "@/components/social/DeckTile";
import { Avatar, displayName } from "@/components/social/Avatar";
import { Thumb } from "@/components/social/CollectionManager";
import { AdSlot } from "@/components/social/AdSlot";
import { timeAgo } from "@/lib/social/time";

export const metadata: Metadata = { title: "Seguindo", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function FollowingFeedPage() {
  const viewer = await requireViewer("/comunidade/seguindo");
  if (!(await getMyProfile(viewer.id))) redirect("/conta?novo=1&next=/comunidade/seguindo");
  const feed = await followingFeed(viewer.id);

  return (
    <Container className="pb-10">
      <PageHeader eyebrow="Feed" title="Seguindo" italic="de perto.">
        Novos decks e atualizações públicas de coleção dos treinadores que você segue. Só conteúdo de Pokémon TCG.
      </PageHeader>
      {feed.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">
          <Users className="mx-auto text-white/30" />
          <p className="mt-3 text-sm text-white/50">Siga treinadores para ver as novidades deles aqui.</p>
          <Link href="/comunidade" className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-4 text-sm text-ink">Explorar a comunidade</Link>
        </div>
      ) : (
        <ol className="mx-auto max-w-3xl space-y-6">
          {feed.map((it, i) => (
            <li key={`${it.kind}-${it.at}-${i}`}>
              {i === 4 && <AdSlot placement="feed" className="mb-6" />}
              <div className="mb-2 flex items-center gap-2 text-xs text-white/50">
                <Link href={`/u/${it.author.username}`} className="flex items-center gap-2 hover:text-white">
                  <Avatar dex={it.author.avatar_dex} size={24} /> <b className="font-medium text-white/85">{displayName(it.author)}</b>
                </Link>
                {it.kind === "deck" ? "publicou um deck" : `adicionou ${it.count} carta(s) à coleção`}
                <span className="ml-auto font-mono text-[10px] text-white/35">{timeAgo(it.at)}</span>
              </div>
              {it.kind === "deck" && it.deck ? (
                <div className="max-w-sm"><DeckTile deck={it.deck} /></div>
              ) : (
                <Link href={`/u/${it.author.username}?tab=colecao`} className="flex gap-2 overflow-hidden rounded-2xl border border-white/10 bg-ink-2 p-3 transition hover:border-white/30">
                  {it.cards?.map((c) => <Thumb key={c.card_id} src={c.card_image} alt={c.card_name} w={60} />)}
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </Container>
  );
}
