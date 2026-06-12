"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * Shared auth store. `supabase.auth.getUser()` makes a network round-trip to
 * revalidate the JWT, so a per-component hook would fire one request per
 * mounted SaveButton (i.e. per card on a results page). Instead the session is
 * fetched once and a single onAuthStateChange subscription fans out to every
 * consumer via useSyncExternalStore.
 */

type AuthState = { user: User | null; loading: boolean };

let state: AuthState = { user: null, loading: true };
const listeners = new Set<() => void>();
let initialized = false;

function setState(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

function init() {
  if (initialized) return;
  initialized = true;

  supabase.auth.getUser().then(({ data }) => {
    setState({ user: data.user, loading: false });
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    setState({ user: session?.user ?? null, loading: false });
  });
}

function subscribe(cb: () => void) {
  init();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Stable reference so getServerSnapshot doesn't loop during SSR/prerender.
const serverSnapshot: AuthState = { user: null, loading: true };

/**
 * Single source of truth for the current auth user in client components.
 * Returns `{ user, loading }` and stays in sync via onAuthStateChange.
 */
export function useUser(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverSnapshot
  );
}

/**
 * Hook returning a sign-out callback that clears the session and returns the
 * user to the landing page.
 */
export function useSignOut() {
  const router = useRouter();
  return async () => {
    await supabase.auth.signOut();
    router.push("/landing");
    router.refresh();
  };
}
