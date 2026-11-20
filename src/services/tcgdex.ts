import "server-only";
import { TCG_LANG, TCG_PAGE_SIZE } from "@/lib/tcg/constants";
import type {
  TcgCard, TcgCardBrief, TcgFilters, TcgMeta, TcgSearchResult, TcgSerieInfo, TcgSetDetail, TcgSetInfo,
} from "@/lib/tcg/types";

/**
 * TCGdex access layer (server only). https://tcgdex.dev
 * - Filters TCGdex supports natively (name, category, rarity, types, illustrator, stage, hp, set) are
 *   forwarded upstream, so we never download more than the matching briefs.
 * - Series, release-date ordering, alphabetical ordering, "has scan" and pagination are applied here,
 *   because the upstream list endpoint does not expose set dates nor reliable OR filters.
 * - Every upstream call goes through Next's data cache, and identical in-flight calls are de-duplicated.
 */
const API = `https://api.tcgdex.net/v2/${TCG_LANG}`;
const HOUR = 3600;
/** Series that are not physical cards (TCG Pocket is a mobile game). */
const EXCLUDED_SERIES = new Set(["tcgp"]);

const inflight = new Map<string, { at: number; p: Promise<unknown> }>();

async function get<T>(path: string, revalidate = 6 * HOUR): Promise<T> {
  const url = `${API}${path}`;
  const hit = inflight.get(url);
  if (hit && Date.now() - hit.at < 30_000) return hit.p as Promise<T>;
  const p = (async () => {
    const res = await fetch(url, { next: { revalidate, tags: ["tcgdex"] } });
    if (res.status === 404) throw new TcgNotFound(path);
    if (!res.ok) throw new Error(`TCGdex ${res.status} em ${path}`);
    return (await res.json()) as T;
  })();
  inflight.set(url, { at: Date.now(), p });
  p.catch(() => inflight.delete(url));
  return p;
}

export class TcgNotFound extends Error {}

/* ------------------------------------------------------------------ */
/* Catalog: series → sets in release order                              */
/* ------------------------------------------------------------------ */

interface ApiSerieBrief { id: string; name: string }
interface ApiSetBrief { id: string; name: string; logo?: string; symbol?: string; cardCount?: { official?: number; total?: number } }
interface ApiSerie { id: string; name: string; sets: ApiSetBrief[] }

export async function getCatalog(): Promise<TcgSerieInfo[]> {
  const series = (await get<ApiSerieBrief[]>("/series", 24 * HOUR)).filter((s) => !EXCLUDED_SERIES.has(s.id));
  const full = await Promise.all(series.map((s) => get<ApiSerie>(`/series/${encodeURIComponent(s.id)}`, 24 * HOUR).catch(() => null)));
  // TCGdex lists series and their sets chronologically; we turn that into a global rank.
  let rank = 0;
  return series.map((s, i) => {
    const sets = (full[i]?.sets ?? []).map<TcgSetInfo>((set) => ({
      id: set.id,
      name: set.name,
      logo: set.logo ?? null,
      symbol: set.symbol ?? null,
      serieId: s.id,
      serieName: s.name,
      rank: ++rank,
      official: set.cardCount?.official ?? null,
      total: set.cardCount?.total ?? null,
    }));
    return { id: s.id, name: s.name, sets };
  });
}

async function setIndex() {
  const catalog = await getCatalog();
  const map = new Map<string, TcgSetInfo>();
  catalog.forEach((s) => s.sets.forEach((set) => map.set(set.id, set)));
  return map;
}

