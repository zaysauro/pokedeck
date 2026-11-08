import { norm } from "./format";
import type { IndexEntry, TypeName } from "./types";

export type SortKey = "id" | "name" | "total" | "hp" | "attack" | "defense" | "spa" | "spd" | "speed";

export interface Filters {
  q: string;
  types: TypeName[];
  gens: number[];
  regional: string | null; // alola | galar | hisui | paldea | "any"
  special: "all" | "legendary" | "mythical" | "both";
  sort: SortKey;
  dir: "asc" | "desc";
}

export const DEFAULT_FILTERS: Filters = { q: "", types: [], gens: [], regional: null, special: "all", sort: "id", dir: "asc" };

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "id", label: "Número" },
  { key: "name", label: "Nome" },
  { key: "total", label: "Total de atributos" },
  { key: "hp", label: "PS" },
  { key: "attack", label: "Ataque" },
  { key: "defense", label: "Defesa" },
  { key: "spa", label: "Atq. Especial" },
  { key: "spd", label: "Def. Especial" },
  { key: "speed", label: "Velocidade" },
];

const STAT_INDEX: Partial<Record<SortKey, number>> = { hp: 0, attack: 1, defense: 2, spa: 3, spd: 4, speed: 5 };

export function applyFilters(entries: IndexEntry[], f: Filters): IndexEntry[] {
  const q = norm(f.q.trim().replace(/^#/, ""));
  const num = q && /^\d+$/.test(q) ? Number(q) : null;
  const out = entries.filter((e) => {
    if (q) {
      if (num !== null) {
        if (!String(e.id).startsWith(String(num))) return false;
      } else if (!norm(e.display).includes(q) && !e.name.includes(q)) return false;
    }
    if (f.types.length && !f.types.every((t) => e.types.includes(t))) return false;
    if (f.gens.length && !f.gens.includes(e.gen)) return false;
    if (f.special === "legendary" && !e.legendary) return false;
    if (f.special === "mythical" && !e.mythical) return false;
    if (f.special === "both" && !e.legendary && !e.mythical) return false;
    if (f.regional) {
      if (f.regional === "any" ? e.regional.length === 0 : !e.regional.some((r) => r.includes(`-${f.regional}`))) return false;
    }
    return true;
  });

  const dir = f.dir === "asc" ? 1 : -1;
  const si = STAT_INDEX[f.sort];
  out.sort((a, b) => {
    let d = 0;
    if (f.sort === "id") d = a.id - b.id;
    else if (f.sort === "name") d = a.display.localeCompare(b.display, "pt-BR");
    else if (f.sort === "total") d = a.total - b.total;
    else if (si !== undefined) d = a.stats[si] - b.stats[si];
    return d * dir || a.id - b.id;
  });
  return out;
}

export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.types.length) p.set("type", f.types.join(","));
  if (f.gens.length) p.set("gen", f.gens.join(","));
  if (f.regional) p.set("regional", f.regional);
  if (f.special !== "all") p.set("special", f.special);
  if (f.sort !== "id") p.set("sort", f.sort);
  if (f.dir !== "asc") p.set("dir", f.dir);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function filtersFromQuery(sp: Record<string, string | string[] | undefined>): Filters {
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;
  return {
    q: g("q") ?? "",
    types: (g("type")?.split(",").filter(Boolean) as TypeName[]) ?? [],
    gens: g("gen")?.split(",").map(Number).filter((n) => n > 0) ?? [],
    regional: g("regional") ?? null,
    special: (g("special") as Filters["special"]) ?? "all",
    sort: (g("sort") as SortKey) ?? "id",
    dir: g("dir") === "desc" ? "desc" : "asc",
  };
}
