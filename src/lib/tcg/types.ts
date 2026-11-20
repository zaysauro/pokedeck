/** Domain types for the Pokémon TCG section (data from TCGdex, language "pt"). */

export interface TcgCardBrief {
  id: string; // e.g. "sv03.5-199"
  localId: string; // number inside the set, e.g. "199"
  name: string;
  image: string | null; // base asset URL, append "/low.webp" or "/high.webp"
  setId: string;
  setName: string | null;
  serieId: string | null;
}

export interface TcgAttack {
  name: string;
  cost?: string[];
  damage?: string | number;
  effect?: string;
}

export interface TcgCard {
  id: string;
  localId: string;
  name: string;
  image: string | null;
  category: string; // Pokémon | Treinador | Energia
  illustrator?: string;
  rarity?: string;
  hp?: number;
  types?: string[];
  stage?: string;
  suffix?: string;
  evolveFrom?: string;
  description?: string;
  level?: string | number;
  dexId?: number[];
  attacks?: TcgAttack[];
  abilities?: { type?: string; name: string; effect?: string }[];
  weaknesses?: { type: string; value?: string }[];
  resistances?: { type: string; value?: string }[];
  retreat?: number;
  effect?: string; // trainer / energy text
  trainerType?: string;
  energyType?: string;
  regulationMark?: string;
  legal?: { standard?: boolean; expanded?: boolean };
  variants?: Record<string, boolean>;
  set: { id: string; name: string; logo?: string; symbol?: string; cardCount?: { official?: number; total?: number } };
}

export interface TcgSetInfo {
  id: string;
  name: string;
  logo: string | null;
  symbol: string | null;
  serieId: string;
  serieName: string;
  /** chronological order across the whole catalog (higher = newer) */
  rank: number;
  official: number | null;
  total: number | null;
}

export interface TcgSerieInfo {
  id: string;
  name: string;
  sets: TcgSetInfo[];
}

export interface TcgMeta {
  series: TcgSerieInfo[];
  rarities: string[];
  types: string[];
  stages: string[];
  categories: string[];
  illustrators: string[];
}

export type TcgSort = "recent" | "oldest" | "name" | "hp-desc" | "hp-asc";

export interface TcgFilters {
  q: string;
  serie: string;
  set: string;
  category: string;
  rarity: string;
  type: string;
  illustrator: string;
  stage: string;
  hpMin: number | null;
  hpMax: number | null;
  sort: TcgSort;
  page: number;
  /** hide cards that have no scan available */
  images: boolean;
}

export interface TcgSearchResult {
  cards: TcgCardBrief[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export interface TcgSetDetail extends TcgSetInfo {
  releaseDate: string | null;
  legal?: { standard?: boolean; expanded?: boolean };
  abbreviation?: string | null;
  cards: TcgCardBrief[];
}
