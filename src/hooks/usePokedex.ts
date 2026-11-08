"use client";

import { useEffect, useMemo, useState } from "react";
import { load, save } from "@/lib/storage";
import { norm } from "@/lib/format";
import type { IndexEntry, PokedexIndex } from "@/lib/types";

const CACHE_KEY = "pokedex-index";
const CACHE_VERSION = 2;
const STALE_MS = 1000 * 60 * 60 * 24;

let memory: PokedexIndex | null = null;
let inflight: Promise<PokedexIndex> | null = null;
const listeners = new Set<(i: PokedexIndex) => void>();

async function fetchIndex(): Promise<PokedexIndex> {
  const res = await fetch("/api/pokedex");
  if (!res.ok) throw new Error(`Falha ao carregar a Pokédex (${res.status})`);
  const data = (await res.json()) as PokedexIndex;
  if (data.source === "graphql") void save(CACHE_KEY, data);
  return data;
}

/**
 * Loads the full species index once per session:
 * memory → IndexedDB (instant, offline-friendly) → network (revalidated in background).
 */
function loadIndex(): Promise<PokedexIndex> {
  if (memory) return Promise.resolve(memory);
  if (inflight) return inflight;
  inflight = (async () => {
    const cached = await load<PokedexIndex>(CACHE_KEY);
    if (cached && cached.version === CACHE_VERSION && cached.entries?.length) {
      memory = cached;
      const age = Date.now() - new Date(cached.generatedAt).getTime();
      if (age > STALE_MS) {
        fetchIndex()
          .then((fresh) => {
            memory = fresh;
            listeners.forEach((l) => l(fresh));
          })
          .catch(() => undefined);
      }
      return cached;
    }
    const fresh = await fetchIndex();
    memory = fresh;
    return fresh;
  })();
  inflight.catch(() => {
    inflight = null;
  });
  return inflight;
}

export function usePokedex() {
  const [index, setIndex] = useState<PokedexIndex | null>(memory);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const onUpdate = (i: PokedexIndex) => alive && setIndex(i);
    listeners.add(onUpdate);
    loadIndex()
      .then((i) => alive && setIndex(i))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
      listeners.delete(onUpdate);
    };
  }, []);

  const byId = useMemo(() => {
    const m = new Map<number, IndexEntry>();
    index?.entries.forEach((e) => m.set(e.id, e));
    return m;
  }, [index]);

  return {
    entries: index?.entries ?? [],
    byId,
    loading: !index && !error,
    error,
    degraded: index?.source === "rest",
    retry: () => {
      setError(null);
      loadIndex().then(setIndex).catch((e: Error) => setError(e.message));
    },
  };
}


export function searchEntries(entries: IndexEntry[], q: string, limit = 40) {
  const query = norm(q.trim().replace(/^#/, ""));
  if (!query) return [];
  const num = Number(query);
  const scored: { e: IndexEntry; s: number }[] = [];
  for (const e of entries) {
    if (!Number.isNaN(num) && query !== "") {
      if (e.id === num) scored.push({ e, s: 0 });
      else if (String(e.id).startsWith(query)) scored.push({ e, s: 1 + e.id / 10000 });
      continue;
    }
    const n = norm(e.display);
    const slug = e.name;
    if (n === query || slug === query) scored.push({ e, s: 0 });
    else if (n.startsWith(query) || slug.startsWith(query)) scored.push({ e, s: 1 });
    else if (n.includes(query) || slug.includes(query)) scored.push({ e, s: 2 });
  }
  return scored.sort((a, b) => a.s - b.s || a.e.id - b.e.id).slice(0, limit).map((x) => x.e);
}
export { norm };
