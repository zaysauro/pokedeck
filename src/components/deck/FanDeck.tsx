"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import type { CardData } from "@/components/cards/PokeCard";
import { PokeCard } from "@/components/cards/PokeCard";

interface Props {
  members: (CardData & { key: string })[];
  /** index of the expanded card, or null */
  selected?: number | null;
  onSelect?: (i: number | null) => void;
  /** total slots to show (ghost slots are drawn for the empty ones) */
  slots?: number;
  onEmptyClick?: () => void;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  /** optional custom face (e.g. a real TCG card); defaults to the Pokédex collectible card */
  renderCard?: (member: CardData & { key: string }, index: number, select: () => void) => React.ReactNode;
  className?: string;
}

/**
 * Cards held like a hand: overlapping, rotated around a common pivot below the deck,
 * with 3D lift on hover, neighbour push-away, and a selected card that rises to the front.
 */
export function FanDeck({
  members, selected = null, onSelect, slots = 0, onEmptyClick, size = "lg", interactive = true, className = "", renderCard,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const ghosts = Math.max(0, slots - members.length);
  const n = members.length + ghosts;
  const maxW = size === "lg" ? 230 : size === "md" ? 170 : 104;
  const cardW = Math.min(maxW, width / (n <= 2 ? 2.4 : 1.4 + n * 0.42));
  const cardH = cardW * 1.4;
  const step = Math.min(cardW * 0.62, (width - cardW) / Math.max(1, n - 1));
  const angle = n <= 1 ? 0 : Math.min(9, 44 / n);
  const active = selected ?? hover;

  const layout = (i: number) => {
    const c = i - (n - 1) / 2;
    let x = c * step;
    let rotate = c * angle;
    let y = Math.abs(c) ** 2 * (cardW * 0.035);
    let scale = 1;
    let z = 10 + i;
    let dim = false;

    if (active !== null) {
      const d = i - active;
      if (d === 0) {
        y -= selected !== null ? cardH * 0.12 : cardH * 0.08;
        scale = selected !== null ? 1.14 : 1.06;
        rotate *= selected !== null ? 0 : 0.4;
        if (selected !== null) x = x * 0.6;
        z = 50;
      } else {
        x += Math.sign(d) * cardW * (selected !== null ? 0.32 : 0.18) / Math.max(1, Math.abs(d) * 0.8);
        dim = selected !== null;
      }
    }
    return { x, y, rotate, scale, z, dim };
  };

  return (
    <div
      ref={ref}
      className={`relative w-full [overflow-x:clip] ${className}`}
      style={{ height: width ? cardH * 1.32 + (size === "sm" ? 0 : 24) : maxW * 1.6, perspective: 1400 }}
      onPointerLeave={() => setHover(null)}
    >
      {width > 0 && (
      <AnimatePresence initial={true} mode="popLayout">
        {members.map((m, i) => {
          const L = layout(i);
          return (
            <motion.div
              key={m.key}
              className="absolute bottom-6 left-1/2"
              style={{ width: cardW, marginLeft: -cardW / 2, zIndex: L.z, transformOrigin: "50% 120%" }}
              initial={{ opacity: 0, y: 160, rotate: 0, x: 0, scale: 0.8 }}
              animate={{ opacity: L.dim ? 0.45 : 1, x: L.x, y: L.y, rotate: L.rotate, scale: L.scale, filter: L.dim ? "saturate(0.5) brightness(.7)" : "saturate(1) brightness(1)" }}
              exit={{ opacity: 0, y: -cardH * 0.6, rotate: L.rotate * 3, scale: 0.7, transition: { duration: 0.35 } }}
              transition={{ type: "spring", stiffness: 210, damping: 24, mass: 0.9, delay: 0 }}
              onHoverStart={() => interactive && setHover(i)}
              onHoverEnd={() => interactive && setHover((h) => (h === i ? null : h))}
            >
              <div style={{ boxShadow: "0 30px 60px -20px rgba(0,0,0,.7)" }} className="rounded-[var(--radius-card)]">
                {renderCard ? (
                  renderCard(m, i, () => onSelect?.(selected === i ? null : i))
                ) : (
                  <PokeCard
                    data={m}
                    size={cardW >= 160 ? "md" : "sm"}
                    showFavorite={false}
                    onClick={interactive && onSelect ? () => onSelect(selected === i ? null : i) : undefined}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
        {Array.from({ length: ghosts }, (_, g) => {
          const i = members.length + g;
          const L = layout(i);
          return (
            <motion.button
              key={`ghost-${g}`}
              type="button"
              onClick={onEmptyClick}
              aria-label="Adicionar Pokémon a este espaço"
              className="absolute bottom-6 left-1/2 grid place-items-center rounded-[var(--radius-card)] border border-dashed border-white/20 bg-white/[0.02] text-white/40 backdrop-blur-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ width: cardW, height: cardH, marginLeft: -cardW / 2, zIndex: L.z, transformOrigin: "50% 120%" }}
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: L.dim ? 0.3 : 1, x: L.x, y: L.y, rotate: L.rotate, scale: L.scale }}
              exit={{ opacity: 0 }}
              onHoverStart={() => interactive && setHover(i)}
            >
              <span className="flex flex-col items-center gap-2">
                <Plus size={size === "sm" ? 16 : 22} />
                {size !== "sm" && <span className="font-mono text-[10px] uppercase tracking-widest">Slot {i + 1}</span>}
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
      )}
    </div>
  );
}
