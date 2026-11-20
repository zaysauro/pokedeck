"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Flag, X } from "lucide-react";
import { reportAction } from "@/app/actions/social";
import { toast } from "@/components/ui/Toast";

const REASONS = [
  ["spam", "Spam"], ["abuse", "Assédio ou ofensa"], ["fraud", "Golpe ou fraude"], ["inappropriate", "Conteúdo impróprio"], ["other", "Outro"],
] as const;

/** Report dialog shared by users, messages, comments, decks and collections. */
export function ReportButton({ type, id, label = "Denunciar", compact }: { type: "user" | "message" | "comment" | "deck" | "collection"; id: string; label?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={compact ? "text-[11px] text-white/35 hover:text-red-300" : "flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3 text-xs text-white/60 hover:border-red-400/40 hover:text-red-300"}>
        <Flag size={compact ? 11 : 13} /> {label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
            <motion.form
              initial={{ y: 20, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 10, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                const r = await reportAction(type, id, reason, details);
                setBusy(false);
                if (!r.ok) return toast(r.error, "warn");
                toast("Denúncia enviada. Obrigado por ajudar a comunidade.");
                setOpen(false);
              }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-ink-2 p-6"
              role="dialog"
              aria-label="Denunciar"
            >
              <div className="flex items-center justify-between">
                <p className="display text-3xl">Denunciar</p>
                <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-white/50 hover:text-white"><X size={18} /></button>
              </div>
              <div className="mt-4 space-y-1.5">
                {REASONS.map(([k, l]) => (
                  <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${reason === k ? "border-red-400/50 bg-red-500/10 text-white" : "border-white/10 text-white/70"}`}>
                    <input type="radio" name="reason" value={k} checked={reason === k} onChange={() => setReason(k)} className="accent-red-400" /> {l}
                  </label>
                ))}
              </div>
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} rows={3} placeholder="Detalhes (opcional)" className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-ink p-3 text-sm outline-none focus:border-white/30" />
              <button disabled={busy} className="mt-4 h-11 w-full rounded-full bg-red-500/90 text-sm font-medium text-white disabled:opacity-50">{busy ? "Enviando…" : "Enviar denúncia"}</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
