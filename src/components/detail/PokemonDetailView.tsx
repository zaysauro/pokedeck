"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowLeft, ArrowRight, Crown, Heart, Scale, Sparkle, Sparkles, Volume2 } from "lucide-react";
import { COLOR_PT, EGG_GROUP_PT, GROWTH_PT, HABITAT_PT, genMeta } from "@/lib/constants";
import { dexNumber, formatHeight, formatWeight, prettyName } from "@/lib/format";
import { paletteFor, paletteVars } from "@/lib/palette";
import type { PokemonDetail } from "@/lib/types";
import { collection, useCollection } from "@/hooks/useCollection";
import { PokeImage } from "@/components/ui/PokeImage";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { StatBars } from "@/components/charts/StatBars";
import { RadarChart } from "@/components/charts/RadarChart";
import { EvolutionChain } from "./EvolutionChain";
import { TypeMatchups } from "./TypeMatchups";
import { SpriteGallery } from "./SpriteGallery";
import { MovesTable } from "./MovesTable";
import { AddToTeamMenu } from "@/components/team/AddToTeamMenu";
import { toast } from "@/components/ui/Toast";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "stats", label: "Stats" },
  { id: "evolutions", label: "Evolutions" },
  { id: "forms", label: "Forms & Sprites" },
  { id: "moves", label: "Moves" },
] as const;
type Tab = (typeof TABS)[number]["id"];

