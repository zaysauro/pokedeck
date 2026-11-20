"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DEFAULT_TCG_FILTERS } from "@/lib/tcg/constants";
import { useTcgSearch } from "@/hooks/useTcgSearch";
import { TcgCardTile, TcgTileSkeleton } from "./TcgCardTile";

/** Strip TCG suffixes ("ex", "V", "VMAX"…) to find other prints of the same Pokémon. */
function baseName(name: string) {
  return name.replace(/\s+(ex|EX|GX|V|VMAX|VSTAR|V-ASTRO|V-UNIÃO|BREAK|LV\.X|δ|☆)$/u, "").replace(/^Mega\s+/u, "").trim();
}

export function RelatedCards({ name, currentId }: { name: string; currentId: string }) {
  const q = baseName(name);
  const { data, loading } = useTcgSearch({ ...DEFAULT_TCG_FILTERS, q }, null, 14);
  const cards = (data?.cards ?? []).filter((c) => c.id !== currentId).slice(0, 12);
  if (!loading && cards.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 md:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 className="display text-5xl md:text-6xl">
          Outras cartas de <em className="italic text-[var(--accent)]">{q}</em>
        </h2>
        <Link href={`/cards?q=${encodeURIComponent(q)}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
          Ver todas {data ? `(${data.total})` : ""} <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6">
        {loading && !data
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="w-44 shrink-0"><TcgTileSkeleton /></div>)
          : cards.map((c) => <div key={c.id} className="w-44 shrink-0 snap-start md:w-52"><TcgCardTile card={c} /></div>)}
      </div>
    </section>
  );
}
