"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Crown } from "lucide-react";
import { DEFAULT_TCG_FILTERS, SPECIAL_RARITIES, assetPng, rarityTier } from "@/lib/tcg/constants";
import type { TcgCard, TcgCardBrief, TcgSearchResult, TcgSetInfo } from "@/lib/tcg/types";
import { useTcgSearch } from "@/hooks/useTcgSearch";
import { FanDeck } from "@/components/deck/FanDeck";
import { TcgCardTile, TcgTileSkeleton } from "./TcgCardTile";
import { TcgImage } from "./TcgImage";
import { CardQuickView } from "./CardQuickView";
import { RarityBadge } from "./CardInfo";

const toBrief = (c: TcgCard): TcgCardBrief => ({
  id: c.id, localId: c.localId, name: c.name, image: c.image, setId: c.set.id, setName: c.set.name, serieId: null,
});

const reveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
};

/* ------------------------------------------------------------------ */
/* Hero with the popular cards held as a fan                           */
/* ------------------------------------------------------------------ */

export function TcgHero({ popular, totalCards }: { popular: TcgCard[]; totalCards: number | null }) {
  const [sel, setSel] = useState<number | null>(null);
  const [quick, setQuick] = useState<TcgCardBrief | null>(null);
  const close = useCallback(() => setQuick(null), []);
  const fan = popular.slice(0, 7);
  const s = sel !== null ? fan[sel] : null;

  return (
    <section className="relative isolate overflow-hidden pb-10 pt-28 md:pt-36">
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 55% at 70% 45%, rgb(217 181 106 / .16), transparent 65%), radial-gradient(45% 50% at 15% 80%, rgb(255 122 47 / .14), transparent 70%)" }} />
      <div className="dot-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_60%_40%,black,transparent_70%)]" />
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 md:px-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eyebrow">
            Pokémon Estampas Ilustradas · TCG
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="display mt-4 text-[64px] text-white md:text-[104px] xl:text-[128px]">
            Cartas <em className="italic text-gold">Reais</em>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 max-w-md text-base leading-relaxed text-white/60">
            Explore o universo Pokémon TCG: {totalCards ? `${totalCards.toLocaleString("pt-BR")} cartas oficiais` : "cartas oficiais"} lançadas no Brasil,
            de Black &amp; White a Megaevolução — com ilustrações, raridades, ataques e artistas.
          </motion.p>
          <div className="mt-8 min-h-[150px]">
            <AnimatePresence mode="wait">
              {s ? (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <p className="font-mono text-xs text-white/40">{s.set.name} · {s.localId}</p>
                  <p className="display mt-1 text-4xl">{s.name}</p>
                  <div className="mt-2"><RarityBadge rarity={s.rarity} /></div>
                  <button type="button" onClick={() => setQuick(toBrief(s))} className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--accent)]">
                    Examinar carta <ArrowRight size={14} />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-3">
                  <a href="#explorar" className="flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-ink transition hover:gap-3">
                    Pesquisar cartas <ArrowRight size={16} />
                  </a>
                  <a href="#especiais" className="flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm text-white transition hover:border-white/50">
                    <Crown size={15} className="text-gold" /> Cartas especiais
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {fan.length > 0 && (
          <div>
            <p className="eyebrow mb-2 text-center lg:text-left">Populares entre colecionadores</p>
            <FanDeck
              members={fan.map((c, i) => ({ key: c.id, id: i, display: c.name, types: [] }))}
              selected={sel}
              onSelect={setSel}
              size="lg"
              renderCard={(m, i, select) => {
                const c = fan[i];
                return (
                  <button type="button" onClick={select} aria-label={`Selecionar ${c.name}`} className="block w-full">
                    <div data-tier={rarityTier(c.rarity)} className="tcg-card relative rounded-[4.5%]">
                      <TcgImage base={c.image} alt={c.name} size="low" priority={i < 4} />
                      {rarityTier(c.rarity) >= 2 && <div className="pcard-glare tcg-foil tcg-foil-idle rounded-[4.5%]" />}
                    </div>
                  </button>
                );
              }}
            />
          </div>
        )}
      </div>
      <CardQuickView card={quick} onClose={close} />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Special rarities                                                    */
/* ------------------------------------------------------------------ */

export function SpecialCards({ initial }: { initial: TcgSearchResult | null }) {
  const [rarity, setRarity] = useState(SPECIAL_RARITIES[0]);
  const filters = { ...DEFAULT_TCG_FILTERS, rarity };
  const { data, loading, error, retry } = useTcgSearch(filters, rarity === SPECIAL_RARITIES[0] ? initial : null, 12);
  const [quick, setQuick] = useState<TcgCardBrief | null>(null);
  const close = useCallback(() => setQuick(null), []);
  const tier = rarityTier(rarity);

  return (
    <section id="especiais" className="relative scroll-mt-24 overflow-hidden border-y border-white/10 bg-[#0e0d0b] py-24">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 60% at 50% 0%, rgb(217 181 106 / .14), transparent 70%)" }} />
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-6">
        <motion.div {...reveal} className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow !text-gold/80">Raras e especiais</p>
            <h2 className="display mt-3 text-[48px] md:text-[80px]">
              Arte que vale <em className="italic text-gold">o pacote.</em>
            </h2>
            <p className="mt-3 max-w-lg text-sm text-white/55">
              As raridades mais disputadas, com a classificação exatamente como impressa na fonte oficial de dados.
            </p>
          </div>
          <Link href={`/cards?rarity=${encodeURIComponent(rarity)}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
            Ver todas de “{rarity}” <ArrowUpRight size={14} />
          </Link>
        </motion.div>

        <div role="tablist" aria-label="Raridades especiais" className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4">
          {SPECIAL_RARITIES.map((r) => (
            <button
              key={r}
              role="tab"
              type="button"
              aria-selected={rarity === r}
              onClick={() => setRarity(r)}
              className={`relative h-10 shrink-0 rounded-full px-4 text-sm transition ${rarity === r ? "text-ink" : "border border-white/10 text-white/60 hover:text-white"}`}
            >
              {rarity === r && <motion.span layoutId="rarity-tab" className="absolute inset-0 rounded-full bg-gold" />}
              <span className="relative">{r}</span>
            </button>
          ))}
        </div>

        <div className="no-scrollbar -mx-4 mt-8 flex snap-x gap-5 overflow-x-auto px-4 pb-6 md:-mx-6 md:px-6">
          {error ? (
            <div className="py-10 text-sm text-white/50">{error} <button type="button" onClick={retry} className="ml-2 underline">Tentar novamente</button></div>
          ) : loading && !data ? (
            Array.from({ length: 6 }, (_, i) => <div key={i} className="w-56 shrink-0 md:w-64"><TcgTileSkeleton /></div>)
          ) : (
            (data?.cards ?? []).map((c, i) => (
              <motion.div key={`${rarity}-${c.id}`} className="w-56 shrink-0 snap-start md:w-64" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <TcgCardTile card={c} tier={tier} onOpen={setQuick} size="lg" />
              </motion.div>
            ))
          )}
        </div>
      </div>
      <CardQuickView card={quick} onClose={close} />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Recent expansions                                                   */
/* ------------------------------------------------------------------ */

export function RecentSets({ sets }: { sets: TcgSetInfo[] }) {
  if (!sets.length) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-24 md:px-6">
      <motion.div {...reveal} className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Expansões recentes</p>
          <h2 className="display mt-3 text-[48px] md:text-[80px]">
            Recém-saídas <em className="italic text-[var(--accent)]">do booster.</em>
          </h2>
        </div>
      </motion.div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sets.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.06 }}>
            <Link
              href={`/cards/sets/${encodeURIComponent(s.id)}`}
              className="group relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-ink-2 p-5 transition hover:border-white/30"
            >
              <span className="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_45%,rgb(255_255_255/.06),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex h-20 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetPng(s.logo) ?? ""} alt={s.name} loading="lazy" className="max-h-full max-w-[85%] object-contain transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="relative flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{s.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">{s.serieName}</p>
                </div>
                <span className="shrink-0 font-mono text-xs text-white/50">{s.official ?? "—"} cartas</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