export function PokemonDetailView({ p }: { p: PokemonDetail }) {
  const palette = paletteFor(p.types, p.color);
  const [tab, setTab] = useState<Tab>("overview");
  const shiny = useCollection((s) => s.prefs.shiny);
  const fav = useCollection((s) => s.favorites.includes(p.speciesId));
  const inCompare = useCollection((s) => s.compare.includes(p.speciesId));
  const gen = genMeta(p.generation);

  // pointer parallax on the artwork
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });
  const artX = useTransform(sx, (v) => v * 24);
  const artY = useTransform(sy, (v) => v * 18);
  const nameX = useTransform(sx, (v) => v * -40);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroFade = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const heroLift = useTransform(scrollYProgress, [0, 1], [0, -80]);

  // Propagate the Pokémon palette to the whole page (nav accents, selection…)
  useEffect(() => {
    const root = document.documentElement;
    const vars = paletteVars(palette) as Record<string, string>;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    return () => Object.keys(vars).forEach((k) => root.style.removeProperty(k));
  }, [palette]);

  const audio = useRef<HTMLAudioElement | null>(null);
  const playCry = () => {
    if (!p.cry) return;
    audio.current ??= new Audio(p.cry);
    audio.current.volume = 0.35;
    void audio.current.play().catch(() => undefined);
  };

  const art = shiny ? [p.sprites.artworkShiny, p.sprites.homeShiny] : [p.sprites.artwork, p.sprites.home];
  const isSpecies = p.id === p.speciesId;

  return (
    <div style={paletteVars(palette)}>
      {/* ---------------------------- HERO ---------------------------- */}
      <section
        ref={heroRef}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        className="relative isolate min-h-[100svh] overflow-hidden"
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(70% 60% at 65% 45%, ${palette.primary}55 0%, transparent 60%),
                         radial-gradient(50% 50% at 15% 90%, ${palette.secondary}33 0%, transparent 70%),
                         linear-gradient(180deg, ${palette.deep} 0%, #0b0b0d 85%)`,
          }}
        />
        <div className="dot-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

        {/* giant outlined name */}
        <motion.div style={{ x: nameX }} className="pointer-events-none absolute inset-x-0 top-[18%] -z-10 select-none overflow-hidden whitespace-nowrap text-center">
          <span className="display outline-text text-[22vw] leading-none">{p.display}</span>
        </motion.div>

        <motion.div style={{ opacity: heroFade, y: heroLift }} className="mx-auto grid min-h-[100svh] max-w-[1440px] items-center gap-8 px-4 pb-16 pt-28 md:px-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="order-2 lg:order-1">
            <Link href="/pokedex" className="eyebrow inline-flex items-center gap-2 hover:text-white">
              <ArrowLeft size={12} /> Pokédex
            </Link>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-mono text-sm tracking-[0.3em] text-white/60">
              {dexNumber(p.speciesId)} · GEN {gen.roman} · {gen.region.toUpperCase()}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="display mt-3 text-[64px] text-white sm:text-[96px] xl:text-[132px]"
            >
              {p.display}
            </motion.h1>
            <p className="mt-2 text-sm text-white/55">
              {p.genus && <span className="italic">{p.genus}</span>}
              {p.genus && " · "}Nome original: <span className="text-white/80">{prettyName(p.name)}</span>
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {p.types.map((t) => <TypeBadge key={t} type={t} size="lg" />)}
              {p.legendary && <span className="flex h-8 items-center gap-1.5 rounded-[4px] border border-gold/40 px-3 font-mono text-xs uppercase text-gold"><Crown size={13} /> Lendário</span>}
              {p.mythical && <span className="flex h-8 items-center gap-1.5 rounded-[4px] border border-gold/40 px-3 font-mono text-xs uppercase text-gold"><Sparkle size={13} /> Mítico</span>}
            </div>

            <dl className="mt-8 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
              {[
                ["Altura", formatHeight(p.height)],
                ["Peso", formatWeight(p.weight)],
                ["Total", String(p.stats.reduce((a, b) => a + b, 0))],
              ].map(([k, v]) => (
                <div key={k} className="bg-ink/70 px-4 py-3 backdrop-blur">
                  <dt className="eyebrow">{k}</dt>
                  <dd className="mt-1 font-mono text-lg text-white">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-2">
              <AddToTeamMenu pokemonId={p.speciesId} name={p.display} />
              <button
                type="button"
                onClick={() => {
                  collection.toggleFavorite(p.speciesId);
                  toast(fav ? `${p.display} saiu dos favoritos` : `${p.display} adicionado aos favoritos`);
                }}
                aria-pressed={fav}
                className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition ${fav ? "border-[#ff4d6d] bg-[#ff4d6d]/15 text-[#ff8fa3]" : "border-white/15 text-white/80 hover:border-white/40"}`}
              >
                <Heart size={15} fill={fav ? "currentColor" : "none"} /> {fav ? "Favorito" : "Favoritar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  collection.toggleCompare(p.speciesId);
                  toast(inCompare ? "Removido da comparação" : "Adicionado à comparação");
                }}
                aria-pressed={inCompare}
                className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition ${inCompare ? "border-white bg-white text-ink" : "border-white/15 text-white/80 hover:border-white/40"}`}
              >
                <Scale size={15} /> {inCompare ? "Na comparação" : "Comparar"}
              </button>
              <button type="button" onClick={() => collection.setPrefs({ shiny: !shiny })} aria-pressed={shiny} title="Alternar Shiny" className={`grid h-11 w-11 place-items-center rounded-full border transition ${shiny ? "border-gold/60 bg-gold/15 text-gold" : "border-white/15 text-white/70 hover:text-white"}`}>
                <Sparkles size={16} />
              </button>
              {p.cry && (
                <button type="button" onClick={playCry} title="Ouvir o grito" className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 hover:text-white">
                  <Volume2 size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="relative order-1 flex items-center justify-center lg:order-2">
            <motion.div
              className="absolute aspect-square w-[78%] rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${palette.primary}66, transparent 65%)` }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <svg className="absolute aspect-square w-[88%] animate-[spin_60s_linear_infinite] opacity-25" viewBox="0 0 200 200" aria-hidden>
              <circle cx="100" cy="100" r="96" fill="none" stroke="white" strokeWidth=".4" strokeDasharray="2 6" />
              <circle cx="100" cy="100" r="80" fill="none" stroke={palette.secondary} strokeWidth=".6" />
            </svg>
            <motion.div style={{ x: artX, y: artY }} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="relative w-[78%] max-w-[560px]">
              <PokeImage
                key={`${p.id}-${shiny}`}
                id={p.id}
                shiny={shiny}
                sources={art}
                priority
                alt={`Arte oficial de ${p.display}`}
                className="float aspect-square w-full object-contain drop-shadow-[0_40px_40px_rgba(0,0,0,.55)]"
              />
            </motion.div>
          </div>
        </motion.div>

        {isSpecies && (
          <div className="absolute inset-x-0 bottom-6 mx-auto flex max-w-[1440px] justify-between px-4 md:px-6">
            {p.speciesId > 1 ? (
              <Link href={`/pokemon/${p.speciesId - 1}`} className="flex items-center gap-2 font-mono text-xs text-white/45 hover:text-white">
                <ArrowLeft size={14} /> {dexNumber(p.speciesId - 1)}
              </Link>
            ) : <span />}
            <Link href={`/pokemon/${p.speciesId + 1}`} className="flex items-center gap-2 font-mono text-xs text-white/45 hover:text-white">
              {dexNumber(p.speciesId + 1)} <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>

      {/* ---------------------------- TABS ---------------------------- */}
      <div className="sticky top-[76px] z-30 border-y border-white/10 bg-ink/85 backdrop-blur-xl">
        <div role="tablist" aria-label="Seções da ficha" className="no-scrollbar mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 md:px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 px-4 py-4 text-sm transition ${tab === t.id ? "text-white" : "text-white/45 hover:text-white/80"}`}
            >
              {t.label}
              {tab === t.id && <motion.span layoutId="tab-underline" className="absolute inset-x-3 bottom-0 h-0.5 bg-[var(--accent)]" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-14 md:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            role="tabpanel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "overview" && <Overview p={p} />}
            {tab === "stats" && (
              <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <h2 className="display mb-8 text-5xl">Status base</h2>
                  <StatBars stats={p.stats} color={palette.primary} />
                </div>
                <div className="flex justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                  <RadarChart series={[{ label: p.display, stats: p.stats, color: palette.primary }]} />
                </div>
              </div>
            )}
            {tab === "evolutions" && (
              <div>
                <h2 className="display mb-10 text-5xl">Cadeia evolutiva</h2>
                {p.evolution ? <EvolutionChain root={p.evolution} currentId={p.speciesId} /> : <p className="text-white/50">Sem dados de evolução.</p>}
              </div>
            )}
            {tab === "forms" && <SpriteGallery p={p} />}
            {tab === "moves" && (
              <div>
                <h2 className="display mb-8 text-5xl">Golpes</h2>
                <MovesTable moves={p.moves} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Overview({ p }: { p: PokemonDetail }) {
  const female = p.genderRate >= 0 ? (p.genderRate / 8) * 100 : null;
  const facts: [string, React.ReactNode][] = [
    ["Experiência base", p.baseExperience ?? "—"],
    ["Taxa de captura", p.captureRate != null ? `${p.captureRate} / 255` : "—"],
    ["Felicidade base", p.baseHappiness ?? "—"],
    ["Crescimento", p.growthRate ? GROWTH_PT[p.growthRate] ?? prettyName(p.growthRate) : "—"],
    ["Grupos de ovo", p.eggGroups.map((e) => EGG_GROUP_PT[e] ?? prettyName(e)).join(", ") || "—"],
    ["Habitat", p.habitat ? HABITAT_PT[p.habitat] ?? prettyName(p.habitat) : "—"],
    ["Cor", p.color ? COLOR_PT[p.color] ?? p.color : "—"],
    ["Geração", `${genMeta(p.generation).roman} — ${genMeta(p.generation).region}`],
  ];
  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-10">
        <section>
          <p className="eyebrow mb-4">Registro da Pokédex</p>
          {p.flavor ? (
            <>
              <blockquote className="display text-3xl leading-[1.15] text-white/90 md:text-4xl">“{p.flavor.text}”</blockquote>
              <p className="mt-3 text-xs text-white/40">
                Pokémon {prettyName(p.flavor.version)}
                {p.flavor.lang !== "pt" && ` · descrição em ${p.flavor.lang === "es" ? "espanhol" : "inglês"} (sem tradução oficial em pt-BR na PokéAPI)`}
              </p>
            </>
          ) : (
            <p className="text-white/50">Sem descrição disponível.</p>
          )}
        </section>

        <section>
          <p className="eyebrow mb-4">Habilidades</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {p.abilities.map((a) => (
              <div key={a.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <span className="text-white">{prettyName(a.name)}</span>
                {a.hidden && <span className="rounded bg-[var(--accent)]/15 px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--accent)]">Oculta</span>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="eyebrow mb-4">Gênero</p>
          {female === null ? (
            <p className="text-sm text-white/60">Sem gênero</p>
          ) : (
            <div>
              <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
                <div className="bg-sky-400" style={{ width: `${100 - female}%` }} />
                <div className="bg-pink-400" style={{ width: `${female}%` }} />
              </div>
              <div className="mt-2 flex justify-between font-mono text-xs text-white/55">
                <span>♂ {(100 - female).toLocaleString("pt-BR")}%</span>
                <span>♀ {female.toLocaleString("pt-BR")}%</span>
              </div>
            </div>
          )}
        </section>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
          {facts.map(([k, v]) => (
            <div key={k} className="bg-ink px-4 py-4">
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1.5 text-sm text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section>
        <p className="eyebrow mb-4">Fraquezas & resistências</p>
        <TypeMatchups types={p.types} />
      </section>
    </div>
  );
}
