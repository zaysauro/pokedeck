"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Bookmark, Heart, PackageCheck } from "lucide-react";
import type { TcgCardBrief } from "@/lib/tcg/types";
import { collectionStats, useCardCollection } from "@/hooks/useCardCollection";
import { TcgCardTile } from "./TcgCardTile";
import { CardQuickView } from "./CardQuickView";

type Tab = "favorite" | "owned" | "wishlist";

/** Saved TCG cards: favorites, owned (with duplicates) and wishlist — all from local storage. */
export function FavoriteCards() {
  const cards = useCardCollection((s) => s.cards);
  const hydrated = useCardCollection((s) => s.hydrated);
  const [tab, setTab] = useState<Tab>("favorite");
  const [quick, setQuick] = useState<TcgCardBrief | null>(null);
  const close = useCallback(() => setQuick(null), []);
  const stats = collectionStats(cards);

  const list = useMemo(
    () =>
      Object.entries(cards)
        .filter(([, c]) => (tab === "favorite" ? c.favorite : tab === "owned" ? c.owned > 0 : c.wishlist))
        .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
        .map<TcgCardBrief>(([id, c]) => ({ id, localId: c.localId, name: c.name, image: c.image, setId: c.setId, setName: c.setName, serieId: null })),
    [cards, tab],
  );

  const tabs: [Tab, string, number, React.ReactNode][] = [
    ["favorite", "Favoritas", stats.favorites, <Heart key="h" size={13} />],
    ["owned", "Tenho", stats.owned, <PackageCheck key="p" size={13} />],
    ["wishlist", "Quero", stats.wishlist, <Bookmark key="b" size={13} />],
  ];

  return (
    <section className="mt-24 border-t border-white/10 pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Cartas TCG</p>
          <h2 className="display mt-3 text-5xl md:text-7xl">Suas <em className="italic text-gold">cartas</em></h2>
        </div>
        {stats.owned > 0 && (
          <p className="font-mono text-xs text-white/45">
            {stats.copies} cópias · {stats.duplicates} com repetidas
          </p>
        )}
      </div>
      <div role="tablist" className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([k, label, n, icon]) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-xs transition ${tab === k ? "bg-white text-ink" : "border border-white/10 text-white/65 hover:text-white"}`}>
            {icon} {label} <span className="font-mono opacity-60">{n}</span>
          </button>
        ))}
      </div>

      {!hydrated ? (
        <div className="skeleton mt-8 h-48 rounded-2xl" />
      ) : list.length === 0 ? (
        <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-white/10 p-8">
          <p className="text-sm text-white/50">
            {tab === "favorite" ? "Nenhuma carta favorita ainda." : tab === "owned" ? "Marque “Tenho esta carta” para montar sua coleção." : "Sua lista de desejos está vazia."}
          </p>
          <Link href="/cards" className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-ink">Explorar Cartas TCG <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <AnimatePresence>
            {list.map((c) => (
              <motion.div key={c.id} layout initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}>
                <TcgCardTile card={c} onOpen={setQuick} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <CardQuickView card={quick} onClose={close} />
    </section>
  );
}
