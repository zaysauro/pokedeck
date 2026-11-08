"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Trophy, X } from "lucide-react";
import { STAT_KEYS, STAT_LABEL, TYPE_META } from "@/lib/constants";
import { dexNumber } from "@/lib/format";
import { multiplierAgainst } from "@/lib/typeChart";
import { collection, MAX_COMPARE, useCollection } from "@/hooks/useCollection";
import { useMembers, type Member } from "@/hooks/useMembers";
import { RadarChart } from "@/components/charts/RadarChart";
import { PokeImage } from "@/components/ui/PokeImage";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { PokemonPicker } from "@/components/team/PokemonPicker";

const SERIES_COLORS = ["#ff7a2f", "#3f8cff", "#4fc163", "#f39ad6"];

export function CompareView() {
  const ids = useCollection((s) => s.compare);
  const hydrated = useCollection((s) => s.hydrated);
  const { members } = useMembers(ids);
  const [picker, setPicker] = useState(false);
  const color = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length];

  const rows: { label: string; values: number[] }[] = [
    ...STAT_KEYS.map((k, i) => ({ label: STAT_LABEL[k].pt, values: members.map((m) => m.stats[i]) })),
    { label: "Total", values: members.map((m) => m.total) },
  ];

  if (!hydrated) return <div className="skeleton h-96 rounded-3xl" />;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {members.map((m, i) => (
            <motion.div
              key={m.key}
              layout
              initial={{ opacity: 0, y: 20, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative overflow-hidden rounded-2xl border p-4"
              style={{ borderColor: `${color(i)}55`, background: `linear-gradient(180deg, ${TYPE_META[m.types[0] ?? "normal"].deep}, #0d0d10)` }}
            >
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: color(i) }} />
              <button type="button" onClick={() => collection.toggleCompare(m.id)} aria-label={`Remover ${m.display}`} className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white/60 hover:text-white">
                <X size={13} />
              </button>
              <Link href={`/pokemon/${m.id}`} className="block">
                <PokeImage id={m.id} alt={m.display} className="mx-auto h-32 w-32 object-contain md:h-40 md:w-40" />
                <p className="font-mono text-[10px] text-white/40">{dexNumber(m.id)}</p>
                <p className="display text-3xl">{m.display}</p>
                <div className="mt-2 flex flex-wrap gap-1">{m.types.map((t) => <TypeBadge key={t} type={t} size="sm" />)}</div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
        {members.length < MAX_COMPARE && (
          <button
            type="button"
            onClick={() => setPicker(true)}
            className="flex min-h-[260px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-white/45 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <Plus size={22} />
            <span className="text-xs">Adicionar Pokémon</span>
            <span className="font-mono text-[10px] opacity-60">{members.length}/{MAX_COMPARE}</span>
          </button>
        )}
      </div>

      {members.length < 2 ? (
        <p className="text-center text-sm text-white/45">Selecione pelo menos dois Pokémon para comparar.</p>
      ) : (
        <>
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <RadarChart series={members.map((m, i) => ({ label: m.display, stats: m.stats, color: color(i) }))} />
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {members.map((m, i) => (
                  <span key={m.key} className="flex items-center gap-1.5 text-xs text-white/70">
                    <span className="h-2 w-2 rounded-full" style={{ background: color(i) }} /> {m.display}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              {rows.map((r) => {
                const max = Math.max(...r.values, 1);
                const top = r.values.indexOf(Math.max(...r.values));
                const scale = r.label === "Total" ? 780 : 255;
                return (
                  <div key={r.label}>
                    <p className="mb-1.5 flex justify-between text-xs text-white/55">
                      <span className={r.label === "Total" ? "uppercase tracking-wider" : ""}>{r.label}</span>
                    </p>
                    <div className="space-y-1">
                      {r.values.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: color(i), opacity: v === max ? 1 : 0.55 }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(v / scale) * 100}%` }}
                              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                          <span className="flex w-12 items-center justify-end gap-1 font-mono text-xs tabular-nums text-white/80">
                            {i === top && <Trophy size={10} className="text-gold" />} {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <TypeVersus members={members} color={color} />
        </>
      )}

      <PokemonPicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(id) => {
          collection.toggleCompare(id);
          if (ids.length + 1 >= MAX_COMPARE) setPicker(false);
        }}
        title="Comparar"
        subtitle={`Até ${MAX_COMPARE} Pokémon`}
        disabledIds={ids}
      />
    </div>
  );
}

/** Type comparison: best STAB multiplier each Pokémon lands on the others. */
function TypeVersus({ members, color }: { members: Member[]; color: (i: number) => string }) {
  const best = (atk: Member, def: Member) => Math.max(...atk.types.map((t) => multiplierAgainst(t, def.types)), 0);
  return (
    <div>
      <p className="eyebrow mb-3">Comparação de tipos — melhor multiplicador STAB (linha ataca coluna)</p>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="bg-white/[0.03]">
              <th className="px-3 py-2" />
              {members.map((m, i) => <th key={m.key} className="px-3 py-2 text-left text-xs font-normal" style={{ color: color(i) }}>{m.display}</th>)}
            </tr>
          </thead>
          <tbody>
            {members.map((a, i) => (
              <tr key={a.key} className="border-t border-white/5">
                <td className="px-3 py-2 text-xs" style={{ color: color(i) }}>{a.display}</td>
                {members.map((d) => {
                  if (a.key === d.key) return <td key={d.key} className="px-3 py-2 text-white/15">—</td>;
                  const v = best(a, d);
                  return (
                    <td key={d.key} className={`px-3 py-2 font-mono ${v > 1 ? "text-red-300" : v < 1 ? "text-emerald-300/70" : "text-white/50"}`}>
                      {v}×
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
