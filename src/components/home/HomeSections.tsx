"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Crown, Sparkle } from "lucide-react";
import { GENERATIONS, POPULAR_IDS, TYPES, TYPE_META } from "@/lib/constants";
import { dexNumber } from "@/lib/format";
import { PRESET_DECKS } from "@/lib/presets";
import { usePokedex } from "@/hooks/usePokedex";
import { useMembers } from "@/hooks/useMembers";
import { FanDeck } from "@/components/deck/FanDeck";
import { DeckCard } from "@/components/deck/DeckCard";
import { CardSkeleton, PokeCard } from "@/components/cards/PokeCard";
import { PokeImage } from "@/components/ui/PokeImage";
import { TypeIcon } from "@/components/ui/TypeIcon";
import { TypeBadge } from "@/components/ui/TypeBadge";

const reveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
};

function SectionTitle({ eyebrow, title, italic, href, cta }: { eyebrow: string; title: string; italic: string; href?: string; cta?: string }) {
  return (
    <motion.div {...reveal} className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display mt-3 text-[48px] md:text-[80px]">
          {title} <em className="italic text-[var(--accent)]">{italic}</em>
        </h2>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
          {cta} <ArrowRight size={14} />
        </Link>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

export function Ticker() {
  const row = [...TYPES, ...TYPES];
  return (
    <div className="overflow-hidden border-y border-white/10 bg-ink-2 py-4" aria-hidden>
      <div className="marquee flex w-max gap-10">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-white/45">
            <span style={{ color: TYPE_META[t].color }}><TypeIcon type={t} size={14} /></span> {TYPE_META[t].pt}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PopularFan() {
  const { members } = useMembers(POPULAR_IDS.slice(0, 7));
  const [sel, setSel] = useState<number | null>(null);
  const s = sel !== null ? members[sel] : null;
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-28 md:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.4fr]">
        <motion.div {...reveal}>
          <p className="eyebrow">Mais populares</p>
          <h2 className="display mt-3 text-[48px] md:text-[80px]">
            Abra o <em className="italic text-[var(--accent)]">leque.</em>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            Os favoritos da comunidade, apresentados como uma mão de cartas. Passe o mouse para separar, clique para trazer uma ao centro.
          </p>
          <div className="mt-6 min-h-[120px]">
            {s ? (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <p className="font-mono text-xs text-white/40">{dexNumber(s.id)}</p>
                <p className="display text-4xl">{s.display}</p>
                <div className="mt-2 flex gap-1">{s.types.map((t) => <TypeBadge key={t} type={t} size="sm" />)}</div>
                <Link href={`/pokemon/${s.id}`} className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--accent)]">Abrir ficha <ArrowRight size={14} /></Link>
              </motion.div>
            ) : (
              <p className="font-mono text-xs text-white/30">← selecione uma carta</p>
            )}
          </div>
        </motion.div>
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.15 }}>
          <FanDeck members={members} selected={sel} onSelect={setSel} size="lg" />
        </motion.div>
      </div>
    </section>
  );
}

