"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { useMembers } from "@/hooks/useMembers";
import { formatDate } from "@/lib/format";
import { paletteFor } from "@/lib/palette";
import { MAX_TEAM } from "@/hooks/useCollection";
import { FanDeck } from "./FanDeck";
import { TypeDot } from "@/components/ui/TypeBadge";

interface Props {
  name: string;
  description: string;
  members: number[];
  coverId: number | null;
  href?: string;
  createdAt?: number;
  favorite?: boolean;
  actions?: React.ReactNode;
  index?: number;
}

/** A team presented as a collectible box: mini fan, tinted by its cover Pokémon. */
export function DeckCard({ name, description, members: ids, coverId, href, createdAt, favorite, actions, index = 0 }: Props) {
  const { members } = useMembers(ids);
  const cover = members.find((m) => m.id === coverId) ?? members[0];
  const p = paletteFor(cover?.types.length ? cover.types : ["normal"]);
  const types = [...new Set(members.flatMap((m) => m.types))];

  const inner = (
    <>
      <div
        className="relative overflow-hidden rounded-t-[22px] px-2 pt-6"
        style={{ background: `radial-gradient(80% 90% at 50% 100%, ${p.primary}55, transparent 70%), linear-gradient(180deg, ${p.deep}, #0d0d10)` }}
      >
        <div className="dot-grid absolute inset-0 opacity-50" />
        {favorite && <Star size={14} className="absolute left-4 top-4 z-10 text-gold" fill="currentColor" aria-label="Deck favorito" />}
        <span className="absolute right-4 top-4 z-10 font-mono text-[10px] text-white/55">{ids.length}/{MAX_TEAM}</span>
        <FanDeck members={members} slots={0} size="sm" interactive={false} />
      </div>
      <div className="flex flex-col p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="display text-3xl leading-none text-white">{name}</h3>
          <span className="mt-1 flex shrink-0 gap-1">{types.slice(0, 6).map((t) => <TypeDot key={t} type={t} size={8} />)}</span>
        </div>
        {description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/50">{description}</p>}
      </div>
    </>
  );
  const footer = (
    <div className="mt-auto flex items-center justify-between px-5 pb-5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">{createdAt ? formatDate(createdAt) : "Deck curado"}</span>
      {actions}
    </div>
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 26 }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-[22px] border border-white/10 bg-ink-2 transition-colors hover:border-white/25"
    >
      {href ? <Link href={href} className="flex flex-col">{inner}</Link> : <div className="flex flex-col">{inner}</div>}
      {footer}
    </motion.article>
  );
}
