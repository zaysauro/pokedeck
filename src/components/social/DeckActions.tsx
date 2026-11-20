"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { Bookmark, Heart, Share2 } from "lucide-react";
import { likeDeckAction, saveDeckBookmarkAction } from "@/app/actions/social";
import { copyText } from "@/lib/download";
import { toast } from "@/components/ui/Toast";

export function DeckActions({ deckId, title, likes, liked, saved, signedIn }: { deckId: string; title: string; likes: number; liked: boolean; saved: boolean; signedIn: boolean }) {
  const router = useRouter();
  const [l, setL] = useState({ on: liked, n: likes });
  const [s, setS] = useState(saved);
  const needAuth = () => router.push(`/entrar?next=${encodeURIComponent(`/d/${deckId}`)}`);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        aria-pressed={l.on}
        onClick={async () => {
          if (!signedIn) return needAuth();
          const next = !l.on;
          setL({ on: next, n: l.n + (next ? 1 : -1) });
          const r = await likeDeckAction(deckId, next);
          if (!r.ok) {
            setL({ on: !next, n: l.n });
            return toast(r.error, "warn");
          }
          setL({ on: next, n: r.data });
        }}
        className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition ${l.on ? "border-[#ff4d6d] bg-[#ff4d6d]/15 text-[#ff8fa3]" : "border-white/15 text-white/80 hover:border-white/40"}`}
      >
        <Heart size={15} fill={l.on ? "currentColor" : "none"} /> {l.n}
      </motion.button>
      <button
        type="button"
        aria-pressed={s}
        onClick={async () => {
          if (!signedIn) return needAuth();
          setS(!s);
          const r = await saveDeckBookmarkAction(deckId, !s);
          if (!r.ok) {
            setS(s);
            return toast(r.error, "warn");
          }
          toast(!s ? "Deck salvo nos favoritos" : "Removido dos salvos");
        }}
        className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm transition ${s ? "border-gold/60 bg-gold/15 text-gold" : "border-white/15 text-white/80 hover:border-white/40"}`}
      >
        <Bookmark size={15} fill={s ? "currentColor" : "none"} /> {s ? "Salvo" : "Salvar"}
      </button>
      <button
        type="button"
        onClick={async () => {
          const url = `${location.origin}/d/${deckId}`;
          if (navigator.share) {
            try {
              await navigator.share({ title: `${title} · PokéDeck`, url });
              return;
            } catch {
              /* cancelled → copy */
            }
          }
          toast((await copyText(url)) ? "Link do deck copiado" : "Não foi possível copiar", "ok");
        }}
        className="flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white/80 hover:border-white/40"
      >
        <Share2 size={15} /> Compartilhar
      </button>
    </>
  );
}
