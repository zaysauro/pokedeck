"use client";

import { get, set } from "idb-keyval";

/**
 * Thin persistence layer: IndexedDB first, localStorage as a fallback
 * (private windows / blocked IndexedDB). Swappable later for a remote backend.
 */
export async function load<T>(key: string): Promise<T | undefined> {
  try {
    const v = await get<T>(key);
    if (v !== undefined) return v;
  } catch {
    /* fall through */
  }
  try {
    const raw = localStorage.getItem(`pokedeck:${key}`);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

export async function save<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value);
    return;
  } catch {
    /* fall through */
  }
  try {
    localStorage.setItem(`pokedeck:${key}`, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep in memory only */
  }
}
