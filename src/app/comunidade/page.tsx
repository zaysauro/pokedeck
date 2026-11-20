import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, ArrowRight, BookMarked, Plus, Users } from "lucide-react";
import { getViewer } from "@/server/auth";
import { dbConfigured } from "@/server/db";
import { exploreDecks, popularTrainers, type ExploreTab } from "@/server/community";
import { Container } from "@/components/ui/PageHeader";
import { DeckGrid } from "@/components/social/DeckTile";
import { Avatar, displayName } from "@/components/social/Avatar";
import { AdSlot } from "@/components/social/AdSlot";
import { CommunityTabs } from "@/components/social/CommunityTabs";

export const metadata: Metadata = {
  title: "Comunidade — decks e colecionadores de Pokémon TCG",
  description: "Descubra decks de Pokémon TCG em alta, rankings semanais e mensais, treinadores populares e coleções públicas no PokéDeck.",
  alternates: { canonical: "/comunidade" },
};
export const dynamic = "force-dynamic";

const TABS: { key: ExploreTab; label: string; title: string }[] = [
  { key: "trending", label: "Em alta", title: "Em alta agora" },
  { key: "week", label: "Ranking semanal", title: "Ranking da semana" },
  { key: "month", label: "Ranking mensal", title: "Ranking do mês" },
  { key: "top", label: "Mais curtidos", title: "Mais curtidos de todos os tempos" },
  { key: "commented", label: "Mais comentados", title: "Mais comentados" },
  { key: "new", label: "Novos decks", title: "Recém-publicados" },
  { key: "recommended", label: "Recomendados", title: "Recomendados para você" },
];

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: raw } = await searchParams;
  const tab = (TABS.find((t) => t.key === raw)?.key ?? "trending") as ExploreTab;
  const viewer = await getViewer();
  const enabled = dbConfigured();
  const [decks, trainers] = enabled
    ? await Promise.all([exploreDecks(viewer?.id ?? null, tab).catch(() => []), popularTrainers(viewer?.id ?? null).catch(() => [])])
    : [[], []];
  const meta = TABS.find((t) => t.key === tab)!;

  return (
    <div className="relative isolate">
      <div className="absolute inset-x-0 top-0 -z-10 h-[620px]" style={{ background: "radial-gradient(50% 60% at 75% 25%, rgb(255 122 47 / .16), transparent 70%), radial-gradient(40% 50% at 10% 70%, rgb(217 181 106 / .1), transparent 70%)" }} />
      <Container className="pb-10">
        <header className="grid gap-8 pb-10 pt-32 md:pt-40 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">PokéDeck Comunidade</p>
            <h1 className="display mt-3 text-[56px] text-white md:text-[104px]">
              Treinadores, <em className="italic text-[var(--accent)]">decks</em> e coleções.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 md:text-base">
              Descubra estratégias, siga colecionadores e mostre sua coleção. Trocas acontecem em um espaço separado, só a partir de matches.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-2" aria-label="Atalhos da comunidade">
            {[
              ["/decks-tcg/novo", "Publicar deck", Plus],
              ["/comunidade/seguindo", "Seguindo", Users],
              ["/colecao", "Minha Coleção", BookMarked],
              ["/trocas", "Trocas", ArrowLeftRight],
            ].map(([href, label, Icon]) => {
              const I = Icon as typeof Plus;
              return (
                <Link key={href as string} href={href as string} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-2/80 px-4 py-4 text-sm text-white/80 transition hover:border-white/30 hover:text-white">
                  <I size={16} className="text-[var(--accent)]" /> {label as string}
                  <ArrowRight size={13} className="ml-auto opacity-0 transition group-hover:opacity-100" />
                </Link>
              );
            })}
          </nav>
        </header>

        <CommunityTabs tabs={TABS.map(({ key, label }) => ({ key, label }))} active={tab} />

        <section className="mt-8">
          <h2 className="display mb-6 text-4xl md:text-5xl">{meta.title}</h2>
          {!enabled ? (
            <p className="rounded-3xl border border-dashed border-white/10 px-6 py-14 text-center text-sm text-white/45">A comunidade está sendo ativada.</p>
          ) : decks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-6 py-14 text-center">
              <p className="text-sm text-white/45">{tab === "recommended" && !viewer ? "Entre e cadastre sua coleção para receber recomendações." : "Nenhum deck aqui ainda. Que tal publicar o primeiro?"}</p>
              <Link href="/decks-tcg/novo" className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm text-ink"><Plus size={14} /> Criar deck</Link>
            </div>
          ) : (
            <DeckGrid decks={decks} ranked={tab === "week" || tab === "month" || tab === "top"} />
          )}
        </section>

        <AdSlot placement="explore" className="mt-14" />

        {trainers.length > 0 && (
          <section className="mt-16">
            <h2 className="display mb-6 text-4xl md:text-5xl">Treinadores <em className="italic text-gold">populares</em></h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {trainers.map((t) => (
                <li key={t.user_id}>
                  <Link href={`/u/${t.username}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-2 p-4 transition hover:border-white/30">
                    <Avatar dex={t.avatar_dex} size={48} />
                    <span className="min-w-0">
                      <span className="block truncate text-white">{displayName(t)}</span>
                      <span className="block font-mono text-[10px] text-white/40">{t.followers} seguidores · {t.decks} decks · {t.cards} cartas</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </div>
  );
}
