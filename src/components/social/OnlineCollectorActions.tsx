"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BookMarked, Minus, Plus, Search } from "lucide-react";
import { addItemAction, addWantAction } from "@/app/actions/social";
import { LANGUAGES, VARIANTS } from "@/lib/social/types";
import type { TcgCard } from "@/lib/tcg/types";
import { refreshSession, useSession } from "@/hooks/useSession";
import { toast } from "@/components/ui/Toast";

const sel = "h-10 w-full rounded-xl border border-white/10 bg-ink px-3 text-sm text-white outline-none [&>option]:bg-ink-2";

/** Card page → Minha Coleção / Procurando (online, account-based). Shown only when signed in. */
export function OnlineCollectorActions({ card }: { card: TcgCard }) {
  const s = useSession();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ quantity: 1, for_trade: 0, language: "pt", variant: card.variants?.holo && !card.variants?.normal ? "holo" : "normal" });
  const [busy, setBusy] = useState(false);
  if (!s.loaded || !s.enabled) return null;

  const snap = {
    card_id: card.id, card_name: card.name, card_image: card.image, set_id: card.set.id, set_name: card.set.name,
    local_id: card.localId, rarity: card.rarity && card.rarity !== "None" ? card.rarity : null, card_type: card.types?.[0] ?? card.category,
  };

  if (!s.viewer) {
    return (
      <p className="mt-4 text-xs text-white/45">
        <Link href={`/entrar?next=${encodeURIComponent(`/cards/${card.id}`)}`} className="text-[var(--accent)] hover:underline">Entre</Link> para cadastrar esta carta na sua coleção online e encontrar trocas.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <BookMarked size={15} className="text-[var(--accent)]" />
        <span className="text-sm text-white">Minha Coleção online</span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs text-ink"><Plus size={13} /> Tenho</button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await addWantAction({ ...snap, language: null, variant: null, quantity: 1 });
              setBusy(false);
              if (!r.ok) return toast(r.error, "warn");
              toast("Adicionada a “Procurando” — avisaremos sobre matches");
              void refreshSession();
            }}
            className="flex h-9 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-xs text-white/80 hover:border-white/40"
          >
            <Search size={13} /> Procuro
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const r = await addItemAction({ ...snap, ...f });
              setBusy(false);
              if (!r.ok) return toast(r.error, "warn");
              toast(`${card.name} adicionada à sua coleção`);
              setOpen(false);
              void refreshSession();
            }}
          >
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Num label="Cópias" value={f.quantity} min={1} max={999} onChange={(v) => setF({ ...f, quantity: v, for_trade: Math.min(f.for_trade, v) })} />
              <Num label="Para troca" value={f.for_trade} min={0} max={f.quantity} onChange={(v) => setF({ ...f, for_trade: v })} />
              <label><span className="eyebrow">Idioma</span>
                <select className={`${sel} mt-1`} value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}>{LANGUAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              </label>
              <label><span className="eyebrow">Variante</span>
                <select className={`${sel} mt-1`} value={f.variant} onChange={(e) => setF({ ...f, variant: e.target.value })}>{VARIANTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              </label>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button disabled={busy} className="h-10 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--on-accent)] disabled:opacity-50">Adicionar</button>
              <Link href="/colecao" className="text-xs text-white/45 hover:text-white">Gerenciar coleção →</Link>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Num({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <span className="eyebrow">{label}</span>
      <div className="mt-1 flex h-10 items-center justify-between rounded-xl border border-white/10">
        <button type="button" aria-label={`Diminuir ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-10 w-9 place-items-center text-white/60 disabled:opacity-25"><Minus size={13} /></button>
        <span className="font-mono text-sm">{value}</span>
        <button type="button" aria-label={`Aumentar ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-10 w-9 place-items-center text-white/60 disabled:opacity-25"><Plus size={13} /></button>
      </div>
    </div>
  );
}
