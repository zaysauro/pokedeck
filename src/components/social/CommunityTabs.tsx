"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function CommunityTabs({ tabs, active }: { tabs: { key: string; label: string }[]; active: string }) {
  return (
    <nav aria-label="Explorar" className="no-scrollbar sticky top-[76px] z-20 -mx-4 flex gap-1 overflow-x-auto border-y border-white/10 bg-ink/85 px-4 py-2 backdrop-blur-xl md:-mx-6 md:px-6">
      {tabs.map((t) => (
        <Link key={t.key} href={`/comunidade?tab=${t.key}`} scroll={false} aria-current={active === t.key ? "page" : undefined} className={`relative shrink-0 rounded-full px-4 py-2 text-sm transition ${active === t.key ? "text-ink" : "text-white/55 hover:text-white"}`}>
          {active === t.key && <motion.span layoutId="explore-tab" className="absolute inset-0 rounded-full bg-white" />}
          <span className="relative">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
