import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftRight, ArrowRight, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { requireViewer } from "@/server/auth";
import { getMyProfile, listMatches } from "@/server/trading";
import { tradeDiscovery } from "@/server/community";
import { Container, PageHeader } from "@/components/ui/PageHeader";
import { Avatar, displayName } from "@/components/social/Avatar";
import { Thumb } from "@/components/social/CollectionManager";
import type { MatchSummary } from "@/lib/social/types";

export const metadata: Metadata = { title: "Trocas", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const viewer = await requireViewer("/trocas");
  if (!(await getMyProfile(viewer.id))) redirect("/conta?novo=1&next=/trocas");
  const [matches, discovery] = await Promise.all([listMatches(viewer.id), tradeDiscovery(viewer.id)]);
  const open = matches.filter((m) => m.status === "open");
  const past = matches.filter((m) => m.status !== "open");

  return (
    <Container className="pb-10">
      <PageHeader eyebrow="Matchmaking de trocas" title="Suas" italic="oportunidades.">
        Cruzamos as cartas que você disponibiliza com as que outros procuram — e vice-versa — usando o identificador oficial de cada carta,
        idioma e variante. A negociação acontece por conta e responsabilidade de cada colecionador.
      </PageHeader>

      {open.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center">
          <ArrowLeftRight className="mx-auto text-white/30" />
          <p className="display mt-4 text-3xl">Nenhum match ainda</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
            Marque cartas como “para troca” e cadastre o que você procura em Minha Coleção. Avisaremos quando surgir uma oportunidade.
          </p>
          <Link href="/colecao" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--on-accent)]">Ir para Minha Coleção <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {open.map((m) => <MatchCardView key={m.id} m={m} />)}
        </div>
      )}

      {(discovery.wantedFromMe.length > 0 || discovery.offeredToMe.length > 0) && (
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Discovery title="Procuram cartas suas" hint="Cartas que você marcou para troca e outros colecionadores procuram." items={discovery.wantedFromMe} />
          <Discovery title="Disponíveis para você" hint="Cartas da sua lista “Procurando” que alguém disponibilizou." items={discovery.offeredToMe} />
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-14">
          <p className="eyebrow mb-4">Histórico de matches</p>
          <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
            {past.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <Avatar dex={m.other.avatar_dex} size={30} />
                <span className="flex-1 text-white/70">{displayName(m.other)}</span>
                <span className="font-mono text-[10px] uppercase text-white/35">{m.status === "closed" ? "Encerrado" : "Expirado"}</span>
                <Link href={`/mensagens/${m.id}`} className="text-xs text-white/50 hover:text-white">Ver conversa</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
}

function MatchCardView({ m }: { m: MatchSummary }) {
  const give = m.cards.filter((c) => c.direction === "give");
  const receive = m.cards.filter((c) => c.direction === "receive");
  return (
    <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-2 p-5">
      {m.kind === "mutual" && <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_100%_0%,rgb(217_181_106/.14),transparent_70%)]" />}
      <div className="relative flex items-center gap-3">
        <Avatar dex={m.other.avatar_dex} size={44} />
        <div className="min-w-0 flex-1">
          <Link href={`/u/${m.other.username}`} className="block truncate text-white hover:underline">{displayName(m.other)}</Link>
          <p className="flex items-center gap-1 truncate text-[11px] text-white/40">
            @{m.other.username}{m.other.city && <><MapPin size={10} className="ml-1" /> {m.other.city}{m.other.state ? `/${m.other.state}` : ""}</>}
          </p>
        </div>
        <span className={`flex h-7 items-center gap-1 rounded-full px-2.5 font-mono text-[10px] uppercase tracking-wider ${m.kind === "mutual" ? "bg-gold text-ink" : "border border-white/15 text-white/60"}`}>
          {m.kind === "mutual" ? <><Sparkles size={11} /> Match!</> : "Oportunidade"}
        </span>
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-4">
        <Side title="Você oferece" cards={give} empty="—" />
        <Side title="Você recebe" cards={receive} empty="—" />
      </div>
      <div className="relative mt-5 flex items-center justify-between">
        <span className="font-mono text-[10px] text-white/35">
          {m.last_message_at ? `Última mensagem ${new Date(m.last_message_at).toLocaleDateString("pt-BR")}` : "Sem mensagens ainda"}
        </span>
        <Link href={`/mensagens/${m.id}`} className="relative flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm text-ink">
          <MessageCircle size={14} /> {m.last_message_at ? "Abrir conversa" : "Iniciar conversa"}
          {m.unread > 0 && <span className="rounded-full bg-[var(--accent)] px-1.5 font-mono text-[10px] text-[var(--on-accent)]">{m.unread}</span>}
        </Link>
      </div>
    </article>
  );
}

function Side({ title, cards, empty }: { title: string; cards: MatchSummary["cards"]; empty: string }) {
  return (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      {cards.length === 0 ? <p className="text-xs text-white/30">{empty}</p> : (
        <ul className="space-y-2">
          {cards.slice(0, 4).map((c) => (
            <li key={`${c.card_id}-${c.language}`} className="flex items-center gap-2">
              <Thumb src={c.card_image} alt={c.card_name} w={32} />
              <span className="min-w-0">
                <Link href={`/cards/${encodeURIComponent(c.card_id)}`} className="block truncate text-xs text-white hover:underline">{c.card_name}</Link>
                <span className="block truncate font-mono text-[9px] uppercase text-white/35">{c.set_name} · {c.language}</span>
              </span>
            </li>
          ))}
          {cards.length > 4 && <li className="text-[11px] text-white/40">+{cards.length - 4} carta(s)</li>}
        </ul>
      )}
    </div>
  );
}

function Discovery({ title, hint, items }: { title: string; hint: string; items: { card_id: string; card_name: string; card_image: string | null; people: number }[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-3xl border border-white/10 bg-ink-2 p-5">
      <p className="text-white">{title}</p>
      <p className="mt-1 text-[11px] text-white/40">{hint}</p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((c) => (
          <li key={c.card_id} className="flex items-center gap-2">
            <Thumb src={c.card_image} alt={c.card_name} w={36} />
            <span className="min-w-0">
              <Link href={`/cards/${encodeURIComponent(c.card_id)}`} className="block truncate text-xs text-white hover:underline">{c.card_name}</Link>
              <span className="text-[10px] text-white/40">{c.people} colecionador(es)</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
