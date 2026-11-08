"use client";

import { motion } from "motion/react";

export function PageHeader({ eyebrow, title, italic, children }: { eyebrow: string; title: string; italic?: string; children?: React.ReactNode }) {
  return (
    <header className="relative pb-8 pt-32 md:pt-40">
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eyebrow">
        {eyebrow}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="display mt-3 text-[56px] text-white md:text-[96px] lg:text-[120px]"
      >
        {title} {italic && <em className="italic text-[var(--accent)]">{italic}</em>}
      </motion.h1>
      {children && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
          {children}
        </motion.div>
      )}
    </header>
  );
}

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-4 md:px-6 ${className}`}>{children}</div>;
}
