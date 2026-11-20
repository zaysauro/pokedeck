import { DEFAULT_TCG_FILTERS, SORT_OPTIONS } from "./constants";
import type { TcgFilters, TcgSort } from "./types";

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function getter(sp: Params) {
  return (k: string): string | undefined => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? undefined;
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
}

const num = (v: string | undefined) => {
  if (v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
};

/** Parses (and sanitizes) filters from URL params — shared by pages, API route and client. */
export function parseTcgFilters(sp: Params): TcgFilters {
  const g = getter(sp);
  const s = (k: string) => (g(k) ?? "").trim().slice(0, 80);
  const sort = g("sort") as TcgSort | undefined;
  return {
    q: s("q"),
    serie: s("serie"),
    set: s("set"),
    category: s("category"),
    rarity: s("rarity"),
    type: s("type"),
    illustrator: s("illustrator"),
    stage: s("stage"),
    hpMin: num(g("hpMin")),
    hpMax: num(g("hpMax")),
    sort: SORT_OPTIONS.some((o) => o.key === sort) ? (sort as TcgSort) : DEFAULT_TCG_FILTERS.sort,
    page: Math.max(1, num(g("page")) ?? 1),
    images: g("images") !== "0",
  };
}

/** Serializes only non-default values, for short shareable URLs. */
export function tcgFiltersToParams(f: TcgFilters): URLSearchParams {
  const p = new URLSearchParams();
  const d = DEFAULT_TCG_FILTERS;
  (["q", "serie", "set", "category", "rarity", "type", "illustrator", "stage"] as const).forEach((k) => {
    if (f[k]) p.set(k, f[k]);
  });
  if (f.hpMin !== null) p.set("hpMin", String(f.hpMin));
  if (f.hpMax !== null) p.set("hpMax", String(f.hpMax));
  if (f.sort !== d.sort) p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  if (!f.images) p.set("images", "0");
  return p;
}

export function activeFilterCount(f: TcgFilters) {
  return [f.serie, f.set, f.category, f.rarity, f.type, f.illustrator, f.stage].filter(Boolean).length +
    (f.hpMin !== null || f.hpMax !== null ? 1 : 0) + (f.images ? 0 : 1);
}
