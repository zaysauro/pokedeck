"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { norm } from "@/lib/format";
import type { TcgCardBrief, TcgSetDetail } from "@/lib/tcg/types";
import { setCompletion, useCardCollection } from "@/hooks/useCardCollection";
import { TcgCardTile } from "./TcgCardTile";
import { CardQuickView } from "./CardQuickView";

type Show = "all" | "owned" | "missing";

/** Every card of a set + the collector's completion for it. */
export function SetCards({ set }: { set: TcgSetDetail }) {
  const cards = useCardCollection((s) => s.cards);
  const hydrated = useCardCollection((s) => s.hydrated);
  const [q, setQ] = useState("");
  const [show, setShow] = useState<Show>("all");
  const [quick, setQuick] = useState<TcgCardBrief | null>(null);
  const close = useCallback(() => setQuick(null), []);
  const done = setCompletion(cards, set.id, set.official);

  const list = useMemo(() => {
    const n = norm(q.trim());
    return set.cards.filter((c) => {
      if (n && !norm(c.name).includes(n) && c.localId !== q.trim()) return false;
      const owned = (cards[c.id]?.owned ?? 0) > 0;
      return show === "all" || (show === "owned" ? owned : !owned);
    });
  }, [set.cards, cards, q, show]);

  return (
    <section className="mt-10">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Sua coleção</p>
            <p className="mt-1 font-mono text-2xl text-white">
              {hydrated ? done.owned : "—"}<span className="text-white/35">/{done.official ?? set.cards.length}</span>
              {done.percent !== null && <span className="ml-3 text-base text-gold">{done.percent}%</span>}
            </p>
          </div>
          <p className="max-w-xs text-right text-[11px] text-white/35">Marque “Tenho esta carta” em qualquer carta para acompanhar a conclusão da coleção.</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-gold" initial={{ width: 0 }} animate={{ width: `${done.percent ?? 0}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <label className="flex h-10 min-w-0 flex-1 basis-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 sm:basis-auto">
          <Search size={14} className="text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por nome ou número" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30" aria-label="Filtrar cartas da coleção" />
        </label>
        {(["all", "owned", "missing"] as Show[]).map((s) => (
          <button key={s} type="button" aria-pressed={show === s} onClick={() => setShow(s)} className={`h-10 rounded-full px-4 text-xs transition ${show === s ? "bg-white text-ink" : "border border-white/10 text-white/65 hover:text-white"}`}>
            {s === "all" ? `Todas (${set.cards.length})` : s === "owned" ? "Tenho" : "Faltam"}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {list.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.45, delay: (i % 6) * 0.03 }}>
            <TcgCardTile card={c} onOpen={setQuick} priority={i < 6} />
          </motion.div>
        ))}
      </div>
      {list.length === 0 && <p className="py-16 text-center text-sm text-white/40">Nenhuma carta corresponde ao filtro.</p>}
      <CardQuickView card={quick} onClose={close} />
    </section>
  );
}
