import "server-only";
import { REGIONAL_SUFFIXES } from "@/lib/constants";
import { cleanFlavor, prettyName } from "@/lib/format";
import type {
  EvolutionNode,
  IndexEntry,
  MoveEntry,
  PokedexIndex,
  PokemonDetail,
  SpriteVersion,
  Stats,
  TypeName,
} from "@/lib/types";

const REST = "https://pokeapi.co/api/v2";
const GRAPHQL = "https://graphql.pokeapi.co/v1beta2";
const DAY = 60 * 60 * 24;
export const INDEX_VERSION = 2;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function getJson<T>(url: string, revalidate = DAY): Promise<T> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`PokéAPI ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

const idFromUrl = (url: string) => Number(url.replace(/\/$/, "").split("/").pop());

/* ------------------------------------------------------------------ */
/* National Pokédex index — a single GraphQL request for every species */
/* ------------------------------------------------------------------ */

interface GqlSpecies {
  id: number;
  name: string;
  generation_id: number;
  is_legendary: boolean;
  is_mythical: boolean;
  pokemonspeciesnames: { name: string }[];
  pokemons: {
    name: string;
    is_default: boolean;
    pokemontypes: { slot: number; type: { name: TypeName } }[];
    pokemonstats: { base_stat: number }[];
  }[];
}

const INDEX_QUERY = `query PokedexIndex {
  pokemonspecies(order_by: {id: asc}) {
    id name generation_id is_legendary is_mythical
    pokemonspeciesnames(where: {language_id: {_eq: 13}}) { name }
    pokemons {
      name is_default
      pokemontypes(order_by: {slot: asc}) { slot type { name } }
      pokemonstats(order_by: {stat_id: asc}) { base_stat }
    }
  }
}`;

async function indexFromGraphql(): Promise<IndexEntry[]> {
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: INDEX_QUERY }),
    next: { revalidate: DAY },
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status}`);
  const json = (await res.json()) as { data?: { pokemonspecies: GqlSpecies[] }; errors?: unknown };
  if (!json.data) throw new Error(`GraphQL error ${JSON.stringify(json.errors)}`);

  return json.data.pokemonspecies.map((s) => {
    const def = s.pokemons.find((p) => p.is_default) ?? s.pokemons[0];
    const stats = (def?.pokemonstats.map((x) => x.base_stat).slice(0, 6) ?? [0, 0, 0, 0, 0, 0]) as Stats;
    const regional = s.pokemons
      .filter((p) => !p.is_default && REGIONAL_SUFFIXES.some((r) => p.name.includes(`-${r}`)) && !p.name.includes("totem"))
      .map((p) => p.name);
    return {
      id: s.id,
      name: s.name,
      display: s.pokemonspeciesnames[0]?.name ?? prettyName(s.name),
      gen: s.generation_id,
      legendary: s.is_legendary,
      mythical: s.is_mythical,
      types: def?.pokemontypes.map((t) => t.type.name) ?? [],
      stats,
      total: stats.reduce((a, b) => a + b, 0),
      regional,
      forms: Math.max(0, s.pokemons.length - 1),
    };
  });
}

/** Degraded fallback: names & ids only (REST list is one request). */
async function indexFromRest(): Promise<IndexEntry[]> {
  const list = await getJson<{ results: { name: string; url: string }[] }>(`${REST}/pokemon-species?limit=100000`);
  return list.results.map((r) => {
    const id = idFromUrl(r.url);
    return {
      id,
      name: r.name,
      display: prettyName(r.name),
      gen: genFromId(id),
      legendary: false,
      mythical: false,
      types: [],
      stats: [0, 0, 0, 0, 0, 0] as Stats,
      total: 0,
      regional: [],
      forms: 0,
    };
  });
}

function genFromId(id: number) {
  const bounds = [151, 251, 386, 493, 649, 721, 809, 905, 1025];
  const i = bounds.findIndex((b) => id <= b);
  return i === -1 ? 10 : i + 1;
}

export async function getPokedexIndex(): Promise<PokedexIndex> {
  try {
    const entries = await indexFromGraphql();
    return { version: INDEX_VERSION, generatedAt: new Date().toISOString(), source: "graphql", entries };
  } catch (err) {
    console.error("[pokedex-index] GraphQL failed, using REST fallback", err);
    const entries = await indexFromRest();
    return { version: INDEX_VERSION, generatedAt: new Date().toISOString(), source: "rest", entries };
  }
}

