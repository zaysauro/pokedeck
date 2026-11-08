"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { prettyName } from "@/lib/format";
import type { PokemonDetail } from "@/lib/types";
import { PokeImage } from "@/components/ui/PokeImage";

const GEN_PT: Record<string, string> = {
  "generation-i": "Geração I", "generation-ii": "Geração II", "generation-iii": "Geração III",
  "generation-iv": "Geração IV", "generation-v": "Geração V", "generation-vi": "Geração VI",
  "generation-vii": "Geração VII", "generation-viii": "Geração VIII", "generation-ix": "Geração IX",
};

export function SpriteGallery({ p }: { p: PokemonDetail }) {
  const [shiny, setShiny] = useState(false);
  const s = p.sprites;
  const art = [
    { label: "Official Artwork", src: shiny ? s.artworkShiny : s.artwork },
    { label: "Pokémon HOME", src: shiny ? s.homeShiny : s.home },
    { label: "Showdown (animado)", src: shiny ? s.showdownShiny : s.showdown, pixel: true },
    { label: "Dream World", src: shiny ? null : s.dream },
    { label: "Sprite — frente", src: shiny ? s.frontShiny : s.front, pixel: true },
    { label: "Sprite — costas", src: shiny ? s.backShiny : s.back, pixel: true },
  ].filter((x) => x.src);

  const byGen = useMemo(() => {
    const m = new Map<string, typeof p.versions>();
    for (const v of p.versions) m.set(v.generation, [...(m.get(v.generation) ?? []), v]);
    return [...m.entries()];
  }, [p]);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Artes & sprites</p>
        <div className="flex rounded-full border border-white/10 p-1 text-xs">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setShiny(v)}
              className={`relative rounded-full px-4 py-1.5 ${shiny === v ? "text-ink" : "text-white/60"}`}
            >
              {shiny === v && <motion.span layoutId="shiny-toggle" className="absolute inset-0 rounded-full bg-white" />}
              <span className="relative">{v ? "Shiny ✦" : "Normal"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {art.map((a, i) => (
          <motion.figure
            key={a.label + shiny}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.02] p-3"
          >
            <div className="flex aspect-square w-full items-center justify-center">
              <PokeImage id={p.id} sources={[a.src]} alt={a.label} className={`max-h-full max-w-full object-contain ${a.pixel ? "w-2/3 [image-rendering:pixelated]" : ""}`} />
            </div>
            <figcaption className="mt-2 text-center text-[11px] text-white/50">{a.label}</figcaption>
          </motion.figure>
        ))}
      </div>

      {p.varieties.length > 1 && (
        <div>
          <p className="eyebrow mb-4">Formas alternativas</p>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {p.varieties.map((v) => (
              <Link
                key={v.id}
                href={`/pokemon/${v.id}`}
                className={`flex w-36 shrink-0 flex-col items-center rounded-xl border p-3 transition hover:border-white/30 ${v.id === p.id ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-white/10 bg-white/[0.02]"}`}
              >
                <PokeImage id={v.id} shiny={shiny} alt={v.name} className="h-24 w-24 object-contain" />
                <span className="mt-2 text-center text-xs text-white/80">{prettyName(v.name)}</span>
                {v.isDefault && <span className="mt-1 font-mono text-[9px] uppercase text-white/35">Padrão</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {byGen.length > 0 && (
        <div className="space-y-6">
          <p className="eyebrow">Sprites históricos por jogo</p>
          {byGen.map(([gen, list]) => (
            <div key={gen}>
              <p className="mb-2 font-mono text-[11px] text-white/40">{GEN_PT[gen] ?? gen}</p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {list.map((v) => {
                  const src = shiny ? v.shiny ?? v.front : v.front;
                  if (!src) return null;
                  return (
                    <figure key={v.game} className="flex w-28 shrink-0 flex-col items-center rounded-lg bg-white/[0.03] p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={v.game} loading="lazy" className="h-20 w-20 object-contain [image-rendering:pixelated]" />
                      <figcaption className="mt-1 text-center text-[10px] leading-tight text-white/45">{prettyName(v.game)}</figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
