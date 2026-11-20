"use client";

import Link from "next/link";
import { memo } from "react";
import { Heart, Check } from "lucide-react";
import { rarityTier, type RarityTier } from "@/lib/tcg/constants";
import type { TcgCardBrief } from "@/lib/tcg/types";
import { useTilt } from "@/hooks/useTilt";
import { cardCollection, useCardCollection } from "@/hooks/useCardCollection";
import { TcgImage } from "./TcgImage";

interface Props {
  card: TcgCardBrief;
  /** known rarity (e.g. when the list was filtered by rarity) — drives the foil finish */
  rarity?: string | null;
  tier?: RarityTier;
  onOpen?: (card: TcgCardBrief) => void;
  priority?: boolean;
  caption?: boolean;
  size?: "md" | "lg";
}

export const snapshotOf = (c: TcgCardBrief) => ({ name: c.name, image: c.image, setId: c.setId, setName: c.setName, localId: c.localId });

/** A real card scan presented with the PokéDeck tilt + holographic glare. */
export const TcgCardTile = memo(function TcgCardTile({ card, rarity, tier, onOpen, priority, caption = true, size = "md" }: Props) {
  const tilt = useTilt<HTMLDivElement>(size === "lg" ? 14 : 11);
  const entry = useCardCollection((s) => s.cards[card.id]);
  const t = tier ?? rarityTier(rarity);
  const fav = Boolean(entry?.favorite);

  return (
    <div className="group relative">
      <Link
        href={`/cards/${encodeURIComponent(card.id)}`}
        prefetch={false}
        onClick={(e) => {
          if (!onOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          onOpen(card);
        }}
        className="block rounded-[4.5%] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        aria-label={`${card.name} — ${card.setName ?? card.setId} ${card.localId}`}
      >
        <div
          ref={tilt.ref}
          onPointerMove={tilt.onPointerMove}
          onPointerLeave={tilt.onPointerLeave}
          data-tier={t}
          className="pcard tcg-card relative rounded-[4.5%]"
        >
          <TcgImage base={card.image} alt={card.name} label={card.name} priority={priority} />
          <div className={`pcard-glare rounded-[4.5%] ${t >= 2 ? "tcg-foil" : ""}`} />
        </div>
      </Link>

      <button
        type="button"
        aria-label={fav ? "Remover carta dos favoritos" : "Favoritar carta"}
        aria-pressed={fav}
        onClick={() => cardCollection.toggleFavorite(card.id, snapshotOf(card))}
        className={`absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition-all duration-300 hover:scale-110 ${
          fav ? "bg-[#ff4d6d] text-white opacity-100" : "bg-black/55 text-white/70 opacity-0 hover:text-white group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        }`}
      >
        <Heart size={14} fill={fav ? "currentColor" : "none"} />
      </button>
      {entry && entry.owned > 0 && (
        <span className="absolute left-2 top-2 z-10 flex h-6 items-center gap-1 rounded-full bg-emerald-500/90 px-2 font-mono text-[10px] text-white" title="Na sua coleção">
          <Check size={11} /> {entry.owned > 1 ? `×${entry.owned}` : "Tenho"}
        </span>
      )}

      {caption && (
        <div className="mt-2.5 px-0.5">
          <p className="truncate text-[13px] text-white">{card.name}</p>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-white/40">
            {card.setName ?? card.setId} · {card.localId}
          </p>
        </div>
      )}
    </div>
  );
});

export function TcgTileSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[63/88] w-full rounded-[4.5%]" />
      <div className="skeleton mt-2.5 h-3 w-3/4 rounded" />
      <div className="skeleton mt-1.5 h-2.5 w-1/2 rounded" />
    </div>
  );
}
