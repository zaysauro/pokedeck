"use client";

import { useEffect, useState } from "react";

/** Two-step destructive button: first click arms it, second click confirms. */
export function ConfirmButton({ onConfirm, label, confirmLabel, children, className = "" }: {
  onConfirm: () => void;
  label: string;
  confirmLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      title={label}
      aria-label={armed ? `Confirmar: ${label}` : label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (armed) onConfirm();
        else setArmed(true);
      }}
      className={`flex h-10 items-center justify-center gap-1.5 rounded-full border transition ${
        armed ? "border-red-400 bg-red-500/20 px-3 text-xs text-red-200" : "w-10 border-white/15 text-white/70 hover:border-red-400/50 hover:text-red-300"
      } ${className}`}
    >
      {children}
      {armed && confirmLabel}
    </button>
  );
}
