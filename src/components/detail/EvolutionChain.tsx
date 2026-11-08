"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { dexNumber, prettyName } from "@/lib/format";
import type { EvolutionNode } from "@/lib/types";
import { PokeImage } from "@/components/ui/PokeImage";
import { useCollection } from "@/hooks/useCollection";

/** Interactive evolution tree: stages left→right, branches stacked (e.g. Eevee). */
export function EvolutionChain({ root, currentId }: { root: EvolutionNode; currentId: number }) {
  if (!root.children.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Stage node={root} current={currentId} index={0} />
        <p className="text-sm text-white/45">Este Pokémon não evolui.</p>
      </div>
    );
  }
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-4">
      <Branch node={root} current={currentId} depth={0} />
    </div>
  );
}

function Branch({ node, current, depth }: { node: EvolutionNode; current: number; depth: number }) {
  // Many branches (e.g. Eevee): one arrow, then a grid of outcomes each labelled with its condition.
  if (node.children.length > 3) {
    return (
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
        <Stage node={node} current={current} index={depth} />
        <ChevronRight size={20} className="hidden shrink-0 text-[var(--accent)] md:block" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {node.children.map((child, k) => (
            <div key={child.id} className="flex flex-col items-center gap-1.5">
              <Stage node={child} current={current} index={depth + 1 + k * 0.15} />
              <span className="max-w-32 text-center text-[10px] leading-tight text-white/50">{child.detail ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 md:gap-4">
      <Stage node={node} current={current} index={depth} />
      {node.children.length > 0 && (
        <div className="flex flex-col gap-4">
          {node.children.map((child) => (
            <div key={child.id} className="flex items-center gap-2 md:gap-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + depth * 0.2 }}
                className="flex w-24 shrink-0 flex-col items-center text-center md:w-32"
              >
                <div className="relative flex w-full items-center">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--accent)]/60 to-[var(--accent)]" />
                  <ChevronRight size={14} className="-ml-1 text-[var(--accent)]" />
                </div>
                <span className="mt-1.5 text-[10px] leading-tight text-white/55">{child.detail ?? "—"}</span>
              </motion.div>
              <Branch node={child} current={current} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stage({ node, current, index }: { node: EvolutionNode; current: number; index: number }) {
  const shiny = useCollection((s) => s.prefs.shiny);
  const active = node.id === current;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.18, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
    >
      <Link
        href={`/pokemon/${node.id}`}
        aria-current={active ? "page" : undefined}
        className={`group relative flex w-32 shrink-0 flex-col items-center rounded-2xl border p-3 transition md:w-40 ${
          active ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-white/10 bg-white/[0.02] hover:border-white/30"
        }`}
      >
        <span className="self-start font-mono text-[10px] text-white/40">{dexNumber(node.id)}</span>
        <PokeImage id={node.id} shiny={shiny} alt={prettyName(node.name)} className="h-24 w-24 object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,.5)] transition-transform duration-500 group-hover:scale-110 md:h-28 md:w-28" />
        <span className="display mt-1 text-xl text-white">{prettyName(node.name)}</span>
        {active && <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[var(--accent)]">Você está aqui</span>}
      </Link>
    </motion.div>
  );
}
