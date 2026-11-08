"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { dexNumber } from "@/lib/format";
import { paletteFor } from "@/lib/palette";
import type { TypeName } from "@/lib/types";
import { PokeImage } from "@/components/ui/PokeImage";
import { TypeBadge } from "@/components/ui/TypeBadge";

const FEATURED: { id: number; name: string; types: TypeName[]; line: string; stats: [string, string][] }[] = [
  { id: 6, name: "Charizard", types: ["fire", "flying"], line: "Chamas capazes de derreter rochas. Voa a 1.400 metros de altitude.", stats: [["Ataque Esp.", "109"], ["Velocidade", "100"], ["Total", "534"]] },
  { id: 94, name: "Gengar", types: ["ghost", "poison"], line: "Esconde-se nas sombras e rouba o calor de quem estiver por perto.", stats: [["Ataque Esp.", "130"], ["Velocidade", "110"], ["Total", "500"]] },
  { id: 25, name: "Pikachu", types: ["electric"], line: "Armazena eletricidade nas bochechas. O rosto mais famoso da coleção.", stats: [["Velocidade", "90"], ["Ataque", "55"], ["Total", "320"]] },
  { id: 9, name: "Blastoise", types: ["water"], line: "Canhões de água de alta pressão perfuram até aço.", stats: [["Def. Esp.", "105"], ["Defesa", "100"], ["Total", "530"]] },
  { id: 384, name: "Rayquaza", types: ["dragon", "flying"], line: "Vive na camada de ozônio e acalma os titãs da terra e do mar.", stats: [["Ataque", "150"], ["Ataque Esp.", "150"], ["Total", "680"]] },
  { id: 3, name: "Venusaur", types: ["grass", "poison"], line: "A flor em suas costas libera um aroma que acalma qualquer emoção.", stats: [["Ataque Esp.", "100"], ["Def. Esp.", "100"], ["Total", "525"]] },
  { id: 448, name: "Lucario", types: ["fighting", "steel"], line: "Lê as ondas de aura e sente os pensamentos de quem está ao redor.", stats: [["Ataque Esp.", "115"], ["Ataque", "110"], ["Total", "525"]] },
];

export function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const f = FEATURED[i];
  const p = paletteFor(f.types);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setI((n) => (n + 1) % FEATURED.length), 6500);
    return () => clearTimeout(t);
  }, [i, paused]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });
  const artX = useTransform(sx, (v) => v * 30);
  const artY = useTransform(sy, (v) => v * 20);
  const bgX = useTransform(sx, (v) => v * -50);
  const go = (d: number) => setI((n) => (n + d + FEATURED.length) % FEATURED.length);

  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel"
      aria-label="Pokémon em destaque"
    >
      {/* dynamic background */}
      <motion.div
        className="absolute inset-0 -z-20"
        animate={{ background: `radial-gradient(60% 70% at 70% 45%, ${p.primary}66 0%, transparent 60%), radial-gradient(50% 60% at 10% 100%, ${p.secondary}40 0%, transparent 70%), linear-gradient(180deg, ${p.deep} 0%, #0b0b0d 90%)` }}
        transition={{ duration: 1.2 }}
      />
      <div className="dot-grid absolute inset-0 -z-10 opacity-70 [mask-image:radial-gradient(ellipse_at_70%_45%,black,transparent_70%)]" />

      {/* giant editorial name */}
      <motion.div style={{ x: bgX }} className="pointer-events-none absolute inset-x-0 bottom-[6%] -z-10 select-none overflow-hidden whitespace-nowrap">
        <AnimatePresence mode="wait">
          <motion.span
            key={f.id}
            initial={{ y: "60%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-40%", opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="display outline-text block pl-[4vw] text-[26vw] leading-[0.8]"
          >
            {f.name}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <div className="mx-auto grid min-h-[100svh] max-w-[1440px] items-center gap-6 px-4 pb-24 pt-28 md:px-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="relative z-10 order-2 lg:order-1">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="eyebrow">
            Pokédex colecionável · Team Builder
          </motion.p>
          <h1 className="display mt-5 text-[58px] text-white sm:text-[84px] xl:text-[112px]">
            Cada Pokémon,
            <br />
            uma <em className="italic" style={{ color: p.primary }}>peça de coleção.</em>
          </h1>

          <AnimatePresence mode="wait">
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="mt-8 max-w-md border-l pl-5"
              style={{ borderColor: `${p.primary}88` }}
            >
              <p className="font-mono text-xs tracking-[0.25em] text-white/50">{dexNumber(f.id)} — {f.name.toUpperCase()}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{f.line}</p>
              <div className="mt-3 flex gap-1.5">{f.types.map((t) => <TypeBadge key={t} type={t} size="sm" />)}</div>
              <dl className="mt-4 flex gap-6">
                {f.stats.map(([k, v]) => (
                  <div key={k}>
                    <dt className="eyebrow !text-[9px]">{k}</dt>
                    <dd className="font-mono text-xl text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/pokedex" className="group flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-medium text-ink transition hover:gap-3">
              Explorar a Pokédex <ArrowRight size={16} />
            </Link>
            <Link href="/teams" className="flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm text-white transition hover:border-white/50">
              <Layers size={16} /> Montar um deck
            </Link>
          </div>
        </div>

        <div className="relative order-1 flex items-center justify-center lg:order-2">
          <motion.div
            className="absolute aspect-square w-[70%] rounded-full blur-3xl"
            animate={{ background: `radial-gradient(circle, ${p.primary}88, transparent 65%)` }}
            transition={{ duration: 1 }}
          />
          <svg className="absolute aspect-square w-[86%] animate-[spin_80s_linear_infinite] opacity-30" viewBox="0 0 200 200" aria-hidden>
            <circle cx="100" cy="100" r="98" fill="none" stroke="white" strokeWidth=".3" strokeDasharray="1 5" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="white" strokeWidth=".3" />
          </svg>
          <motion.div style={{ x: artX, y: artY }} className="relative aspect-square w-[82%] max-w-[620px]">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={f.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.7, rotate: -8, x: 120 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, rotate: 6, x: -140 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              >
                <PokeImage id={f.id} priority alt={`Arte oficial de ${f.name}`} className="float h-full w-full object-contain drop-shadow-[0_50px_50px_rgba(0,0,0,.6)]" />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* carousel controls */}
      <div className="absolute bottom-24 left-0 right-0 mx-auto flex max-w-[1440px] items-center gap-4 px-4 md:px-6 lg:bottom-10">
        <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 hover:text-white"><ChevronLeft size={16} /></button>
        <div className="flex gap-1.5">
          {FEATURED.map((x, n) => (
            <button key={x.id} type="button" onClick={() => setI(n)} aria-label={`Mostrar ${x.name}`} aria-current={n === i} className="relative h-1 w-8 overflow-hidden rounded-full bg-white/15">
              {n === i && (
                <motion.span
                  key={`${i}-${paused}`}
                  className="absolute inset-y-0 left-0 bg-white"
                  initial={{ width: paused ? "100%" : 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: paused ? 0 : 6.5, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => go(1)} aria-label="Próximo" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 hover:text-white"><ChevronRight size={16} /></button>
        <Link href={`/pokemon/${f.id}`} className="ml-auto hidden items-center gap-2 font-mono text-xs text-white/55 hover:text-white sm:flex">
          Ver ficha de {f.name} <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
