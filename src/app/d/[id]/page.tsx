import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, CalendarDays, Pencil } from "lucide-react";
import { getViewer } from "@/server/auth";
import { getDeck, listComments } from "@/server/community";
import { FORMATS, labelOf } from "@/lib/social/types";
import { cardImage } from "@/lib/tcg/constants";
import { Avatar, displayName } from "@/components/social/Avatar";
import { DeckActions } from "@/components/social/DeckActions";
import { DeckList } from "@/components/social/DeckList";
import { Comments } from "@/components/social/Comments";
import { AdSlot } from "@/components/social/AdSlot";
import { ReportButton } from "@/components/social/ReportButton";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

const load = cache(async (id: string) => {
  const viewer = await getViewer();
  return { viewer, deck: await getDeck(viewer?.id ?? null, id).catch(() => null) };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const { deck } = await load(id);
  if (!deck || deck.status !== "published") return { title: "Deck", robots: { index: false } };
  const description = deck.description ?? `Deck ${labelOf(FORMATS, deck.format)} de ${displayName(deck.author)} no PokéDeck — ${deck.card_count} cartas.`;
  const img = cardImage(deck.cover_image, "high");
  return {
    title: `${deck.title} — deck de ${displayName(deck.author)}`,
    description,
    alternates: { canonical: `/d/${deck.id}` },
    openGraph: { title: deck.title, description, type: "article", images: img ? [{ url: img, width: 600, height: 825 }] : [] },
  };
}

export default async function DeckPage({ params }: Params) {
  const { id } = await params;
  const { viewer, deck } = await load(id);
  if (!deck) notFound();
  const comments = deck.status === "published" ? await listComments(viewer?.id ?? null, deck.id).catch(() => []) : [];
  const mine = viewer?.id === deck.user_id;
  const cover = cardImage(deck.cover_image, "high");

  return (
    <article className="relative isolate">
      <div className="absolute inset-x-0 top-0 -z-10 h-[760px]" style={{ background: "radial-gradient(55% 55% at 25% 30%, rgb(255 122 47 / .18), transparent 70%), linear-gradient(180deg, #17110d, #0b0b0d)" }} />
      <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-28 md:px-6 md:pt-32">
        <Link href="/comunidade" className="eyebrow inline-flex items-center gap-2 hover:text-white"><ArrowLeft size={12} /> Comunidade</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(260px,0.7fr)_1.3fr]">
          <div className="mx-auto w-full max-w-[380px]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={`Capa do deck ${deck.title}`} className="w-full rounded-[4.5%] shadow-[0_40px_80px_-20px_rgba(0,0,0,.8)]" />
            ) : (
              <div className="aspect-[63/88] w-full rounded-[4.5%] border border-white/10 bg-ink-2" />
            )}
          </div>
          <div className="min-w-0">
            {deck.status === "draft" && <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 font-mono text-[10px] uppercase text-white/70">Rascunho — só você vê</p>}
            <p className="eyebrow">{labelOf(FORMATS, deck.format)} · {deck.card_count} cartas{deck.main_card_name ? ` · ${deck.main_card_name}` : ""}</p>
            <h1 className="display mt-3 text-[48px] text-white md:text-[80px]">{deck.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href={`/u/${deck.author.username}`} className="flex items-center gap-2 text-sm text-white/80 hover:text-white">
                <Avatar dex={deck.author.avatar_dex} size={32} /> {displayName(deck.author)}
              </Link>
              {deck.published_at && (
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/40">
                  <CalendarDays size={12} /> {new Date(deck.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              )}
            </div>
            {deck.description && <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70">{deck.description}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {deck.status === "published" && <DeckActions deckId={deck.id} title={deck.title} likes={deck.likes} liked={deck.liked} saved={deck.saved} signedIn={Boolean(viewer)} />}
              {mine && (
                <Link href={`/decks-tcg/${deck.id}`} className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white/80 hover:border-white/40"><Pencil size={14} /> Editar</Link>
              )}
              {!mine && viewer && <ReportButton type="deck" id={deck.id} />}
            </div>
            <p className="mt-3 text-[11px] text-white/35">Publicar um deck não coloca nenhuma carta à disposição para troca.</p>
          </div>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="display mb-6 text-4xl">Lista de cartas</h2>
            <DeckList cards={deck.cards} />
          </div>
          <div className="space-y-10">
            {deck.strategy && (
              <section>
                <h2 className="display mb-4 text-4xl">Estratégia</h2>
                <div className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm leading-relaxed text-white/75">{deck.strategy}</div>
              </section>
            )}
            <AdSlot placement="deck" />
          </div>
        </div>

        {deck.status === "published" && (
          <section className="mt-16 max-w-3xl">
            <h2 className="display mb-6 text-4xl">Comentários <span className="font-mono text-base text-white/40">{deck.comments}</span></h2>
            <Comments deckId={deck.id} initial={comments} me={viewer?.id ?? null} />
          </section>
        )}
      </div>
    </article>
  );
}
