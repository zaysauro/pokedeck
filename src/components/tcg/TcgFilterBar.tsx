"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownUp, ImageOff, Search, SlidersHorizontal, X } from "lucide-react";
import { SORT_OPTIONS, tcgTypeColor } from "@/lib/tcg/constants";
import { activeFilterCount } from "@/lib/tcg/query";
import type { TcgFilters, TcgMeta } from "@/lib/tcg/types";
import { Energy } from "./Energy";

interface Props {
  value: TcgFilters;
  onChange: (patch: Partial<TcgFilters>) => void;
  onReset: () => void;
  meta: TcgMeta | null;
  total: number | null;
  loading: boolean;
}

const selectCls =
  "h-10 w-full rounded-lg border border-white/10 bg-ink-2 px-3 text-sm text-white outline-none transition focus:border-white/30 [&>option]:bg-ink-2";

export function TcgFilterBar({ value: f, onChange, onReset, meta, total, loading }: Props) {
  const [open, setOpen] = useState(false);
  const active = activeFilterCount(f);
  const sets = useMemo(() => {
    const series = meta?.series ?? [];
    const list = f.serie ? series.filter((s) => s.id === f.serie) : series;
    return [...list].reverse().map((s) => ({ ...s, sets: [...s.sets].reverse() }));
  }, [meta, f.serie]);
  const setName = (id: string) => meta?.series.flatMap((s) => s.sets).find((s) => s.id === id)?.name ?? id;
  const serieName = (id: string) => meta?.series.find((s) => s.id === id)?.name ?? id;

  const chips: [string, string, Partial<TcgFilters>][] = [
    f.serie && ["Série", serieName(f.serie), { serie: "", set: "" }],
    f.set && ["Coleção", setName(f.set), { set: "" }],
    f.category && ["Categoria", f.category, { category: "" }],
    f.rarity && ["Raridade", f.rarity, { rarity: "" }],
    f.type && ["Tipo", f.type, { type: "" }],
    f.stage && ["Evolução", f.stage, { stage: "" }],
    f.illustrator && ["Ilustrador", f.illustrator, { illustrator: "" }],
    (f.hpMin !== null || f.hpMax !== null) && ["HP", `${f.hpMin ?? 0}–${f.hpMax ?? "∞"}`, { hpMin: null, hpMax: null }],
    !f.images && ["Exibindo", "cartas sem imagem", { images: true }],
  ].filter(Boolean) as [string, string, Partial<TcgFilters>][];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-11 min-w-0 flex-1 basis-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 focus-within:border-white/30 sm:basis-auto">
          <Search size={16} className="shrink-0 text-white/40" />
          <input
            value={f.q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Buscar carta ou Pokémon — ex.: Charizard, Pikachu ex, Ultra Bola"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            aria-label="Buscar cartas por nome"
          />
          {f.q && (
            <button type="button" onClick={() => onChange({ q: "" })} aria-label="Limpar busca" className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          )}
        </label>
        <label className="flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] pl-3 pr-2">
          <ArrowDownUp size={14} className="text-white/40" />
          <select
            value={f.sort}
            onChange={(e) => onChange({ sort: e.target.value as TcgFilters["sort"] })}
            className="h-full bg-transparent pr-1 text-sm text-white outline-none [&>option]:bg-ink-2"
            aria-label="Ordenar cartas"
          >
            {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </label>
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
            <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Série">
                  <select className={selectCls} value={f.serie} onChange={(e) => onChange({ serie: e.target.value, set: "" })}>
                    <option value="">Todas as séries</option>
                    {[...(meta?.series ?? [])].reverse().map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <Field label="Coleção">
                  <select className={selectCls} value={f.set} onChange={(e) => onChange({ set: e.target.value })}>
                    <option value="">Todas as coleções</option>
                    {sets.map((s) => (
                      <optgroup key={s.id} label={s.name}>
                        {s.sets.map((set) => <option key={set.id} value={set.id}>{set.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </Field>
                <Field label="Raridade">
                  <select className={selectCls} value={f.rarity} onChange={(e) => onChange({ rarity: e.target.value })}>
                    <option value="">Todas as raridades</option>
                    {(meta?.rarities ?? []).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Evolução">
                  <select className={selectCls} value={f.stage} onChange={(e) => onChange({ stage: e.target.value })}>
                    <option value="">Todos os estágios</option>
                    {(meta?.stages ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Ilustrador">
                  <input
                    list="tcg-illustrators"
                    className={selectCls}
                    value={f.illustrator}
                    onChange={(e) => onChange({ illustrator: e.target.value })}
                    placeholder="Nome do artista"
                  />
                  <datalist id="tcg-illustrators">
                    {(meta?.illustrators ?? []).map((i) => <option key={i} value={i} />)}
                  </datalist>
                </Field>
                <Field label="HP">
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} step={10} inputMode="numeric" placeholder="mín." aria-label="HP mínimo" className={selectCls} value={f.hpMin ?? ""} onChange={(e) => onChange({ hpMin: e.target.value === "" ? null : Number(e.target.value) })} />
                    <span className="text-white/30">–</span>
                    <input type="number" min={0} step={10} inputMode="numeric" placeholder="máx." aria-label="HP máximo" className={selectCls} value={f.hpMax ?? ""} onChange={(e) => onChange({ hpMax: e.target.value === "" ? null : Number(e.target.value) })} />
                  </div>
                </Field>
                <Field label="Categoria">
                  <div className="flex flex-wrap gap-1.5">
                    {["", ...(meta?.categories ?? ["Pokémon", "Treinador", "Energia"])].map((c) => (
                      <button key={c || "all"} type="button" aria-pressed={f.category === c} onClick={() => onChange({ category: c })} className={`h-10 rounded-lg px-3 text-xs transition ${f.category === c ? "bg-white text-ink" : "bg-white/[0.05] text-white/70 hover:text-white"}`}>
                        {c || "Todas"}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Imagens">
                  <button type="button" aria-pressed={!f.images} onClick={() => onChange({ images: !f.images })} className={`flex h-10 items-center gap-2 rounded-lg px-3 text-xs transition ${!f.images ? "bg-white text-ink" : "bg-white/[0.05] text-white/70 hover:text-white"}`}>
                    <ImageOff size={13} /> Incluir cartas sem imagem
                  </button>
                </Field>
              </div>
              <Field label="Tipo">
                <div className="flex flex-wrap gap-1.5">
                  {(meta?.types ?? []).map((t) => {
                    const on = f.type === t;
                    return (
                      <motion.button
                        key={t}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        aria-pressed={on}
                        onClick={() => onChange({ type: on ? "" : t })}
                        className="flex h-9 items-center gap-1.5 rounded-[6px] pl-1.5 pr-3 text-xs transition-colors"
                        style={on ? { background: tcgTypeColor(t), color: "#0c0c0c" } : { background: "rgb(255 255 255 / .04)", color: tcgTypeColor(t), boxShadow: `inset 0 0 0 1px ${tcgTypeColor(t)}33` }}
                      >
                        <Energy type={t} size={20} /> {t}
                      </motion.button>
                    );
                  })}
                </div>
              </Field>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
        <span className="mr-1 font-mono">
          {total === null ? "—" : <><span className="text-white">{total.toLocaleString("pt-BR")}</span> cartas</>}
          {loading && <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)] align-middle" />}
        </span>
        {chips.map(([k, v, patch]) => (
          <button key={k} type="button" onClick={() => onChange(patch)} className="flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 text-white/70 hover:border-white/30 hover:text-white">
            <span className="text-white/40">{k}:</span> {v} <X size={11} />
          </button>
        ))}
        {(chips.length > 0 || f.q) && (
          <button type="button" onClick={onReset} className="ml-auto flex items-center gap-1 hover:text-white">
            <X size={12} /> Limpar tudo
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-2">{label}</p>
      {children}
    </div>
  );
}

