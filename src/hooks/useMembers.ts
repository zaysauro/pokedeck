"use client";

import { useMemo } from "react";
import { prettyName } from "@/lib/format";
import type { IndexEntry } from "@/lib/types";
import { usePokedex } from "./usePokedex";

export type Member = IndexEntry & { key: string };

/** Resolves member ids to index entries, with stable keys for duplicates. */
export function useMembers(ids: number[]) {
  const { byId, loading } = usePokedex();
  const members = useMemo<Member[]>(() => {
    const seen = new Map<number, number>();
    return ids.map((id) => {
      const k = (seen.get(id) ?? 0) + 1;
      seen.set(id, k);
      const e = byId.get(id);
      const base: IndexEntry = e ?? {
        id, name: String(id), display: loading ? "…" : prettyName(`#${id}`), gen: 0, legendary: false, mythical: false,
        types: [], stats: [0, 0, 0, 0, 0, 0], total: 0, regional: [], forms: 0,
      };
      return { ...base, key: `${id}-${k}` };
    });
  }, [ids, byId, loading]);
  return { members, loading };
}
