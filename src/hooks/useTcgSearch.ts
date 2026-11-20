"use client";

import { useEffect, useRef, useState } from "react";
import { tcgFiltersToParams } from "@/lib/tcg/query";
import type { TcgFilters, TcgSearchResult } from "@/lib/tcg/types";

/** Session cache shared by every TCG list on the page: identical queries never hit the network twice. */
const cache = new Map<string, TcgSearchResult>();
const pending = new Map<string, Promise<TcgSearchResult>>();

export function fetchTcg(path: string, signal?: AbortSignal): Promise<TcgSearchResult> {
  const hit = cache.get(path);
  if (hit) return Promise.resolve(hit);
  let p = pending.get(path);
  if (!p) {
    p = fetch(path)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error ?? "Não foi possível carregar as cartas.");
        cache.set(path, data as TcgSearchResult);
        return data as TcgSearchResult;
      })
      .finally(() => pending.delete(path));
    pending.set(path, p);
  }
  if (!signal) return p;
  return new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
    p!.then(resolve, reject);
  });
}

export function tcgSearchPath(f: TcgFilters, pageSize?: number) {
  const p = tcgFiltersToParams(f);
  if (pageSize) p.set("pageSize", String(pageSize));
  return `/api/tcg?${p.toString()}`;
}

/** Debounced, abortable, cached search. `initial` (server-rendered) seeds the cache. */
export function useTcgSearch(filters: TcgFilters, initial?: TcgSearchResult | null, pageSize?: number) {
  const path = tcgSearchPath(filters, pageSize);
  const seeded = useRef(false);
  if (!seeded.current && initial) {
    cache.set(path, initial);
    seeded.current = true;
  }
  const [data, setData] = useState<TcgSearchResult | null>(cache.get(path) ?? null);
  const [loading, setLoading] = useState(!cache.has(path));
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const hit = cache.get(path);
    if (hit) {
      setData(hit);
      setLoading(false);
      setError(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      fetchTcg(path, ctrl.signal)
        .then((d) => {
          setData(d);
          setLoading(false);
        })
        .catch((e: Error) => {
          if (e.name === "AbortError") return;
          setError(e.message);
          setLoading(false);
        });
    }, 280);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [path, nonce]);

  return { data, loading, error, retry: () => setNonce((n) => n + 1) };
}