export function TypeExplorer() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-20 md:px-6">
      <SectionTitle eyebrow="Explore a Pokédex" title="Dezoito" italic="elementos." href="/pokedex" cta="Ver a Pokédex completa" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {TYPES.map((t, i) => {
          const m = TYPE_META[t];
          return (
            <motion.div key={t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05 }}>
              <Link
                href={`/pokedex?type=${t}`}
                className="group relative flex h-28 flex-col justify-between overflow-hidden rounded-xl border border-white/10 p-4 transition-colors hover:border-transparent"
                style={{ background: `linear-gradient(140deg, ${m.deep}, #0d0d10)` }}
              >
                <span className="absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-y-100" style={{ background: m.color }} />
                <span className="relative transition-colors group-hover:text-ink" style={{ color: m.color }}>
                  <TypeIcon type={t} size={20} className="transition-colors group-hover:text-ink" />
                </span>
                <span className="display relative text-2xl text-white transition-colors group-hover:text-ink">{m.pt}</span>
                <TypeIcon type={t} size={90} className="absolute -bottom-5 -right-4 text-white/[0.04] transition-transform duration-700 group-hover:rotate-12" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/** Vertical scroll drives a horizontal track of generation panels. */
export function Generations() {
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setDist(Math.max(0, el.scrollWidth - window.innerWidth + 48));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -dist]);
  return (
    <section ref={ref} className="relative h-[320vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6">
          <p className="eyebrow">Destaques por geração</p>
          <h2 className="display mt-3 text-[48px] md:text-[80px]">
            Nove regiões, <em className="italic text-[var(--accent)]">uma jornada.</em>
          </h2>
        </div>
        <motion.div ref={track} style={{ x }} className="mt-10 flex w-max gap-5 pl-4 md:pl-[max(24px,calc((100vw-1440px)/2+24px))]">
          {GENERATIONS.map((g) => (
            <Link
              key={g.id}
              href={`/pokedex?gen=${g.id}`}
              className="group relative flex h-[52vh] min-h-[340px] w-[78vw] shrink-0 flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-ink-2 p-6 sm:w-[46vw] lg:w-[30vw]"
            >
              <div className="flex items-start justify-between">
                <span className="display text-[120px] leading-none text-white/[0.06]">{g.roman}</span>
                <span className="font-mono text-[10px] text-white/40">#{g.range[0]}—{g.range[1]}</span>
              </div>
              <div className="absolute inset-x-0 top-[22%] flex justify-center -space-x-8">
                {g.starters.map((id, k) => (
                  <PokeImage
                    key={id}
                    id={id}
                    alt=""
                    className="h-32 w-32 object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,.6)] transition-transform duration-700 group-hover:-translate-y-3 md:h-40 md:w-40"
                    style={{ transitionDelay: `${k * 60}ms` }}
                  />
                ))}
              </div>
              <div>
                <p className="eyebrow">Geração {g.roman}</p>
                <p className="display mt-1 text-5xl">{g.region}</p>
                <p className="mt-2 flex items-center gap-2 text-xs text-white/50 transition group-hover:text-white">
                  {g.range[1] - g.range[0] + 1} espécies <ArrowRight size={12} />
                </p>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/** Light "paper" editorial surface for legendaries & mythicals. */
export function Legends() {
  const { entries, loading } = usePokedex();
  const picks = useMemo(() => {
    const leg = entries.filter((e) => e.legendary || e.mythical);
    const preferred = [150, 249, 384, 483, 487, 151, 493, 644, 716, 800, 888, 1007];
    const chosen = preferred.map((id) => leg.find((e) => e.id === id)).filter(Boolean) as typeof leg;
    return chosen.length >= 8 ? chosen.slice(0, 8) : leg.slice(0, 8);
  }, [entries]);
  const count = entries.filter((e) => e.legendary).length;
  const myth = entries.filter((e) => e.mythical).length;

  return (
    <section className="relative bg-paper text-paper-ink">
      <div className="mx-auto max-w-[1440px] px-4 py-28 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <motion.div {...reveal} className="lg:sticky lg:top-32 lg:self-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper-ink/50">Lendários & míticos</p>
            <h2 className="display mt-3 text-[56px] text-paper-ink md:text-[96px]">
              Raros <em className="italic">por natureza.</em>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper-ink/65">
              Criaturas de mitos e lendas — guardiões do tempo, do espaço e dos oceanos. A peça mais disputada de qualquer coleção.
            </p>
            <div className="mt-8 flex gap-10">
              <div><p className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-paper-ink/50"><Crown size={12} /> Lendários</p><p className="display text-6xl">{count || "—"}</p></div>
              <div><p className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-paper-ink/50"><Sparkle size={12} /> Míticos</p><p className="display text-6xl">{myth || "—"}</p></div>
            </div>
            <Link href="/pokedex?special=both" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-paper-ink px-5 text-sm text-paper">
              Ver todos <ArrowRight size={14} />
            </Link>
          </motion.div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {loading
              ? Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)
              : picks.map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 60, rotate: i % 2 ? 3 : -3 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.8, delay: (i % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }} className={i % 4 === 1 || i % 4 === 3 ? "md:translate-y-12" : ""}>
                    <PokeCard data={e} href={`/pokemon/${e.id}`} />
                  </motion.div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function RecentlyAdded() {
  const { entries, loading } = usePokedex();
  const latest = useMemo(() => [...entries].sort((a, b) => b.id - a.id).slice(0, 12), [entries]);
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-28 md:px-6">
      <SectionTitle eyebrow="Recém-adicionados à Pokédex" title="Os mais" italic="novos." href="/pokedex?sort=id&dir=desc" cta="Ordenar por mais recentes" />
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="w-52 shrink-0"><CardSkeleton /></div>)
          : latest.map((e, i) => (
              <motion.div key={e.id} className="w-52 shrink-0 snap-start" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                <PokeCard data={e} href={`/pokemon/${e.id}`} />
              </motion.div>
            ))}
      </div>
    </section>
  );
}

export function PopularDecks() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-20 md:px-6">
      <SectionTitle eyebrow="Coleções curadas" title="Decks" italic="populares." href="/teams" cta="Ver todos os decks" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {PRESET_DECKS.slice(0, 3).map((d, i) => (
          <DeckCard key={d.slug} index={i} name={d.name} description={d.description} members={d.members} coverId={d.coverId} href="/teams" />
        ))}
      </div>
    </section>
  );
}

export function BuilderCta() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-20 md:px-6">
      <motion.div {...reveal} className="relative overflow-hidden rounded-[32px] border border-white/10 px-6 py-20 text-center md:py-28" style={{ background: "radial-gradient(60% 80% at 50% 120%, var(--accent), transparent 70%), #111114" }}>
        <div className="dot-grid absolute inset-0 opacity-50" />
        <p className="eyebrow relative">Team Builder</p>
        <h2 className="display relative mx-auto mt-4 max-w-4xl text-[52px] md:text-[104px]">
          Seis cartas. <em className="italic">Uma estratégia.</em>
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-sm text-white/65">
          Monte decks, descubra fraquezas compartilhadas, cobertura de tipos e equilíbrio de atributos — tudo salvo no seu navegador.
        </p>
        <Link href="/teams" className="relative mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-ink">
          Começar a montar <ArrowRight size={16} />
        </Link>
      </motion.div>
    </section>
  );
}
