"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, Layers, Plus } from "lucide-react";
import { collection, MAX_TEAM, useCollection } from "@/hooks/useCollection";
import { toast } from "@/components/ui/Toast";

export function AddToTeamMenu({ pokemonId, name, className = "", compact }: { pokemonId: number; name: string; className?: string; compact?: boolean }) {
  const teams = useCollection((s) => s.teams);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const add = (teamId: string, teamName: string) => {
    const ok = collection.addToTeam(teamId, pokemonId);
    toast(ok ? `${name} entrou em “${teamName}”` : `“${teamName}” já tem ${MAX_TEAM} Pokémon`, ok ? "ok" : "warn");
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        aria-expanded={open}
        className={compact
          ? "grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/70 backdrop-blur hover:text-white"
          : "flex h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--on-accent)] transition hover:brightness-110"}
        aria-label="Adicionar a um deck"
      >
        <Layers size={compact ? 14 : 16} />
        {!compact && "Adicionar ao deck"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-ink-2 p-1.5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {teams.length === 0 && <p className="px-3 py-2 text-xs text-white/45">Você ainda não tem decks.</p>}
            <div className="max-h-56 overflow-y-auto">
              {teams.map((t) => {
                const has = t.members.includes(pokemonId);
                const full = t.members.length >= MAX_TEAM;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={full}
                    onClick={(e) => { e.preventDefault(); add(t.id, t.name); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="flex-1 truncate">{t.name}</span>
                    {has && <Check size={13} className="text-emerald-300" />}
                    <span className="font-mono text-[10px] text-white/40">{t.members.length}/{MAX_TEAM}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const t = collection.createTeam({ name: `Deck de ${name}`, members: [pokemonId], coverId: pokemonId });
                setOpen(false);
                router.push(`/teams/${t.id}`);
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-white/10 px-3 py-2 text-left text-sm text-[var(--accent)] hover:bg-white/[0.06]"
            >
              <Plus size={14} /> Novo deck com {name}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
