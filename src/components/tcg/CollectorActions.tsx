"use client";

import { Bookmark, Heart, Minus, PackageCheck, Plus } from "lucide-react";
import type { TcgCard } from "@/lib/tcg/types";
import { cardCollection, useCardCollection, type CardSnapshot } from "@/hooks/useCardCollection";
import { toast } from "@/components/ui/Toast";

export const snapshotFromCard = (c: TcgCard): CardSnapshot => ({
  name: c.name, image: c.image, setId: c.set.id, setName: c.set.name, localId: c.localId,
});

/** Favorite / owned (with copies) / wishlist controls — saved locally in this browser. */
export function CollectorActions({ card, compact }: { card: TcgCard; compact?: boolean }) {
  const entry = useCardCollection((s) => s.cards[card.id]);
  const snap = snapshotFromCard(card);
  const owned = entry?.owned ?? 0;
  const fav = Boolean(entry?.favorite);
  const wish = Boolean(entry?.wishlist);
  const h = compact ? "h-10" : "h-11";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-pressed={fav}
        onClick={() => {
          cardCollection.toggleFavorite(card.id, snap);
          toast(fav ? "Carta removida dos favoritos" : "Carta adicionada aos favoritos");
        }}
        className={`flex ${h} items-center gap-2 rounded-full border px-4 text-sm transition ${fav ? "border-[#ff4d6d] bg-[#ff4d6d]/15 text-[#ff8fa3]" : "border-white/15 text-white/80 hover:border-white/40"}`}
      >
        <Heart size={15} fill={fav ? "currentColor" : "none"} /> {fav ? "Favorita" : "Favoritar"}
      </button>

      {owned === 0 ? (
        <button
          type="button"
          onClick={() => {
            cardCollection.setOwned(card.id, snap, 1);
            toast("Marcada como “tenho”");
          }}
          className={`flex ${h} items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--on-accent)] transition hover:brightness-110`}
        >
          <PackageCheck size={15} /> Tenho esta carta
        </button>
      ) : (
        <div className={`flex ${h} items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 pl-3 pr-1 text-sm text-emerald-200`} role="group" aria-label="Cópias na coleção">
          <PackageCheck size={15} />
          <span className="mx-1">{owned === 1 ? "Na coleção" : `${owned} cópias`}</span>
          <button type="button" aria-label="Remover uma cópia" onClick={() => cardCollection.setOwned(card.id, snap, owned - 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"><Minus size={14} /></button>
          <button type="button" aria-label="Adicionar uma cópia" onClick={() => cardCollection.setOwned(card.id, snap, owned + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"><Plus size={14} /></button>
        </div>
      )}

      {owned === 0 && (
        <button
          type="button"
          aria-pressed={wish}
          onClick={() => {
            cardCollection.toggleWishlist(card.id, snap);
            toast(wish ? "Removida da lista de desejos" : "Adicionada à lista de desejos");
          }}
          className={`flex ${h} items-center gap-2 rounded-full border px-4 text-sm transition ${wish ? "border-gold/60 bg-gold/15 text-gold" : "border-white/15 text-white/80 hover:border-white/40"}`}
        >
          <Bookmark size={15} fill={wish ? "currentColor" : "none"} /> {wish ? "Na lista de desejos" : "Quero"}
        </button>
      )}
    </div>
  );
}
