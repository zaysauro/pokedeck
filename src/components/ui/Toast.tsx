"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface ToastMsg { id: number; text: string; tone?: "ok" | "warn" }
let push: ((t: Omit<ToastMsg, "id">) => void) | null = null;

export function toast(text: string, tone: ToastMsg["tone"] = "ok") {
  push?.({ text, tone });
}

export function ToastHost() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    push = (t) => {
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { ...t, id }]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 2600);
    };
    return () => { push = null; };
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-8" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.95 }}
            className={`rounded-full border px-4 py-2 text-sm shadow-xl backdrop-blur-xl ${t.tone === "warn" ? "border-amber-400/30 bg-amber-950/80 text-amber-100" : "border-white/10 bg-ink-3/90 text-white"}`}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
