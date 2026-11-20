"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";

/** Shown when TCGdex is unreachable while rendering a /cards page. */
export default function CardsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Cartas TCG</p>
      <h1 className="display mt-4 text-6xl">Baralho <em className="italic text-[var(--accent)]">embaralhado</em></h1>
      <p className="mt-4 text-white/55">A base de cartas (TCGdex) não respondeu agora. A Pokédex e seus decks continuam funcionando normalmente.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm text-ink"><RotateCw size={14} /> Tentar novamente</button>
        <Link href="/" className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/80">Voltar ao início</Link>
      </div>
    </div>
  );
}
