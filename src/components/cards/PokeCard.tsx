"use client";

import Link from "next/link";
import { memo } from "react";
import { Heart, Crown, Sparkle } from "lucide-react";
import { TYPE_META } from "@/lib/constants";
import { dexNumber } from "@/lib/format";
import type { TypeName } from "@/lib/types";
import { useTilt } from "@/hooks/useTilt";
import { collection, useCollection } from "@/hooks/useCollection";
import { PokeImage } from "@/components/ui/PokeImage";
import { TypeBadge } from "@/components/ui/TypeBadge";

export interface CardData {
  id: number;
  display: string;
  name?: string;
  types: TypeName[];
  legendary?: boolean;
  mythical?: boolean;
  total?: number;
}

interface Props {
  data: CardData;
  href?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  showFavorite?: boolean;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/** The collectible card: holo glare, 3D tilt, type-tinted frame. */
export const PokeCard = memo(function PokeCard({
  data, href, onClick, size = "md", showFavorite = true, priority, className = "", children,
}: Props) {
  const tilt = useTilt<HTMLDivElement>(size === "lg" ? 14 : 10);
  const shiny = useCollection((s) => s.prefs.shiny);
  const fav = useCollection((s) => s.favorites.includes(data.id));
  const t1 = TYPE_META[data.types[0] ?? "normal"];
  const t2 = data.types[1] ? TYPE_META[data.types[1]] : t1;
  const nameSize = size === "sm" ? "text-lg" : size === "lg" ? "text-4xl" : "text-[26px]";

  const body = (
    <div
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className={`pcard group aspect-[5/7] w-full select-none ${className}`}
      style={{ ["--c1" as string]: t1.color, ["--c2" as string]: t2.color, ["--cd" as string]: t1.deep }}
    >
      <div className="pcard-frame">
        {/* faint giant number watermark */}
        <span className="pointer-events-none absolute -right-2 top-6 font-mono text-[64px] font-bold leading-none text-white/[0.04]">
          {String(data.id).padStart(3, "0")}
        </span>
        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.15em] text-white/60">{dexNumber(data.id)}</span>
          <span className="flex items-center gap-1 text-gold">
            {data.legendary && <Crown size={12} aria-label="Lendário" />}
            {data.mythical && <Sparkle size={12} aria-label="Mítico" />}
          </span>
        </div>
        <div className="absolute inset-x-[10%] top-[11%] bottom-[30%] flex items-center justify-center">
          <span
            className="absolute aspect-square w-[85%] rounded-full opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
            style={{ background: `radial-gradient(circle, ${t1.color}55, transparent 70%)` }}
          />
          <PokeImage
            id={data.id}
            shiny={shiny}
            priority={priority}
            alt={data.display}
            className="pcard-art relative h-full w-full object-contain transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
          />
        </div>
        <div className="absolute inset-x-3 bottom-3">
          <div className="mb-2 h-px w-full bg-gradient-to-r from-white/20 via-white/5 to-transparent" />
          <h3 className={`display truncate ${nameSize} text-white`}>{data.display}</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {data.types.map((t) => (
              <TypeBadge key={t} type={t} size="sm" variant="ghost" />
            ))}
            {typeof data.total === "number" && data.total > 0 && size !== "sm" && (
              <span className="ml-auto font-mono text-[10px] text-white/45">Σ {data.total}</span>
            )}
          </div>
        </div>
      </div>
      <div className="pcard-glare" />
      {children}
    </div>
  );

  return (
    <div className="relative">
      {href ? (
        <Link href={href} prefetch={false} className="block rounded-[var(--radius-card)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
          {body}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className="block w-full rounded-[var(--radius-card)] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
          {body}
        </button>
      ) : (
        body
      )}
      {showFavorite && (
        <button
          type="button"
          aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={fav}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            collection.toggleFavorite(data.id);
          }}
          className={`absolute right-2.5 top-8 z-10 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition-all duration-300 hover:scale-110 ${
            fav ? "bg-[#ff4d6d] text-white" : "bg-black/40 text-white/60 hover:text-white"
          }`}
        >
          <Heart size={14} fill={fav ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
});

export function CardSkeleton() {
  return <div className="skeleton aspect-[5/7] w-full rounded-[var(--radius-card)] ring-1 ring-white/5" />;
}
