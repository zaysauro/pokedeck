"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Maximize2, X } from "lucide-react";
import { rarityTier } from "@/lib/tcg/constants";
import { useTilt } from "@/hooks/useTilt";
import { TcgImage } from "./TcgImage";

/** The hero of the detail view: high-res scan, 3D tilt, foil glare and a full-screen zoom. */
export function CardArt({ image, name, rarity, priority }: { image: string | null; name: string; rarity?: string; priority?: boolean }) {
  const tilt = useTilt<HTMLDivElement>(16);
  const tier = rarityTier(rarity);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 30, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="group relative">
        <div ref={tilt.ref} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave} data-tier={tier} className="pcard tcg-card rounded-[4.5%]">
          <TcgImage base={image} alt={`Carta ${name}`} size="high" priority={priority} label={name} />
          <div className={`pcard-glare rounded-[4.5%] ${tier >= 2 ? "tcg-foil" : ""}`} />
        </div>
        {image && (
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="absolute bottom-3 right-3 flex h-9 items-center gap-1.5 rounded-full bg-black/60 px-3 text-xs text-white/80 opacity-0 backdrop-blur transition group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <Maximize2 size={13} /> Ampliar
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {zoom && image && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${name} ampliada`}
          >
            <button type="button" onClick={() => setZoom(false)} aria-label="Fechar" className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/70 hover:text-white">
              <X size={18} />
            </button>
            <motion.div initial={{ scale: 0.85, rotateY: -12 }} animate={{ scale: 1, rotateY: 0 }} exit={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 200, damping: 24 }} className="h-[min(88vh,1100px)] aspect-[63/88] max-w-full">
              <TcgImage base={image} alt={name} size="high" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
