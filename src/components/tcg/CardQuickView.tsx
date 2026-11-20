"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, RotateCw, X } from "lucide-react";
import type { TcgCard, TcgCardBrief } from "@/lib/tcg/types";
import { CardArt } from "./CardArt";
import { CardInfo } from "./CardInfo";
import { CollectorActions } from "./CollectorActions";

const cardCache = new Map<string, TcgCard>();

/** Modal "examine the card" view used by lists; the full page lives at /cards/[id]. */
export function CardQuickView({ card, onClose }: { card: TcgCardBrief | null; onClose: () => void }) {
  const [full, setFull] = useState<TcgCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!card) return;
    setError(null);
    const hit = cardCache.get(card.id);
    setFull(hit ?? null);
    if (hit) return;
    const ctrl = new AbortController();
    fetch(`/api/tcg?id=${encodeURIComponent(card.id)}`, { signal: ctrl.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error ?? "Não foi possível abrir a carta.");
        cardCache.set(card.id, d);
        setFull(d);
      })
      .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    return () => ctrl.abort();
  }, [card, nonce]);

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [card, onClose]);

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          className="fixed inset-0 z-[75] overflow-y-auto bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={card.name}
        >
          <div className="flex min-h-full items-start justify-center px-4 pb-28 pt-20 md:items-center md:py-12">
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative grid w-full max-w-5xl gap-8 rounded-[28px] border border-white/10 bg-ink-2 p-5 shadow-2xl md:grid-cols-[minmax(240px,0.85fr)_1.3fr] md:p-8"
            >
              <button type="button" onClick={onClose} aria-label="Fechar carta" className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/40 text-white/70 hover:text-white">
                <X size={17} />
              </button>
              <div className="mx-auto w-full max-w-[340px] md:sticky md:top-0 md:self-start">
                <CardArt image={full?.image ?? card.image} name={card.name} rarity={full?.rarity} priority />
              </div>
              <div className="min-w-0">
                {error ? (
                  <div className="py-10">
                    <p className="display text-4xl">{card.name}</p>
                    <p className="mt-3 text-sm text-red-200">{error}</p>
                    <button type="button" onClick={() => setNonce((n) => n + 1)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-ink"><RotateCw size={14} /> Tentar novamente</button>
                  </div>
                ) : full ? (
                  <>
                    <CardInfo card={full} headingLevel={2} />
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      <CollectorActions card={full} compact />
                      <Link href={`/cards/${encodeURIComponent(full.id)}`} className="ml-auto flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-white/70 hover:text-white">
                        Página da carta <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="skeleton h-3 w-40 rounded" />
                    <div className="skeleton h-14 w-3/4 rounded-lg" />
                    <div className="flex gap-2"><div className="skeleton h-7 w-24 rounded" /><div className="skeleton h-7 w-24 rounded" /></div>
                    <div className="skeleton h-16 w-full rounded-xl" />
                    <div className="skeleton h-40 w-full rounded-xl" />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
