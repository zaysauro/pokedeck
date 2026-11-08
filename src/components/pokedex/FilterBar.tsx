"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownUp, Crown, Search, SlidersHorizontal, Sparkle, X } from "lucide-react";
import { GENERATIONS, REGIONAL_PT, TYPES, TYPE_META } from "@/lib/constants";
import { DEFAULT_FILTERS, SORT_OPTIONS, type Filters } from "@/lib/filters";
import type { TypeName } from "@/lib/types";
import { TypeIcon } from "@/components/ui/TypeIcon";

interface Props {
  value: Filters;
  onChange: (f: Filters) => void;
  count: number;
  total: number;
  compact?: boolean;
}

export function FilterBar({ value: f, onChange, count, total, compact }: Props) {
  const [open, setOpen] = useState(!compact);
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch });
  const toggleType = (t: TypeName) => set({ types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t].slice(-2) });
  const toggleGen = (g: number) => set({ gens: f.gens.includes(g) ? f.gens.filter((x) => x !== g) : [...f.gens, g] });
  const active = f.types.length + f.gens.length + (f.regional ? 1 : 0) + (f.special !== "all" ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-11 min-w-0 flex-1 basis-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 focus-within:border-white/30 sm:basis-auto">
          <Search size={16} className="shrink-0 text-white/40" />
          <input
            value={f.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Buscar por nome ou número"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            aria-label="Buscar por nome ou número"
          />
          {f.q && (
            <button type="button" onClick={() => set({ q: "" })} aria-label="Limpar busca" className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          )}
        </label>
        <div className="flex h-11 items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] pl-3 pr-1">
          <ArrowDownUp size={14} className="text-white/40" />
          <select
            value={f.sort}
            onChange={(e) => set({ sort: e.target.value as Filters["sort"] })}
            className="h-full bg-transparent pr-1 text-sm text-white outline-none [&>option]:bg-ink-2"
            aria-label="Ordenar por"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => set({ dir: f.dir === "asc" ? "desc" : "asc" })}
            className="h-9 rounded-full px-3 font-mono text-[11px] uppercase text-white/70 hover:bg-white/10"
            aria-label="Inverter ordem"
          >
            {f.dir === "asc" ? "Asc" : "Desc"}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition ${open ? "border-white/30 bg-white/10 text-white" : "border-white/10 text-white/70 hover:text-white"}`}
        >
          <SlidersHorizontal size={15} /> Filtros
          {active > 0 && <span className="rounded-full bg-[var(--accent)] px-1.5 font-mono text-[10px] text-[var(--on-accent)]">{active}</span>}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <Group label="Tipo" hint="até 2 — combina ambos">
                {TYPES.map((t) => {
                  const on = f.types.includes(t);
                  const m = TYPE_META[t];
                  return (
                    <motion.button
                      key={t}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => toggleType(t)}
                      aria-pressed={on}
                      className="flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors"
                      style={on ? { background: m.color, color: "#0c0c0c" } : { background: "rgb(255 255 255 / .04)", color: m.light, boxShadow: `inset 0 0 0 1px ${m.color}33` }}
                    >
                      <TypeIcon type={t} size={12} /> {m.pt}
                    </motion.button>
                  );
                })}
              </Group>
              <Group label="Geração · Região">
                {GENERATIONS.map((g) => {
                  const on = f.gens.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGen(g.id)}
                      aria-pressed={on}
                      className={`flex h-8 items-center gap-2 rounded-[6px] px-2.5 text-xs transition ${on ? "bg-white text-ink" : "bg-white/[0.04] text-white/70 hover:text-white"}`}
                    >
                      <span className="font-mono text-[10px] opacity-60">{g.roman}</span> {g.region}
                    </button>
                  );
                })}
              </Group>
              <div className="flex flex-wrap gap-6">
                <Group label="Raridade">
                  {([
                    ["all", "Todos", null],
                    ["legendary", "Lendários", Crown],
                    ["mythical", "Míticos", Sparkle],
                    ["both", "Lendários + Míticos", null],
                  ] as const).map(([k, label, Icon]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => set({ special: k })}
                      aria-pressed={f.special === k}
                      className={`flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-xs transition ${f.special === k ? "bg-gold text-ink" : "bg-white/[0.04] text-white/70 hover:text-white"}`}
                    >
                      {Icon && <Icon size={12} />} {label}
                    </button>
                  ))}
                </Group>
                <Group label="Formas regionais">
                  {[null, "any", ...Object.keys(REGIONAL_PT)].map((r) => (
                    <button
                      key={r ?? "none"}
                      type="button"
                      onClick={() => set({ regional: r })}
                      aria-pressed={f.regional === r}
                      className={`flex h-8 items-center rounded-[6px] px-2.5 text-xs transition ${f.regional === r ? "bg-white text-ink" : "bg-white/[0.04] text-white/70 hover:text-white"}`}
                    >
                      {r === null ? "Indiferente" : r === "any" ? "Qualquer" : REGIONAL_PT[r]}
                    </button>
                  ))}
                </Group>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between text-xs text-white/45">
        <span className="font-mono">
          <span className="text-white">{count.toLocaleString("pt-BR")}</span> de {total.toLocaleString("pt-BR")} espécies
        </span>
        {(active > 0 || f.q) && (
          <button type="button" onClick={() => onChange({ ...DEFAULT_FILTERS, sort: f.sort, dir: f.dir })} className="flex items-center gap-1 hover:text-white">
            <X size={12} /> Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="eyebrow">{label}</span>
        {hint && <span className="text-[10px] text-white/30">{hint}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
