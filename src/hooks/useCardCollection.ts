"use client";

import { useSyncExternalStore } from "react";
import { load, save } from "@/lib/storage";

/**
 * Personal TCG collection — the foundation for the future "Minha Coleção" area.
 * Lives next to the Pokédex collection (same storage layer: IndexedDB → localStorage),
 * under its own key so the existing favorites / decks data is never touched.
 *
 * Per card we keep: favorite flag, owned quantity (>1 = duplicates), wishlist flag and a
 * small snapshot (name, image, set) so lists render without re-fetching the API.
 */
export interface CardSnapshot {
  name: string;
  image: string | null;
  setId: string;
  setName: string | null;
  localId: string;
}

export interface CardEntry extends CardSnapshot {
  favorite: boolean;
  owned: number;
  wishlist: boolean;
  updatedAt: number;
}

interface State {
  hydrated: boolean;
  cards: Record<string, CardEntry>;
}

const KEY = "tcg-collection-v1";
let state: State = { hydrated: false, cards: {} };
const listeners = new Set<() => void>();
let hydrating = false;
let timer: ReturnType<typeof setTimeout> | null = null;

const emit = () => listeners.forEach((l) => l());

function commit(cards: Record<string, CardEntry>) {
  state = { ...state, cards };
  emit();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void save(KEY, { version: 1, cards: state.cards }), 120);
}

async function hydrate() {
  if (hydrating || state.hydrated) return;
  hydrating = true;
  const data = await load<{ version: number; cards: Record<string, CardEntry> }>(KEY);
  state = { hydrated: true, cards: { ...(data?.cards ?? {}), ...state.cards } };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  void hydrate();
  return () => listeners.delete(cb);
}

const SERVER: State = { hydrated: false, cards: {} };

export function useCardCollection<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(SERVER));
}

function upsert(id: string, snap: CardSnapshot, patch: Partial<Omit<CardEntry, keyof CardSnapshot>>) {
  const prev = state.cards[id] ?? { ...snap, favorite: false, owned: 0, wishlist: false, updatedAt: 0 };
  const next: CardEntry = { ...prev, ...snap, ...patch, updatedAt: Date.now() };
  const cards = { ...state.cards };
  if (!next.favorite && next.owned <= 0 && !next.wishlist) delete cards[id];
  else cards[id] = next;
  commit(cards);
}

export const cardCollection = {
  toggleFavorite(id: string, snap: CardSnapshot) {
    upsert(id, snap, { favorite: !state.cards[id]?.favorite });
  },
  toggleWishlist(id: string, snap: CardSnapshot) {
    upsert(id, snap, { wishlist: !state.cards[id]?.wishlist });
  },
  /** Sets how many physical copies are owned (0 removes it from the collection). */
  setOwned(id: string, snap: CardSnapshot, qty: number) {
    const owned = Math.max(0, Math.min(99, Math.round(qty)));
    upsert(id, snap, { owned, wishlist: owned > 0 ? false : state.cards[id]?.wishlist ?? false });
  },
  get: (id: string) => state.cards[id],
};

/* ---------------------------- selectors ---------------------------- */

export const selectFavorites = (s: State) => s.cards;

export function collectionStats(cards: Record<string, CardEntry>) {
  const list = Object.values(cards);
  return {
    favorites: list.filter((c) => c.favorite).length,
    owned: list.filter((c) => c.owned > 0).length,
    copies: list.reduce((n, c) => n + c.owned, 0),
    duplicates: list.filter((c) => c.owned > 1).length,
    wishlist: list.filter((c) => c.wishlist).length,
  };
}

/** Unique owned cards of a set and completion against its official count. */
export function setCompletion(cards: Record<string, CardEntry>, setId: string, official: number | null) {
  const owned = Object.entries(cards).filter(([, c]) => c.setId === setId && c.owned > 0).length;
  const base = official && official > 0 ? official : null;
  return { owned, official: base, percent: base ? Math.min(100, Math.round((owned / base) * 100)) : null };
}
