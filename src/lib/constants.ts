import type { StatKey, TypeName } from "./types";

export const TYPES: TypeName[] = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground",
  "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

/** Each type gets a base hue, a deep tone and a light tone. Tuned for dark UI legibility. */
export const TYPE_META: Record<TypeName, { pt: string; color: string; deep: string; light: string }> = {
  normal:   { pt: "Normal",   color: "#a8a29a", deep: "#3d3a35", light: "#e7e3dc" },
  fire:     { pt: "Fogo",     color: "#ff7a2f", deep: "#4a1408", light: "#ffd2b0" },
  water:    { pt: "Água",     color: "#3f8cff", deep: "#0a2350", light: "#c7dcff" },
  electric: { pt: "Elétrico", color: "#f9cf30", deep: "#3d3104", light: "#fff0b3" },
  grass:    { pt: "Planta",   color: "#4fc163", deep: "#0f3517", light: "#c9f0cf" },
  ice:      { pt: "Gelo",     color: "#6fd8e8", deep: "#0d3a42", light: "#d3f5fa" },
  fighting: { pt: "Lutador",  color: "#d94a3d", deep: "#3f0d09", light: "#f6c4bd" },
  poison:   { pt: "Venenoso", color: "#b05ad8", deep: "#2e0d3d", light: "#e9cdf5" },
  ground:   { pt: "Terra",    color: "#d9a54f", deep: "#3e2a0b", light: "#f3dfb8" },
  flying:   { pt: "Voador",   color: "#8fa8ff", deep: "#1b2452", light: "#dae2ff" },
  psychic:  { pt: "Psíquico", color: "#ff5c93", deep: "#47081f", light: "#ffc9dc" },
  bug:      { pt: "Inseto",   color: "#a3c22b", deep: "#2b3407", light: "#e4efb5" },
  rock:     { pt: "Pedra",    color: "#bfa86a", deep: "#352c14", light: "#ebe0c1" },
  ghost:    { pt: "Fantasma", color: "#7b62c9", deep: "#1c1238", light: "#d8cff3" },
  dragon:   { pt: "Dragão",   color: "#5b6cff", deep: "#120f4a", light: "#cfd3ff" },
  dark:     { pt: "Sombrio",  color: "#7d6a5e", deep: "#1c1714", light: "#ddd3cc" },
  steel:    { pt: "Aço",      color: "#8fb2c4", deep: "#1c2b33", light: "#dbe8ef" },
  fairy:    { pt: "Fada",     color: "#f39ad6", deep: "#45133a", light: "#fcdcf1" },
};

export const GENERATIONS: { id: number; roman: string; region: string; range: [number, number]; starters: number[] }[] = [
  { id: 1, roman: "I",    region: "Kanto",  range: [1, 151],    starters: [1, 4, 7] },
  { id: 2, roman: "II",   region: "Johto",  range: [152, 251],  starters: [152, 155, 158] },
  { id: 3, roman: "III",  region: "Hoenn",  range: [252, 386],  starters: [252, 255, 258] },
  { id: 4, roman: "IV",   region: "Sinnoh", range: [387, 493],  starters: [387, 390, 393] },
  { id: 5, roman: "V",    region: "Unova",  range: [494, 649],  starters: [495, 498, 501] },
  { id: 6, roman: "VI",   region: "Kalos",  range: [650, 721],  starters: [650, 653, 656] },
  { id: 7, roman: "VII",  region: "Alola",  range: [722, 809],  starters: [722, 725, 728] },
  { id: 8, roman: "VIII", region: "Galar",  range: [810, 905],  starters: [810, 813, 816] },
  { id: 9, roman: "IX",   region: "Paldea", range: [906, 1025], starters: [906, 909, 912] },
];

export function genMeta(gen: number) {
  return (
    GENERATIONS.find((g) => g.id === gen) ?? {
      id: gen,
      roman: String(gen),
      region: `Geração ${gen}`,
      range: [0, 0] as [number, number],
      starters: [],
    }
  );
}

export const REGIONAL_SUFFIXES = ["alola", "galar", "hisui", "paldea"] as const;
export const REGIONAL_PT: Record<string, string> = {
  alola: "Alola",
  galar: "Galar",
  hisui: "Hisui",
  paldea: "Paldea",
};

export const STAT_KEYS: StatKey[] = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
export const STAT_LABEL: Record<StatKey, { pt: string; short: string }> = {
  hp: { pt: "PS", short: "HP" },
  attack: { pt: "Ataque", short: "ATK" },
  defense: { pt: "Defesa", short: "DEF" },
  "special-attack": { pt: "Atq. Especial", short: "SpA" },
  "special-defense": { pt: "Def. Especial", short: "SpD" },
  speed: { pt: "Velocidade", short: "SPE" },
};

export const EGG_GROUP_PT: Record<string, string> = {
  monster: "Monstro", water1: "Água 1", water2: "Água 2", water3: "Água 3", bug: "Inseto",
  flying: "Voador", ground: "Campo", fairy: "Fada", plant: "Planta", humanshape: "Humanoide",
  mineral: "Mineral", indeterminate: "Amorfo", ditto: "Ditto", dragon: "Dragão",
  "no-eggs": "Desconhecido",
};

export const COLOR_PT: Record<string, string> = {
  black: "Preto", blue: "Azul", brown: "Marrom", gray: "Cinza", green: "Verde",
  pink: "Rosa", purple: "Roxo", red: "Vermelho", white: "Branco", yellow: "Amarelo",
};

export const GROWTH_PT: Record<string, string> = {
  slow: "Lento", medium: "Médio", fast: "Rápido", "medium-slow": "Médio-lento",
  "slow-then-very-fast": "Errático", "fast-then-very-slow": "Flutuante",
};

export const HABITAT_PT: Record<string, string> = {
  cave: "Caverna", forest: "Floresta", grassland: "Campo", mountain: "Montanha", rare: "Raro",
  "rough-terrain": "Terreno acidentado", sea: "Mar", urban: "Urbano", "waters-edge": "Beira d'água",
};

export const MOVE_METHOD_PT: Record<string, string> = {
  "level-up": "Por nível",
  machine: "TM / TR",
  egg: "Ovo",
  tutor: "Tutor",
};

/** Species colour (PokéAPI `color`) mapped to a display hex, used to tint pages. */
export const SPECIES_COLOR_HEX: Record<string, string> = {
  black: "#3b3a45", blue: "#3f7ee8", brown: "#a0703f", gray: "#9a9aa5", green: "#3fae5e",
  pink: "#ee8fc2", purple: "#8a5cc9", red: "#e4483a", white: "#d9d6cf", yellow: "#f2c933",
};

export const FEATURED_IDS = [6, 94, 25, 9, 3, 384, 448, 658, 150, 1008];
export const POPULAR_IDS = [25, 6, 94, 448, 133, 197, 282, 445, 658, 887, 700, 150];
