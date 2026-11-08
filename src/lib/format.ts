import { TYPE_META } from "./constants";
import type { TypeName } from "./types";

const SPECIAL_NAMES: Record<string, string> = {
  "nidoran-f": "Nidoran♀", "nidoran-m": "Nidoran♂", "mr-mime": "Mr. Mime", "mime-jr": "Mime Jr.",
  "mr-rime": "Mr. Rime", "farfetchd": "Farfetch’d", "sirfetchd": "Sirfetch’d", "type-null": "Type: Null",
  "ho-oh": "Ho-Oh", "porygon-z": "Porygon-Z", "jangmo-o": "Jangmo-o", "hakamo-o": "Hakamo-o",
  "kommo-o": "Kommo-o", "flabebe": "Flabébé", "tapu-koko": "Tapu Koko", "tapu-lele": "Tapu Lele",
  "tapu-bulu": "Tapu Bulu", "tapu-fini": "Tapu Fini", "wo-chien": "Wo-Chien", "chien-pao": "Chien-Pao",
  "ting-lu": "Ting-Lu", "chi-yu": "Chi-Yu",
};

/** Turn an API slug ("great-tusk") into a display name ("Great Tusk"). */
export function prettyName(slug: string): string {
  if (SPECIAL_NAMES[slug]) return SPECIAL_NAMES[slug];
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const dexNumber = (id: number) => `#${String(id).padStart(4, "0")}`;

export const typePt = (t: TypeName) => TYPE_META[t]?.pt ?? t;

export const formatHeight = (dm: number) => `${(dm / 10).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} m`;
export const formatWeight = (hg: number) => `${(hg / 10).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;

export function cleanFlavor(text: string) {
  return text.replace(/[\f\n\r­]+/g, " ").replace(/\s+/g, " ").trim();
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

/** Normalizes text for accent-insensitive search. */
export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
