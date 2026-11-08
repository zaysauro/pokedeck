"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { motion } from "motion/react";
import type { IndexEntry } from "@/lib/types";
import { CardSkeleton, PokeCard } from "@/components/cards/PokeCard";

const GAP = 16;

function columnsFor(width: number) {
  if (width < 520) return 2;
  if (width < 800) return 3;
  if (width < 1080) return 4;
  if (width < 1320) return 5;
  return 6;
}

/**
 * Window-virtualized card grid: only the rows near the viewport are mounted,
 * so scrolling the whole National Dex (1000+ cards) stays smooth.
 */
export function VirtualGrid({
  items,
  renderCard,
}: {
  items: IndexEntry[];
  renderCard?: (e: IndexEntry) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      setWidth(el.clientWidth);
      setOffset(el.getBoundingClientRect().top + window.scrollY);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cols = columnsFor(width);
  const cardW = (width - GAP * (cols - 1)) / cols;
  const rowH = cardW * 1.4 + GAP;
  const rows = Math.ceil(items.length / cols);

  const v = useWindowVirtualizer({
    count: rows,
    estimateSize: () => rowH,
    overscan: 3,
    scrollMargin: offset,
  });

  useEffect(() => {
    v.measure();
  }, [rowH, v]);

  return (
    <div ref={ref} className="relative w-full" style={{ height: v.getTotalSize() }}>
      {v.getVirtualItems().map((row) => {
        const slice = items.slice(row.index * cols, row.index * cols + cols);
        return (
          <div
            key={row.key}
            className="absolute left-0 top-0 grid w-full"
            style={{
              transform: `translateY(${row.start - v.options.scrollMargin}px)`,
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gap: GAP,
              height: rowH - GAP,
            }}
          >
            {slice.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 24, rotate: -1.5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.5, delay: i * 0.035, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderCard ? renderCard(e) : <PokeCard data={e} href={`/pokemon/${e.id}`} />}
              </motion.div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