/* ------------------------------------------------------------------ */
/* Pokémon detail                                                      */
/* ------------------------------------------------------------------ */

/* Minimal shapes of the REST payloads we read. */
interface ApiPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number | null;
  species: { url: string };
  types: { slot: number; type: { name: TypeName } }[];
  abilities: { is_hidden: boolean; ability: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  moves: { move: { name: string }; version_group_details: { level_learned_at: number; move_learn_method: { name: string }; version_group: { name: string } }[] }[];
  cries?: { latest?: string | null; legacy?: string | null };
  sprites: Record<string, unknown> & {
    front_default: string | null;
    front_shiny: string | null;
    back_default: string | null;
    back_shiny: string | null;
    other?: Record<string, Record<string, string | null>>;
    versions?: Record<string, Record<string, Record<string, unknown>>>;
  };
}

interface ApiSpecies {
  id: number;
  name: string;
  names: { name: string; language: { name: string } }[];
  genera: { genus: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string }; version: { name: string } }[];
  capture_rate: number | null;
  base_happiness: number | null;
  gender_rate: number;
  growth_rate: { name: string } | null;
  egg_groups: { name: string }[];
  color: { name: string } | null;
  habitat: { name: string } | null;
  generation: { url: string };
  is_legendary: boolean;
  is_mythical: boolean;
  evolution_chain: { url: string } | null;
  varieties: { is_default: boolean; pokemon: { name: string; url: string } }[];
}

interface ApiChainLink {
  species: { name: string; url: string };
  evolution_details: {
    min_level: number | null;
    item: { name: string } | null;
    held_item: { name: string } | null;
    trigger: { name: string } | null;
    min_happiness: number | null;
    time_of_day: string;
    known_move: { name: string } | null;
    known_move_type: { name: string } | null;
    location: { name: string } | null;
    min_affection: number | null;
    needs_overworld_rain: boolean;
    trade_species: { name: string } | null;
    gender: number | null;
  }[];
  evolves_to: ApiChainLink[];
}

function pickLocalized<T extends { language: { name: string } }>(arr: T[], order = ["pt-br", "pt", "es", "en"]) {
  for (const lang of order) {
    const found = arr.filter((x) => x.language.name === lang);
    if (found.length) return { item: found[found.length - 1], lang };
  }
  return null;
}

function describeEvolution(d: ApiChainLink["evolution_details"][number] | undefined): string | null {
  if (!d) return null;
  const parts: string[] = [];
  if (d.min_level) parts.push(`Nível ${d.min_level}`);
  if (d.item) parts.push(prettyName(d.item.name));
  if (d.trigger?.name === "trade") parts.push(d.trade_species ? `Troca por ${prettyName(d.trade_species.name)}` : "Troca");
  if (d.held_item) parts.push(`Segurando ${prettyName(d.held_item.name)}`);
  if (d.min_happiness) parts.push("Amizade alta");
  if (d.min_affection) parts.push("Afeição alta");
  if (d.known_move) parts.push(`Conhecendo ${prettyName(d.known_move.name)}`);
  if (d.known_move_type) parts.push(`Golpe do tipo ${d.known_move_type.name}`);
  if (d.location) parts.push(`Em ${prettyName(d.location.name)}`);
  if (d.time_of_day) parts.push(d.time_of_day === "day" ? "Durante o dia" : d.time_of_day === "night" ? "À noite" : d.time_of_day);
  if (d.needs_overworld_rain) parts.push("Na chuva");
  if (d.gender === 1) parts.push("Fêmea");
  if (d.gender === 2) parts.push("Macho");
  if (!parts.length && d.trigger) parts.push(prettyName(d.trigger.name));
  return parts.join(" · ") || null;
}

function parseChain(link: ApiChainLink): EvolutionNode {
  const d = link.evolution_details[0];
  return {
    id: idFromUrl(link.species.url),
    name: link.species.name,
    trigger: d?.trigger?.name,
    minLevel: d?.min_level ?? null,
    item: d?.item?.name ?? null,
    detail: describeEvolution(d),
    children: link.evolves_to.map(parseChain),
  };
}