export async function getMeta(): Promise<TcgMeta> {
  const [series, rarities, types, stages, categories, illustrators] = await Promise.all([
    getCatalog(),
    get<string[]>("/rarities", 24 * HOUR).catch(() => []),
    get<string[]>("/types", 24 * HOUR).catch(() => []),
    get<string[]>("/stages", 24 * HOUR).catch(() => []),
    get<string[]>("/categories", 24 * HOUR).catch(() => []),
    get<string[]>("/illustrators", 24 * HOUR).catch(() => []),
  ]);
  const clean = (a: string[]) => a.filter((x) => x && x !== "None").sort((x, y) => x.localeCompare(y, "pt-BR"));
  return {
    series,
    rarities: clean(rarities),
    types: clean(types),
    stages: clean(stages),
    categories: clean(categories),
    illustrators: clean(illustrators),
  };
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

interface ApiCardBrief { id: string; localId: string; name: string; image?: string }

const setIdOf = (c: { id: string; localId: string }) =>
  c.id.endsWith(`-${c.localId}`) ? c.id.slice(0, -(c.localId.length + 1)) : c.id.split("-").slice(0, -1).join("-");

function localOrder(localId: string) {
  const n = parseInt(localId, 10);
  return Number.isNaN(n) ? 100000 : n;
}

function toBrief(c: ApiCardBrief, sets: Map<string, TcgSetInfo>): TcgCardBrief {
  const setId = setIdOf(c);
  const set = sets.get(setId);
  return {
    id: c.id,
    localId: c.localId,
    name: c.name,
    image: c.image ?? null,
    setId,
    setName: set?.name ?? null,
    serieId: set?.serieId ?? null,
  };
}

export async function searchCards(f: TcgFilters, pageSize = TCG_PAGE_SIZE): Promise<TcgSearchResult> {
  const up = new URLSearchParams();
  if (f.q) up.set("name", f.q);
  if (f.set) up.set("set.id", `eq:${f.set}`);
  if (f.category) up.set("category", `eq:${f.category}`);
  if (f.rarity) up.set("rarity", `eq:${f.rarity}`);
  if (f.type) up.set("types", f.type);
  if (f.illustrator) up.set("illustrator", f.illustrator);
  if (f.stage) up.set("stage", `eq:${f.stage}`);
  if (f.hpMin !== null) up.append("hp", `gte:${f.hpMin}`);
  if (f.hpMax !== null) up.append("hp", `lte:${f.hpMax}`);
  const byHp = f.sort === "hp-desc" || f.sort === "hp-asc";
  if (byHp) {
    up.set("sort:field", "hp");
    up.set("sort:order", f.sort === "hp-desc" ? "DESC" : "ASC");
    if (f.hpMin === null) up.append("hp", "gte:1"); // HP sorting only makes sense for cards with HP
  }

  const qs = up.toString();
  const [raw, sets] = await Promise.all([get<ApiCardBrief[]>(`/cards${qs ? `?${qs}` : ""}`), setIndex()]);

  let list = raw.map((c) => toBrief(c, sets)).filter((c) => !c.serieId || !EXCLUDED_SERIES.has(c.serieId));
  if (f.serie) list = list.filter((c) => c.serieId === f.serie);
  if (f.images) list = list.filter((c) => c.image);

  if (f.sort === "recent" || f.sort === "oldest") {
    const dir = f.sort === "recent" ? -1 : 1;
    const rank = (c: TcgCardBrief) => sets.get(c.setId)?.rank ?? 0;
    list.sort((a, b) => (rank(a) - rank(b)) * dir || localOrder(a.localId) - localOrder(b.localId) || a.localId.localeCompare(b.localId));
  } else if (f.sort === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR") || a.id.localeCompare(b.id));
  }

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(f.page, pages);
  return { cards: list.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, pages };
}

/* ------------------------------------------------------------------ */
/* Single card & set                                                   */
/* ------------------------------------------------------------------ */

export async function getCard(id: string): Promise<TcgCard | null> {
  try {
    return await get<TcgCard>(`/cards/${encodeURIComponent(id)}`, 24 * HOUR);
  } catch (e) {
    if (e instanceof TcgNotFound) return null;
    throw e;
  }
}

export async function getCardsByIds(ids: string[]): Promise<TcgCard[]> {
  const res = await Promise.all(ids.map((id) => getCard(id).catch(() => null)));
  return res.filter((c): c is TcgCard => Boolean(c));
}

interface ApiSet {
  id: string; name: string; logo?: string; symbol?: string; releaseDate?: string;
  cardCount?: { official?: number; total?: number };
  legal?: { standard?: boolean; expanded?: boolean };
  serie: { id: string; name: string };
  abbreviation?: { official?: string };
  cards: ApiCardBrief[];
}

export async function getSet(id: string): Promise<TcgSetDetail | null> {
  let s: ApiSet;
  try {
    s = await get<ApiSet>(`/sets/${encodeURIComponent(id)}`, 24 * HOUR);
  } catch (e) {
    if (e instanceof TcgNotFound) return null;
    throw e;
  }
  if (EXCLUDED_SERIES.has(s.serie.id)) return null;
  const sets = await setIndex();
  return {
    id: s.id,
    name: s.name,
    logo: s.logo ?? null,
    symbol: s.symbol ?? null,
    serieId: s.serie.id,
    serieName: s.serie.name,
    rank: sets.get(s.id)?.rank ?? 0,
    official: s.cardCount?.official ?? null,
    total: s.cardCount?.total ?? null,
    releaseDate: s.releaseDate ?? null,
    legal: s.legal,
    abbreviation: s.abbreviation?.official ?? null,
    cards: s.cards.map((c) => toBrief(c, sets)).sort((a, b) => localOrder(a.localId) - localOrder(b.localId)),
  };
}

/** Most recent sets (for the landing page). */
export async function getRecentSets(limit = 8): Promise<TcgSetInfo[]> {
  const catalog = await getCatalog();
  return catalog
    .flatMap((s) => s.sets)
    .filter((s) => s.logo && (s.official ?? 0) > 20)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit);
}
