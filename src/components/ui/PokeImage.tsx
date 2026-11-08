"use client";

import { useEffect, useRef, useState } from "react";
import { PLACEHOLDER_SVG, spriteChain, type ArtStyle } from "@/lib/sprites";

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "id"> {
  id: number;
  style_?: ArtStyle;
  shiny?: boolean;
  /** Explicit URLs tried before the generated chain */
  sources?: (string | null | undefined)[];
  priority?: boolean;
}

/**
 * <img> with automatic fallback across sprite sets
 * (preferred → official artwork → HOME → classic sprite → placeholder).
 * Plain <img> on purpose: images come straight from the sprites CDN and are
 * already optimized PNGs, so we avoid re-encoding thousands of files.
 */
export function PokeImage({ id, style_ = "artwork", shiny = false, sources, priority, alt, className, ...rest }: Props) {
  const chain = [...(sources?.filter(Boolean) as string[] | undefined ?? []), ...spriteChain(id, style_, shiny)];
  const key = chain.join("|");
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setI(0);
    setLoaded(false);
  }, [key]);

  const src = i < chain.length ? chain[i] : PLACEHOLDER_SVG;

  // SSR'd images can finish (or fail) before hydration attaches handlers.
  useEffect(() => {
    const img = ref.current;
    if (!img || !img.complete) return;
    if (img.naturalWidth > 0) setLoaded(true);
    else setI((n) => n + 1);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      ref={ref}
      src={src}
      alt={alt ?? ""}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => setI((n) => n + 1)}
      className={`${className ?? ""} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
    />
  );
}
