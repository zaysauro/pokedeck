"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { DEFAULT_TCG_FILTERS } from "@/lib/tcg/constants";
import type { TcgCard, TcgCardBrief } from "@/lib/tcg/types";
import { useTcgSearch } from "@/hooks/useTcgSearch";
import { TcgImage } from "@/components/tcg/TcgImage";
import type { CardInput } from "@/server/trading";

/** Full card data for snapshots (rarity, category) — cached per session. */
const full = new Map<string, Promise<TcgCard | null>>();
export function loadCard(id: string) {
  if (!full.has(id)) {
    full.set(id, fetch(`/api/tcg?id=${encodeURIComponent(id)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  }
  return full.get(id)!;
}

export async function toCardInput(b: TcgCardBrief): Promise<CardInput & { category?: string | null }> {
  const c = await loadCard(b.id);
  return {
    card_id: b.id,
    card_name: c?.name ?? b.name,
    card_image: c?.image ?? b.image,
    set_id: c?.set.id ?? b.setId,
    set_name: c?.set.name ?? b.setName,
    local_id: c?.localId ?? b.localId,
    rarity: c?.rarity && c.rarity !== "None" ? c.rarity : null,
    card_type: c?.types?.[0] ?? c?.category ?? null,
    category: c?.category ?? null,
  };
}

/** Modal TCG card search (TCGdex catalog) used by collection, wants and the deck builder. */
export function CardPicker({ open, onClose, onPick, title, subtitle }: {
  open: boolean;
  onClose: () => void;
  onPick: (card: TcgCardBrief) => void;
  title: string;
  subtitle?: string;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error } = useTcgSearch({ ...DEFAULT_TCG_FILTERS, q, page }, null, 24);

  useEffect(() => setPage(1), [q]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label={title}
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-[560px] flex-col border-l border-white/10 bg-ink-2 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
          >
            <div className="border-b border-white/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="display text-4xl">{title}</h2>
                  {subtitle && <p className="mt-1 text-xs text-white/45">{subtitle}</p>}
                </div>
                <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 hover:text-white"><X size={16} /></button>
              </div>
              <label className="mt-4 flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 focus-within:border-white/30">
                <Search size={15} className="text-white/40" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome da carta — ex.: Charizard ex, Pikachu" className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" />
              </label>
              <p className="mt-2 font-mono text-[10px] text-white/35">{data ? `${data.total.toLocaleString("pt-BR")} cartas` : " "}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {error && <p className="py-10 text-center text-sm text-red-300">{error}</p>}
              <ul className={`grid grid-cols-3 gap-3 sm:grid-cols-4 ${loading ? "opacity-60" : ""}`}>
                {(data?.cards ?? []).map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => onPick(c)} className="group block w-full text-left">
                      <div className="overflow-hidden rounded-[4.5%] ring-1 ring-white/10 transition group-hover:ring-2 group-hover:ring-[var(--accent)]">
                        <TcgImage base={c.image} alt={c.name} />
                      </div>
                      <p className="mt-1.5 truncate text-[11px] text-white/85">{c.name}</p>
                      <p className="truncate font-mono text-[9px] uppercase text-white/35">{c.setName ?? c.setId} · {c.localId}</p>
                    </button>
                  </li>
                ))}
              </ul>
              {data && data.pages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3 text-xs">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-white/10 px-4 py-2 disabled:opacity-30">Anterior</button>
                  <span className="font-mono text-white/40">{data.page}/{data.pages}</span>
                  <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-white/10 px-4 py-2 disabled:opacity-30">Próxima</button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
