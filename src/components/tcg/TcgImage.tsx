"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen } from "lucide-react";
import { cardImage } from "@/lib/tcg/constants";

interface Props {
  base: string | null;
  alt: string;
  size?: "low" | "high";
  priority?: boolean;
  className?: string;
  /** shown on the placeholder when the scan is missing */
  label?: string;
}

/**
 * Card scan from the TCGdex CDN (already-optimized WebP, served directly).
 * Falls back from high → low resolution and finally to a styled "card back".
 */
export function TcgImage({ base, alt, size = "low", priority, className = "", label }: Props) {
  const chain = [cardImage(base, size), size === "high" ? cardImage(base, "low") : null].filter(Boolean) as string[];
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const src = chain[i];

  useEffect(() => {
    setI(0);
    setLoaded(false);
  }, [base, size]);

  useEffect(() => {
    const img = ref.current;
    if (!img || !img.complete) return;
    if (img.naturalWidth > 0) setLoaded(true);
    else setI((n) => n + 1);
  }, [src]);

  if (!src) {
    return (
      <div className={`flex aspect-[63/88] w-full flex-col items-center justify-center gap-3 rounded-[4.5%] border border-white/10 bg-[radial-gradient(circle_at_50%_40%,#2a1c12,#0f0f12_70%)] p-4 text-center ${className}`}>
        <BookOpen size={22} className="text-gold/60" />
        <span className="display text-lg leading-tight text-white/70">{label ?? alt}</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Imagem indisponível</span>
      </div>
    );
  }

  return (
    <div className={`relative aspect-[63/88] w-full ${className}`}>
      {!loaded && <div className="skeleton absolute inset-0 rounded-[4.5%]" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setI((n) => n + 1)}
        className={`absolute inset-0 h-full w-full rounded-[4.5%] object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
