import { TYPE_META } from "@/lib/constants";
import type { TypeName } from "@/lib/types";
import type { TcgFilters, TcgSort } from "./types";

/** TCGdex language used for physical cards released in Brazil. ("pt-br" only holds TCG Pocket.) */
export const TCG_LANG = "pt";
export const TCG_PAGE_SIZE = 36;

/** Card energy types (as written by TCGdex "pt") → Pokédex palette. */
export const TCG_TYPE_TO_POKEDEX: Record<string, TypeName> = {
  Fogo: "fire", "Água": "water", Planta: "grass", "Elétrico": "electric", "Psíquico": "psychic",
  Lutador: "fighting", Sombrio: "dark", Metal: "steel", "Dragão": "dragon", Fada: "fairy", Incolor: "normal",
};

export function tcgTypeColor(type?: string): string {
  const t = type ? TCG_TYPE_TO_POKEDEX[type] : undefined;
  return t ? TYPE_META[t].color : "#a8a29a";
}

/**
 * Visual finish tiers for rarities that exist in TCGdex. The rarity label itself is always
 * shown exactly as the source writes it; tiers only drive the presentation.
 */
const TIER_3 = ["Ilustração Rara Especial", "Hiper rara", "Mega Hiper Raro", "Rare Secreta", "Brilhante Ultra Rara"];
const TIER_2 = [
  "Ilustração Rara", "Ultra Rara", "Arte Completa de Treinador", "Shiny rara", "Shiny rara V", "Shiny rara VMAX",
  "Rara Holo VMAX", "Rara Holo VSTAR", "Raras Incríveis", "Rara Radiante", "Mega Attack Rare",
];
const TIER_1 = ["Rara Dupla", "Rara Holo", "Rara Holo V", "ACE SPEC Raro", "Rara Preto e Branco", "Pikachu Rare", "RGB Rare", "Futuristic Rare"];

export type RarityTier = 0 | 1 | 2 | 3;
export function rarityTier(rarity?: string | null): RarityTier {
  if (!rarity) return 0;
  if (TIER_3.includes(rarity)) return 3;
  if (TIER_2.includes(rarity)) return 2;
  if (TIER_1.includes(rarity)) return 1;
  return 0;
}

/** Rarities showcased in the "special cards" section, in order. */
export const SPECIAL_RARITIES = ["Ilustração Rara Especial", "Hiper rara", "Ilustração Rara", "Ultra Rara", "Rare Secreta"];

/** Hand-picked fan favourites (verified ids in the "pt" catalog). */
export const POPULAR_CARD_IDS = [
  "sv03.5-199", "sv08-238", "swsh7-215", "sv03.5-205", "sv06-214", "me01-178", "swsh7-218", "sv03.5-173", "sv04.5-232",
];

export const SORT_OPTIONS: { key: TcgSort; label: string }[] = [
  { key: "recent", label: "Mais recentes" },
  { key: "oldest", label: "Mais antigas" },
  { key: "name", label: "Ordem alfabética" },
  { key: "hp-desc", label: "Maior HP" },
  { key: "hp-asc", label: "Menor HP" },
];

export const DEFAULT_TCG_FILTERS: TcgFilters = {
  q: "", serie: "", set: "", category: "", rarity: "", type: "", illustrator: "", stage: "",
  hpMin: null, hpMax: null, sort: "recent", page: 1, images: true,
};

export const cardImage = (base: string | null | undefined, size: "low" | "high" = "low") =>
  base ? `${base}/${size}.webp` : null;

export const assetPng = (base: string | null | undefined) => (base ? `${base}.png` : null);
