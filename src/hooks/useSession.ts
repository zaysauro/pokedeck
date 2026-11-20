"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Profile } from "@/lib/social/types";

export interface SessionState {
  loaded: boolean;
  enabled: boolean;
  viewer: { id: string; email: string | null } | null;
  profile: Profile | null;
  badges: { notifications: number; messages: number; matches: number } | null;
  dev?: boolean;
}

let state: SessionState = { loaded: false, enabled: false, viewer: null, profile: null, badges: null };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

const emit = () => listeners.forEach((l) => l());

export function refreshSession(): Promise<void> {
  inflight ??= fetch("/api/social/me", { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => {
      state = { loaded: true, enabled: Boolean(d.enabled), viewer: d.viewer ?? null, profile: d.profile ?? null, badges: d.badges ?? null, dev: d.dev };
      emit();
    })
    .catch(() => {
      state = { ...state, loaded: true };
      emit();
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!state.loaded) void refreshSession();
  // badges (unread messages/notifications) refresh while the tab is visible
  timer ??= setInterval(() => {
    if (document.visibilityState === "visible" && state.viewer) void refreshSession();
  }, 45_000);
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const SERVER: SessionState = { loaded: false, enabled: false, viewer: null, profile: null, badges: null };

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER);
}

/** Refetch the session whenever the component mounts (e.g. after sign-in redirects). */
export function useFreshSession() {
  const s = useSession();
  useEffect(() => {
    void refreshSession();
  }, []);
  return s;
}