function flattenVersions(versions: ApiPokemon["sprites"]["versions"]): SpriteVersion[] {
  if (!versions) return [];
  const out: SpriteVersion[] = [];
  for (const [generation, games] of Object.entries(versions)) {
    for (const [game, data] of Object.entries(games)) {
      const d = data as Record<string, unknown>;
      const front = (d.front_default as string | null) ?? null;
      const shiny = (d.front_shiny as string | null) ?? null;
      if (front || shiny) out.push({ generation, game, front, shiny });
      const animated = d.animated as Record<string, string | null> | undefined;
      if (animated?.front_default) {
        out.push({ generation, game: `${game} (animado)`, front: animated.front_default, shiny: animated.front_shiny ?? null, animated: true });
      }
    }
  }
  return out;
}

function parseMoves(moves: ApiPokemon["moves"]): MoveEntry[] {
  return moves
    .map((m) => {
      const v = m.version_group_details[m.version_group_details.length - 1];
      return {
        name: m.move.name,
        method: v?.move_learn_method.name ?? "unknown",
        level: v?.level_learned_at ?? 0,
        versionGroup: v?.version_group.name ?? "",
      };
    })
    .sort((a, b) => (a.method === b.method ? a.level - b.level || a.name.localeCompare(b.name) : a.method.localeCompare(b.method)));
}

export async function getPokemonDetail(idOrName: string | number): Promise<PokemonDetail | null> {
  let p: ApiPokemon;
  try {
    p = await getJson<ApiPokemon>(`${REST}/pokemon/${String(idOrName).toLowerCase()}`);
  } catch {
    // maybe a species name/id whose default variety has a different slug
    try {
      const sp = await getJson<ApiSpecies>(`${REST}/pokemon-species/${String(idOrName).toLowerCase()}`);
      const def = sp.varieties.find((v) => v.is_default) ?? sp.varieties[0];
      p = await getJson<ApiPokemon>(def.pokemon.url);
    } catch {
      return null;
    }
  }

  const species = await getJson<ApiSpecies>(p.species.url);
  const chain = species.evolution_chain
    ? await getJson<{ chain: ApiChainLink }>(species.evolution_chain.url).catch(() => null)
    : null;

  const flavor = pickLocalized(species.flavor_text_entries);
  const genus = pickLocalized(species.genera);
  const nameLoc = species.names.find((n) => n.language.name === "pt-br")?.name;
  const other = p.sprites.other ?? {};
  const stats = p.stats.map((s) => s.base_stat).slice(0, 6) as Stats;

  return {
    id: p.id,
    speciesId: species.id,
    name: p.name,
    display: nameLoc ?? prettyName(p.id === species.id ? species.name : p.name),
    genus: genus?.item.genus ?? null,
    types: p.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    height: p.height,
    weight: p.weight,
    baseExperience: p.base_experience,
    abilities: p.abilities.map((a) => ({ name: a.ability.name, hidden: a.is_hidden })),
    stats,
    captureRate: species.capture_rate,
    baseHappiness: species.base_happiness,
    growthRate: species.growth_rate?.name ?? null,
    eggGroups: species.egg_groups.map((e) => e.name),
    genderRate: species.gender_rate,
    color: species.color?.name ?? null,
    habitat: species.habitat?.name ?? null,
    generation: idFromUrl(species.generation.url),
    legendary: species.is_legendary,
    mythical: species.is_mythical,
    flavor: flavor
      ? {
          text: cleanFlavor(flavor.item.flavor_text),
          lang: flavor.lang.startsWith("pt") ? "pt" : (flavor.lang as "es" | "en"),
          version: flavor.item.version.name,
        }
      : null,
    evolution: chain ? parseChain(chain.chain) : null,
    varieties: species.varieties.map((v) => ({
      id: idFromUrl(v.pokemon.url),
      name: v.pokemon.name,
      isDefault: v.is_default,
      types: [],
    })),
    sprites: {
      artwork: other["official-artwork"]?.front_default ?? null,
      artworkShiny: other["official-artwork"]?.front_shiny ?? null,
      home: other.home?.front_default ?? null,
      homeShiny: other.home?.front_shiny ?? null,
      dream: other.dream_world?.front_default ?? null,
      showdown: other.showdown?.front_default ?? null,
      showdownShiny: other.showdown?.front_shiny ?? null,
      front: p.sprites.front_default,
      frontShiny: p.sprites.front_shiny,
      back: p.sprites.back_default,
      backShiny: p.sprites.back_shiny,
    },
    versions: flattenVersions(p.sprites.versions),
    moves: parseMoves(p.moves),
    cry: p.cries?.latest ?? p.cries?.legacy ?? null,
  };
}
