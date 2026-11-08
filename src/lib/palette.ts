import type { CSSProperties } from "react";
import { SPECIES_COLOR_HEX, TYPE_META } from "./constants";
import type { TypeName } from "./types";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function mix(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export interface Palette {
  primary: string;
  secondary: string;
  deep: string;
  light: string;
  /** readable text colour on top of `primary` */
  onPrimary: string;
}

/**
 * Builds a palette from the Pokémon's types (and optional species colour).
 * Primary comes from the main type; secondary from the second type, or from the
 * species colour, so mono-type Pokémon still get a two-tone identity.
 */
export function paletteFor(types: TypeName[], speciesColor?: string | null): Palette {
  const a = TYPE_META[types[0] ?? "normal"];
  const second = types[1] ? TYPE_META[types[1]].color : speciesColor ? SPECIES_COLOR_HEX[speciesColor] : undefined;
  const secondary = second ?? mix(a.color, "#ffffff", 0.35);
  return {
    primary: a.color,
    secondary,
    deep: a.deep,
    light: a.light,
    onPrimary: luminance(a.color) > 0.45 ? "#121212" : "#ffffff",
  };
}

export function paletteVars(p: Palette): CSSProperties {
  return {
    ["--accent" as string]: p.primary,
    ["--accent-2" as string]: p.secondary,
    ["--accent-deep" as string]: p.deep,
    ["--accent-light" as string]: p.light,
    ["--on-accent" as string]: p.onPrimary,
  } as CSSProperties;
}
