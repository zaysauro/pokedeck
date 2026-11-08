"use client";

import { motion } from "motion/react";
import { STAT_KEYS, STAT_LABEL } from "@/lib/constants";
import type { Stats } from "@/lib/types";

const MAX = 255;

function tone(v: number) {
  if (v >= 130) return "#5be3a1";
  if (v >= 100) return "#9be35b";
  if (v >= 70) return "#f2d04b";
  if (v >= 50) return "#f2964b";
  return "#ef5b5b";
}

export function StatBars({ stats, color }: { stats: Stats; color?: string }) {
  const total = stats.reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-3">
      {STAT_KEYS.map((k, i) => (
        <div key={k} className="grid grid-cols-[96px_44px_1fr] items-center gap-3 md:grid-cols-[120px_48px_1fr]">
          <span className="text-xs text-white/55">{STAT_LABEL[k].pt}</span>
          <span className="text-right font-mono text-sm tabular-nums text-white">{stats[i]}</span>
          <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: color ? `linear-gradient(90deg, ${color}, ${tone(stats[i])})` : tone(stats[i]) }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(stats[i] / MAX) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      ))}
      <div className="grid grid-cols-[96px_44px_1fr] items-center gap-3 border-t border-white/10 pt-3 md:grid-cols-[120px_48px_1fr]">
        <span className="text-xs uppercase tracking-wider text-white/55">Total</span>
        <span className="text-right font-mono text-sm font-semibold text-white">{total}</span>
        <span className="text-[11px] text-white/35">
          {total >= 600 ? "Nível lendário" : total >= 500 ? "Muito forte" : total >= 400 ? "Equilibrado" : "Em desenvolvimento"}
        </span>
      </div>
    </div>
  );
}
