import { TYPES } from "./constants";
import type { TypeName } from "./types";

/** Attack effectiveness: CHART[attacker][defender]. Missing = 1. Gen VI+ chart. */
const CHART: Partial<Record<TypeName, Partial<Record<TypeName, number>>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

export function effectiveness(attacker: TypeName, defender: TypeName): number {
  return CHART[attacker]?.[defender] ?? 1;
}

/** Multiplier of an attacking type against a (possibly dual) defending type combination. */
export function multiplierAgainst(attacker: TypeName, defenders: TypeName[]): number {
  return defenders.reduce((m, d) => m * effectiveness(attacker, d), 1);
}

export interface DefenseProfile {
  weak4: TypeName[];
  weak2: TypeName[];
  resist2: TypeName[];
  resist4: TypeName[];
  immune: TypeName[];
  map: Record<TypeName, number>;
}

export function defenseProfile(types: TypeName[]): DefenseProfile {
  const map = {} as Record<TypeName, number>;
  const p: DefenseProfile = { weak4: [], weak2: [], resist2: [], resist4: [], immune: [], map };
  for (const atk of TYPES) {
    const m = multiplierAgainst(atk, types);
    map[atk] = m;
    if (m === 0) p.immune.push(atk);
    else if (m >= 4) p.weak4.push(atk);
    else if (m >= 2) p.weak2.push(atk);
    else if (m <= 0.25) p.resist4.push(atk);
    else if (m < 1) p.resist2.push(atk);
  }
  return p;
}

export interface TeamAnalysis {
  /** per attacking type: counts of weak / resist / immune members */
  matrix: Record<TypeName, { weak: number; resist: number; immune: number; neutral: number }>;
  sharedWeaknesses: TypeName[];
  wellCovered: TypeName[];
  immunities: TypeName[];
  /** defending types hit super-effectively by at least one member's STAB */
  offensiveCoverage: TypeName[];
  offensiveGaps: TypeName[];
  typeDistribution: Partial<Record<TypeName, number>>;
  suggestions: TypeName[];
}

export function analyzeTeam(members: TypeName[][]): TeamAnalysis {
  const matrix = {} as TeamAnalysis["matrix"];
  for (const atk of TYPES) {
    const row = { weak: 0, resist: 0, immune: 0, neutral: 0 };
    for (const t of members) {
      const m = multiplierAgainst(atk, t);
      if (m === 0) row.immune++;
      else if (m > 1) row.weak++;
      else if (m < 1) row.resist++;
      else row.neutral++;
    }
    matrix[atk] = row;
  }
  const n = members.length;
  const sharedWeaknesses = TYPES.filter((t) => {
    const r = matrix[t];
    return n > 0 && r.weak >= Math.max(2, Math.ceil(n / 3)) && r.weak > r.resist + r.immune;
  });
  const wellCovered = TYPES.filter((t) => matrix[t].resist + matrix[t].immune >= Math.max(2, Math.ceil(n / 3)));
  const immunities = TYPES.filter((t) => matrix[t].immune > 0);

  const stab = new Set(members.flat());
  const offensiveCoverage = TYPES.filter((def) => [...stab].some((atk) => effectiveness(atk, def) > 1));
  const offensiveGaps = n === 0 ? [] : TYPES.filter((t) => !offensiveCoverage.includes(t));

  const typeDistribution: Partial<Record<TypeName, number>> = {};
  for (const t of members.flat()) typeDistribution[t] = (typeDistribution[t] ?? 0) + 1;

  // Suggest types that resist the most shared weaknesses and add new offensive coverage.
  const suggestions = n === 0 || n >= 6 ? [] : TYPES
    .filter((t) => !stab.has(t))
    .map((t) => {
      const defScore = sharedWeaknesses.reduce((s, w) => s + (effectiveness(w, t) < 1 ? 2 : effectiveness(w, t) > 1 ? -1 : 0), 0);
      const offScore = offensiveGaps.filter((g) => effectiveness(t, g) > 1).length;
      return { t, score: defScore * 2 + offScore };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.t);

  return { matrix, sharedWeaknesses, wellCovered, immunities, offensiveCoverage, offensiveGaps, typeDistribution, suggestions };
}
