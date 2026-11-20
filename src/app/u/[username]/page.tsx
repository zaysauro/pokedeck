import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CalendarDays, Lock, MapPin } from "lucide-react";
import { getViewer } from "@/server/auth";
import { getProfileShowcase, getPublicProfile, listUserDecks } from "@/server/community";
import { spriteUrl } from "@/lib/sprites";
import { Avatar, displayName } from "@/components/social/Avatar";
import { ProfileActions } from "@/components/social/ProfileActions";
import { Showcase } from "@/components/social/Showcase";
import { DeckGrid } from "@/components/social/DeckTile";
import { Thumb } from "@/components/social/CollectionManager";
import { AdSlot } from "@/components/social/AdSlot";
import { LANGUAGES, labelOf } from "@/lib/social/types";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ username: string }>; searchParams: Promise<{ tab?: string }> };

const load = cache(async (username: string) => {
  if (!/^[a-z0-9_]{3,20}$/i.test(username)) return null;
  const viewer = await getViewer();
  const res = await getPublicProfile(viewer?.id ?? null, username).catch(() => null);
  return res ? { viewer, ...res } : null;
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const r = await load(username);
  if (!r) return { title: "Treinador não encontrado", robots: { index: false } };
  const p = r.profile;
  const description = p.bio ?? `${displayName(p)} no PokéDeck: ${p.decks} decks publicados e ${p.cards} cartas na coleção.`;
  return {
    title: `${displayName(p)} (@${p.username})`,
    description,
    alternates: { canonical: `/u/${p.username}` },
    openGraph: { title: `${displayName(p)} · PokéDeck`, description, images: [spriteUrl(p.avatar_dex, "artwork")] },
  };
}

export default async function TrainerPage({ params, searchParams }: Params) {
  const { username } = await params;
  const { tab: rawTab } = await searchParams;
  const r = await load(username);
  if (!r) notFound();
  const { viewer, profile: p, following, liked, blocked, i_blocked } = r;
  const me = viewer?.id === p.user_id;
  const tab = rawTab === "colecao" || rawTab === "trocas" ? rawTab : "decks";
  const [decks, showcase] = await Promise.all([
    listUserDecks(viewer?.id ?? null, p.user_id).catch(() => []),
    getProfileShowcase(viewer?.id ?? null, p.user_id).catch(() => ({ collection: [], offers: [], wants: [] })),
  ]);
  const favorites = showcase.collection.filter((c) => c.favorite).slice(0, 6);

  return (
    <div className="relative isolate">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px]" style={{ background: "radial-gradient(45% 60% at 20% 30%, rgb(255 122 47 / .16), transparent 70%), linear-gradient(180deg, #141012, #0b0b0d)" }} />
      <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-28 md:px-6 md:pt-36">
        <header className="grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <Avatar dex={p.avatar_dex} size={132} />
          <div className="min-w-0">
            <h1 className="display text-[52px] leading-none text-white md:text-[80px]">{displayName(p)}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/45">
              <span>@{p.username}</span>
              {p.city && <span className="flex items-center gap-1"><MapPin size={13} /> {p.city}{p.state ? `/${p.state}` : ""}</span>}
              <span className="flex items-center gap-1"><CalendarDays size={13} /> desde {new Date(p.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
            </p>
            {p.bio && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">{p.bio}</p>}
          </div>
          <ProfileActions userId={p.user_id} username={p.username} me={me} signedIn={Boolean(viewer)} following={following} liked={liked} collectionPublic={p.collection_public} blocked={blocked} iBlocked={i_blocked} collectionLikes={p.collection_likes} />
        </header>

        <dl className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-5">
          {[["Seguidores", p.followers], ["Seguindo", p.following], ["Cartas", p.cards], ["Decks", p.decks], ["Curtidas na coleção", p.collection_likes]].map(([k, v]) => (
            <div key={k as string} className="bg-ink px-4 py-4">
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1 font-mono text-2xl text-white">{Number(v).toLocaleString("pt-BR")}</dd>
            </div>
          ))}
        </dl>

        {favorites.length > 0 && (
          <section className="mt-12">
            <p className="eyebrow mb-4">Cartas favoritas em destaque</p>
            <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
              {favorites.map((c) => (
                <Link key={c.id} href={`/cards/${encodeURIComponent(c.card_id)}`} className="shrink-0 transition hover:-translate-y-1">
                  <Thumb src={c.card_image} alt={c.card_name} w={150} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <nav aria-label="Seções do perfil" className="mt-12 flex gap-1 border-b border-white/10">
          {[["decks", `Decks (${decks.length})`], ["colecao", "Coleção"], ["trocas", "Trocas"]].map(([k, l]) => (
            <Link key={k} href={`/u/${p.username}${k === "decks" ? "" : `?tab=${k}`}`} scroll={false} aria-current={tab === k ? "page" : undefined} className={`relative px-4 py-3 text-sm ${tab === k ? "text-white" : "text-white/45 hover:text-white"}`}>
              {l}
              {tab === k && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[var(--accent)]" />}
            </Link>
          ))}
        </nav>

        <div className="mt-8">
          {blocked && !me ? (
            <p className="text-sm text-white/45">Conteúdo indisponível.</p>
          ) : tab === "decks" ? (
            decks.length ? <DeckGrid decks={decks} /> : <p className="text-sm text-white/45">Nenhum deck publicado ainda.</p>
          ) : tab === "colecao" ? (
            p.collection_public || me ? (
              <>
                {!p.collection_public && me ? (
                  <p className="flex items-center gap-2 text-sm text-white/55">
                    <Lock size={14} /> Sua coleção está privada e não aparece para outros treinadores.
                    <Link href="/colecao" className="underline underline-offset-4">Gerenciar em Minha Coleção</Link>
                  </p>
                ) : (
                  <Showcase items={showcase.collection} />
                )}
                <AdSlot placement="collection" className="mt-10" />
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-white/45"><Lock size={14} /> Coleção privada.</p>
            )
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              <TradeList title="Disponíveis para troca" items={showcase.offers.map((o) => ({ ...o, qty: o.for_trade }))} empty="Nenhuma carta disponível para troca." />
              <TradeList title="Procurando" items={showcase.wants.map((w) => ({ ...w, qty: w.quantity }))} empty="Nenhuma carta procurada." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TradeList({ title, items, empty }: { title: string; items: { id: number; card_id: string; card_name: string; card_image: string | null; set_name: string | null; language: string | null; qty: number }[]; empty: string }) {
  return (
    <section>
      <p className="eyebrow mb-3">{title} <span className="font-mono">{items.length}</span></p>
      {items.length === 0 ? <p className="text-sm text-white/40">{empty}</p> : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/cards/${encodeURIComponent(c.card_id)}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-2 p-2 transition hover:border-white/30">
                <Thumb src={c.card_image} alt={c.card_name} w={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white">{c.card_name}</span>
                  <span className="block truncate font-mono text-[10px] uppercase text-white/35">{c.set_name} · {c.language ? labelOf(LANGUAGES, c.language) : "qualquer idioma"}</span>
                </span>
                <span className="font-mono text-xs text-white/50">{c.qty}×</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] text-white/30">Interessado? Cadastre a carta em Minha Coleção — o PokéDeck cria o match e libera a conversa.</p>
    </section>
  );
}
