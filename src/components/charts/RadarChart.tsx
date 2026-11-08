"use client";

import { motion } from "motion/react";
import { STAT_KEYS, STAT_LABEL } from "@/lib/constants";
import type { Stats } from "@/lib/types";

interface Series {
  label: string;
  stats: Stats;
  color: string;
}

/** Hexagonal radar of the six base stats; supports overlaying several Pokémon. */
export function RadarChart({ series, size = 320, max = 200 }: { series: Series[]; size?: number; max?: number }) {
  const c = size / 2;
  const r = size / 2 - 42;
  const angle = (i: number) => (Math.PI * 2 * i) / 6 - Math.PI / 2;
  const point = (i: number, v: number) => {
    const rr = (Math.min(v, max) / max) * r;
    return [c + Math.cos(angle(i)) * rr, c + Math.sin(angle(i)) * rr];
  };
  const ring = (f: number) => STAT_KEYS.map((_, i) => point(i, max * f).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[360px]" role="img" aria-label="Gráfico radar de atributos">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="rgba(255,255,255,.08)" />
      ))}
      {STAT_KEYS.map((k, i) => {
        const [x, y] = point(i, max);
        const [lx, ly] = point(i, max * 1.2);
        return (
          <g key={k}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,.06)" />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-white/50 font-mono text-[10px]">
              {STAT_LABEL[k].short}
            </text>
          </g>
        );
      })}
      {series.map((s, si) => {
        const pts = s.stats.map((v, i) => point(i, v).join(",")).join(" ");
        return (
          <motion.polygon
            key={s.label + si}
            points={pts}
            fill={s.color}
            fillOpacity={series.length > 1 ? 0.14 : 0.28}
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: si * 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${c}px ${c}px` }}
          />
        );
      })}
    </svg>
  );
}
