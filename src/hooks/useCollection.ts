"use client";

import { useSyncExternalStore } from "react";
import { uid } from "@/lib/format";
import { load, save } from "@/lib/storage";
import type { Preferences, Team } from "@/lib/types";

export const MAX_TEAM = 6;
export const MAX_COMPARE = 4;

interface CollectionState {
  hydrated: boolean;
  favorites: number[];
  teams: Team[];
  compare: number[];
  prefs: Preferences;
}

const KEY = "collection-v1";
let state: CollectionState = {
  hydrated: false,
  favorites: [],
  teams: [],
  compare: [],
  prefs: { shiny: false, artStyle: "artwork" },
};
const listeners = new Set<() => void>();
let hydrating = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const { hydrated: _h, ...data } = state;
    void _h;
    void save(KEY, data);
  }, 120);
}

function setState(patch: Partial<CollectionState> | ((s: CollectionState) => Partial<CollectionState>)) {
  const next = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...next };
  emit();
  if (state.hydrated) persist();
}

async function hydrate() {
  if (hydrating || state.hydrated) return;
  hydrating = true;
  const data = await load<Omit<CollectionState, "hydrated">>(KEY);
  state = {
    ...state,
    ...(data ?? {}),
    prefs: { ...state.prefs, ...(data?.prefs ?? {}) },
    hydrated: true,
  };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  void hydrate();
  return () => listeners.delete(cb);
}

const serverSnapshot = state;

export function useCollection<T>(selector: (s: CollectionState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(serverSnapshot),
  );
}

/* ---------------------------- actions ---------------------------- */

export const collection = {
  toggleFavorite(id: number) {
    setState((s) => ({
      favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites],
    }));
  },
  isFavorite: (id: number) => state.favorites.includes(id),

  setPrefs(p: Partial<Preferences>) {
    setState((s) => ({ prefs: { ...s.prefs, ...p } }));
  },

  toggleCompare(id: number) {
    setState((s) => {
      if (s.compare.includes(id)) return { compare: s.compare.filter((c) => c !== id) };
      return { compare: [...s.compare, id].slice(-MAX_COMPARE) };
    });
  },
  setCompare(ids: number[]) {
    setState({ compare: ids.slice(0, MAX_COMPARE) });
  },

  createTeam(partial: Partial<Team> = {}): Team {
    const now = Date.now();
    const team: Team = {
      id: uid(),
      name: partial.name ?? "Novo deck",
      description: partial.description ?? "",
      members: (partial.members ?? []).slice(0, MAX_TEAM),
      coverId: partial.coverId ?? null,
      favorite: partial.favorite ?? false,
      createdAt: now,
      updatedAt: now,
    };
    setState((s) => ({ teams: [team, ...s.teams] }));
    return team;
  },
  updateTeam(id: string, patch: Partial<Team>) {
    setState((s) => ({
      teams: s.teams.map((t) =>
        t.id === id
          ? { ...t, ...patch, members: (patch.members ?? t.members).slice(0, MAX_TEAM), updatedAt: Date.now() }
          : t,
      ),
    }));
  },
  deleteTeam(id: string) {
    setState((s) => ({ teams: s.teams.filter((t) => t.id !== id) }));
  },
  duplicateTeam(id: string): Team | null {
    const src = state.teams.find((t) => t.id === id);
    if (!src) return null;
    return collection.createTeam({ ...src, name: `${src.name} (cópia)`, favorite: false });
  },
  /** Adds a member; returns false when the team is already full. */
  addToTeam(id: string, pokemonId: number): boolean {
    const t = state.teams.find((x) => x.id === id);
    if (!t || t.members.length >= MAX_TEAM) return false;
    collection.updateTeam(id, { members: [...t.members, pokemonId], coverId: t.coverId ?? pokemonId });
    return true;
  },
  importTeams(teams: Team[]) {
    setState((s) => ({ teams: [...teams, ...s.teams] }));
  },
  getTeam: (id: string) => state.teams.find((t) => t.id === id),
};

/* --------------------------- import/export --------------------------- */

export interface TeamExport {
  app: "pokedeck";
  version: 1;
  exportedAt: string;
  teams: Pick<Team, "name" | "description" | "members" | "coverId" | "favorite">[];
}

export function exportTeams(teams: Team[]): TeamExport {
  return {
    app: "pokedeck",
    version: 1,
    exportedAt: new Date().toISOString(),
    teams: teams.map(({ name, description, members, coverId, favorite }) => ({ name, description, members, coverId, favorite })),
  };
}

/** Validates an imported JSON payload and normalizes it into fresh teams. */
export function parseTeamImport(raw: unknown): Team[] {
  const obj = raw as Partial<TeamExport> | Partial<TeamExport["teams"][number]>[];
  const list = Array.isArray(obj) ? obj : obj?.teams;
  if (!Array.isArray(list)) throw new Error("Arquivo inválido: nenhum time encontrado.");
  const now = Date.now();
  return list.map((t, i) => {
    const members = Array.isArray(t.members)
      ? t.members.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX_TEAM)
      : [];
    return {
      id: uid(),
      name: typeof t.name === "string" && t.name.trim() ? t.name.slice(0, 60) : `Time importado ${i + 1}`,
      description: typeof t.description === "string" ? t.description.slice(0, 280) : "",
      members,
      coverId: typeof t.coverId === "number" ? t.coverId : members[0] ?? null,
      favorite: Boolean(t.favorite),
      createdAt: now,
      updatedAt: now,
    };
  });
}

/** Compact share code (URL-safe base64 of name + members). */
export function encodeShare(team: Team) {
  const payload = JSON.stringify({ n: team.name, d: team.description, m: team.members, c: team.coverId });
  return btoa(unescape(encodeURIComponent(payload))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(code: string): Partial<Team> | null {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64)));
    const o = JSON.parse(json) as { n?: string; d?: string; m?: number[]; c?: number | null };
    const [t] = parseTeamImport([{ name: o.n, description: o.d, members: o.m, coverId: o.c ?? null }]);
    return t;
  } catch {
    return null;
  }
}
