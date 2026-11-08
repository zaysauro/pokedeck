"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Search, X } from "lucide-react";
import { GENERATIONS, TYPES, TYPE_META } from "@/lib/constants";
import { applyFilters, DEFAULT_FILTERS } from "@/lib/filters";
import { dexNumber } from "@/lib/format";
import type { TypeName } from "@/lib/types";
import { usePokedex } from "@/hooks/usePokedex";
import { useCollection } from "@/hooks/useCollection";
import { PokeImage } from "@/components/ui/PokeImage";
import { TypeDot } from "@/components/ui/TypeBadge";
import { TypeIcon } from "@/components/ui/TypeIcon";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (id: number) => void;
  title: string;
  disabledIds?: number[];
  subtitle?: string;
}

const PAGE = 60;

/** Slide-over selection panel with search, type/generation filters and favourites. */
export function PokemonPicker({ open, onClose, onPick, title, subtitle, disabledIds = [] }: Props) {
  const { entries, loading } = usePokedex();
  const favorites = useCollection((s) => s.favorites);
  const [q, setQ] = useState("");
  const [type, setType] = useState<TypeName | null>(null);
  const [gen, setGen] = useState<number | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => setLimit(PAGE), [q, type, gen, favOnly]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const list = useMemo(() => {
    const base = favOnly ? entries.filter((e) => favorites.includes(e.id)) : entries;
    return applyFilters(base, { ...DEFAULT_FILTERS, q, types: type ? [type] : [], gens: gen ? [gen] : [] });
  }, [entries, favorites, favOnly, q, type, gen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label={title}
            className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-[520px] flex-col border-l border-white/10 bg-ink-2 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
          >
            <div className="border-b border-white/10 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="display text-4xl">{title}</h2>
                  {subtitle && <p className="mt-1 text-xs text-white/45">{subtitle}</p>}
                </div>
                <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <label className="mt-4 flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 focus-within:border-white/30">
                <Search size={15} className="text-white/40" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou número" className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
              </label>
              <div className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5">
                <button
                  type="button"
                  onClick={() => setFavOnly((v) => !v)}
                  className={`flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] ${favOnly ? "bg-[#ff4d6d] text-white" : "bg-white/[0.05] text-white/60"}`}
                >
                  <Heart size={11} fill={favOnly ? "currentColor" : "none"} /> Favoritos
                </button>
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(type === t ? null : t)}
                    title={TYPE_META[t].pt}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full transition"
                    style={type === t ? { background: TYPE_META[t].color, color: "#0c0c0c" } : { background: "rgb(255 255 255 / .05)", color: TYPE_META[t].color }}
                  >
                    <TypeIcon type={t} size={13} />
                  </button>
                ))}
              </div>
              <div className="no-scrollbar -mx-5 mt-2 flex gap-1.5 overflow-x-auto px-5">
                {GENERATIONS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGen(gen === g.id ? null : g.id)}
                    className={`h-7 shrink-0 rounded-full px-2.5 text-[11px] ${gen === g.id ? "bg-white text-ink" : "bg-white/[0.05] text-white/60"}`}
                  >
                    {g.region}
                  </button>
                ))}
              </div>
            </div>
            <div
              className="flex-1 overflow-y-auto p-4"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight > el.scrollHeight - 400) setLimit((l) => Math.min(l + PAGE, list.length));
              }}
            >
              {loading && <p className="py-10 text-center text-sm text-white/40">Carregando…</p>}
              {!loading && list.length === 0 && <p className="py-10 text-center text-sm text-white/40">Nada encontrado.</p>}
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {list.slice(0, limit).map((e) => {
                  const disabled = disabledIds.includes(e.id);
                  return (
                    <li key={e.id}>
                      <motion.button
                        type="button"
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={disabled}
                        onClick={() => onPick(e.id)}
                        className="group flex w-full flex-col items-center rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center transition hover:border-[var(--accent)]/60 disabled:opacity-35"
                        style={{ background: `linear-gradient(180deg, ${TYPE_META[e.types[0] ?? "normal"].color}1f, transparent)` }}
                      >
                        <span className="self-start font-mono text-[9px] text-white/35">{dexNumber(e.id)}</span>
                        <PokeImage id={e.id} alt={e.display} className="h-16 w-16 object-contain transition-transform group-hover:scale-110" />
                        <span className="mt-1 w-full truncate text-[11px] text-white/85">{e.display}</span>
                        <span className="mt-1 flex gap-1">{e.types.map((t) => <TypeDot key={t} type={t} size={7} />)}</span>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
