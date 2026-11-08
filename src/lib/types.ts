export type TypeName =
  | "normal" | "fire" | "water" | "electric" | "grass" | "ice"
  | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug"
  | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy";

export type StatKey = "hp" | "attack" | "defense" | "special-attack" | "special-defense" | "speed";

/** Base stats in canonical order: hp, atk, def, spa, spd, spe */
export type Stats = [number, number, number, number, number, number];

/** Lightweight entry for the National Pokédex index (one per species). */
export interface IndexEntry {
  id: number;
  name: string; // english slug, e.g. "mr-mime"
  display: string; // localized display name (pt-BR when available, else english)
  gen: number;
  legendary: boolean;
  mythical: boolean;
  types: TypeName[];
  stats: Stats;
  total: number;
  /** Regional form slugs, e.g. ["vulpix-alola"] */
  regional: string[];
  /** Other alternate forms (mega, gmax, etc.) count */
  forms: number;
}

export interface PokedexIndex {
  version: number;
  generatedAt: string;
  source: "graphql" | "rest";
  entries: IndexEntry[];
}

export interface EvolutionNode {
  id: number;
  name: string;
  trigger?: string;
  minLevel?: number | null;
  item?: string | null;
  detail?: string | null;
  children: EvolutionNode[];
}

export interface SpriteVersion {
  generation: string;
  game: string;
  front: string | null;
  shiny: string | null;
  animated?: boolean;
}

export interface MoveEntry {
  name: string;
  method: string;
  level: number;
  versionGroup: string;
}

export interface Variety {
  id: number;
  name: string;
  isDefault: boolean;
  types: TypeName[];
}

export interface PokemonDetail {
  id: number;
  speciesId: number;
  name: string;
  display: string;
  genus: string | null;
  types: TypeName[];
  height: number; // decimeters
  weight: number; // hectograms
  baseExperience: number | null;
  abilities: { name: string; hidden: boolean }[];
  stats: Stats;
  captureRate: number | null;
  baseHappiness: number | null;
  growthRate: string | null;
  eggGroups: string[];
  genderRate: number; // -1 genderless, 0..8 eighths female
  color: string | null;
  habitat: string | null;
  generation: number;
  legendary: boolean;
  mythical: boolean;
  flavor: { text: string; lang: "pt" | "es" | "en"; version: string } | null;
  evolution: EvolutionNode | null;
  varieties: Variety[];
  sprites: {
    artwork: string | null;
    artworkShiny: string | null;
    home: string | null;
    homeShiny: string | null;
    dream: string | null;
    showdown: string | null;
    showdownShiny: string | null;
    front: string | null;
    frontShiny: string | null;
    back: string | null;
    backShiny: string | null;
  };
  versions: SpriteVersion[];
  moves: MoveEntry[];
  cry: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: number[]; // pokemon ids (max 6)
  coverId: number | null;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Preferences {
  shiny: boolean;
  artStyle: "artwork" | "home" | "showdown";
}
