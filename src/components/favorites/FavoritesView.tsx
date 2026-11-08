"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TYPES, TYPE_META } from "@/lib/constants";
import type { TypeName } from "@/lib/types";
import { useCollection } from "@/hooks/useCollection";
import { useMembers } from "@/hooks/useMembers";
import { PokeCard } from "@/components/cards/PokeCard";
import { FanDeck } from "@/components/deck/FanDeck";
import { EmptyState } from "@/components/ui/EmptyState";
import { GridSkeleton } from "@/components/pokedex/VirtualGrid";
import { TypeIcon } from "@/components/ui/TypeIcon";
import { AddToTeamMenu } from "@/components/team/AddToTeamMenu";

export function FavoritesView() {
  const hydrated = useCollection((s) => s.hydrated);
  const ids = useCollection((s) => s.favorites);
  const { members, loading } = useMembers(ids);
  const [type, setType] = useState<TypeName | null>(null);
  const [fanSel, setFanSel] = useState<number | null>(null);

  const present = useMemo(() => TYPES.filter((t) => members.some((m) => m.types.includes(t))), [members]);
  const list = type ? members.filter((m) => m.types.includes(type)) : members;

  if (!hydrated || (loading && ids.length)) return <GridSkeleton count={6} />;
  if (!ids.length) {
    return (
      <EmptyState
        title="Sua coleção está vazia"
        body="Toque no coração de qualquer carta para guardá-la aqui."
        action={<Link href="/pokedex" className="rounded-full bg-white px-5 py-2.5 text-sm text-ink">Explorar a Pokédex</Link>}
      />
    );
  }

  return (
    <div className="space-y-12">
      {/* Showcase: the latest favourites fanned out like a freshly opened pack */}
      <section className="rounded-[28px] border border-white/10 bg-white/[0.02] px-2 pt-10">
        <FanDeck members={members.slice(0, 7)} selected={fanSel} onSelect={setFanSel} size="md" />
      </section>

      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => setType(null)} className={`h-8 rounded-full px-3 text-xs ${type === null ? "bg-white text-ink" : "bg-white/[0.05] text-white/60"}`}>
          Todos <span className="ml-1 font-mono opacity-60">{members.length}</span>
        </button>
        {present.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(type === t ? null : t)}
            className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition"
            style={type === t ? { background: TYPE_META[t].color, color: "#0c0c0c" } : { background: "rgb(255 255 255 / .05)", color: TYPE_META[t].light }}
          >
            <TypeIcon type={t} size={12} /> {TYPE_META[t].pt}
          </button>
        ))}
      </div>

      <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <AnimatePresence>
          {list.map((m, i) => (
            <motion.div
              key={m.key}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: -6 }}
              transition={{ delay: Math.min(i, 12) * 0.03 }}
              className="relative"
            >
              <PokeCard data={m} href={`/pokemon/${m.id}`} />
              <AddToTeamMenu pokemonId={m.id} name={m.display} compact className="absolute left-2.5 top-8 z-10" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
