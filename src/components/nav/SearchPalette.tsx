"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BookOpen, CornerDownLeft, Search } from "lucide-react";
import { searchEntries, usePokedex } from "@/hooks/usePokedex";
import { dexNumber } from "@/lib/format";
import { PokeImage } from "@/components/ui/PokeImage";
import { TypeDot } from "@/components/ui/TypeBadge";

/* tiny global store for open/close */
let isOpen = false;
const subs = new Set<() => void>();
const setOpen = (v: boolean) => {
  isOpen = v;
  subs.forEach((s) => s());
};
const api = { open: () => setOpen(true), close: () => setOpen(false), get isOpen() { return isOpen; } };
export function useSearchPalette<T>(sel: (a: typeof api) => T): T {
  useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    () => isOpen,
    () => false,
  );
  return sel(api);
}

export function SearchPalette() {
  const open = useSearchPalette((a) => a.isOpen);
  const router = useRouter();
  const { entries, loading } = usePokedex();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchEntries(entries, q, 8), [entries, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
      if (e.key === "/" && !isOpen && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const go = (path: string) => {
    api.close();
    router.push(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={api.close}
          role="dialog"
          aria-modal="true"
          aria-label="Busca global"
        >
          <motion.div
            initial={{ y: -16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-ink-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search size={18} className="text-white/40" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") api.close();
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                  if (e.key === "Enter") {
                    if (results[active]) go(`/pokemon/${results[active].id}`);
                    else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
                  }
                }}
                placeholder="Nome ou número — ex.: Gengar, 25, #0448"
                className="h-14 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/30"
                aria-label="Buscar Pokémon"
              />
              <kbd className="rounded border border-white/15 px-1.5 font-mono text-[10px] text-white/40">ESC</kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {loading && <li className="px-3 py-6 text-center text-sm text-white/40">Carregando a Pokédex…</li>}
              {!loading && q && results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-white/40">Nenhum Pokémon encontrado para “{q}”.</li>
              )}
              {!q && !loading && <li className="px-3 py-4 text-sm text-white/40">Digite para buscar entre {entries.length.toLocaleString("pt-BR")} espécies.</li>}
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(`/pokemon/${r.id}`)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${active === i ? "bg-white/[0.07]" : ""}`}
                  >
                    <PokeImage id={r.id} style_="sprite" className="h-10 w-10 object-contain [image-rendering:pixelated]" alt="" />
                    <span className="font-mono text-xs text-white/40">{dexNumber(r.id)}</span>
                    <span className="flex-1 text-sm text-white">{r.display}</span>
                    <span className="flex gap-1">{r.types.map((t) => <TypeDot key={t} type={t} />)}</span>
                    {active === i && <CornerDownLeft size={14} className="text-white/40" />}
                  </button>
                </li>
              ))}
              {q && results.length > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)}
                    className={`mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/[0.05] ${active === results.length ? "bg-white/[0.07]" : ""}`}
                  >
                    Ver todos os resultados <ArrowRight size={14} />
                  </button>
                </li>
              )}
              {q.trim() && (
                <li>
                  <button
                    type="button"
                    onClick={() => go(`/cards?q=${encodeURIComponent(q.trim())}#explorar`)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/[0.05]"
                  >
                    <span className="flex items-center gap-2"><BookOpen size={14} className="text-gold" /> Buscar “{q.trim()}” nas Cartas TCG</span>
                    <ArrowRight size={14} />
                  </button>
                </li>
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
