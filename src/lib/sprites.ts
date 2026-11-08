/**
 * Image URLs from the PokeAPI/sprites repository.
 * https://github.com/PokeAPI/sprites — served through raw.githubusercontent.com.
 * Every helper returns an ordered list so <PokeImage> can fall back automatically.
 */
const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export type ArtStyle = "artwork" | "home" | "showdown" | "dream" | "sprite";

export function spriteUrl(id: number, style: ArtStyle, shiny = false): string {
  const s = shiny ? "shiny/" : "";
  switch (style) {
    case "artwork":
      return `${BASE}/other/official-artwork/${s}${id}.png`;
    case "home":
      return `${BASE}/other/home/${s}${id}.png`;
    case "showdown":
      return `${BASE}/other/showdown/${s}${id}.gif`;
    case "dream":
      return `${BASE}/other/dream-world/${id}.svg`;
    case "sprite":
      return `${BASE}/${s}${id}.png`;
  }
}

/** Ordered fallback chain starting with the preferred style. */
export function spriteChain(id: number, preferred: ArtStyle = "artwork", shiny = false): string[] {
  const order: ArtStyle[] = [preferred, "artwork", "home", "sprite"];
  const urls: string[] = [];
  for (const style of order) {
    urls.push(spriteUrl(id, style, shiny));
    if (shiny) urls.push(spriteUrl(id, style, false));
  }
  return [...new Set(urls)];
}

export const PLACEHOLDER_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="4"/><path d="M12 50h76" stroke="rgba(255,255,255,.25)" stroke-width="4"/><circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="4"/></svg>`,
  );
