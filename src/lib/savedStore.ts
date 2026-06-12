"use client";

import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Lightweight shared store for the current user's saved performance IDs.
 * Loaded once per session and shared across every SaveButton so a results
 * page issues one query instead of one per card.
 */

let savedIds = new Set<number>();
let loadedForUser: string | null = null;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  // New Set instance so useSyncExternalStore sees a changed snapshot.
  savedIds = new Set(savedIds);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Load the user's saved IDs once. Safe to call repeatedly. */
export function ensureSavedLoaded(userId: string) {
  if (loadedForUser === userId) return inFlight ?? Promise.resolve();
  loadedForUser = userId;
  inFlight = (async () => {
    const { data } = await supabase
      .from("saved_performances")
      .select("performance_id")
      .eq("user_id", userId);
    savedIds = new Set((data ?? []).map((r) => Number(r.performance_id)));
    emit();
  })();
  return inFlight;
}

/** Reset on sign-out / user change. */
export function resetSaved() {
  savedIds = new Set();
  loadedForUser = null;
  inFlight = null;
  emit();
}

export function isSavedId(id: number) {
  return savedIds.has(id);
}

/** Optimistically toggle, then persist. Reverts on error. */
export async function toggleSaved(id: number, userId: string) {
  const wasSaved = savedIds.has(id);
  if (wasSaved) savedIds.delete(id);
  else savedIds.add(id);
  emit();

  const { error } = wasSaved
    ? await supabase
        .from("saved_performances")
        .delete()
        .eq("user_id", userId)
        .eq("performance_id", id)
    : await supabase
        .from("saved_performances")
        .insert({ user_id: userId, performance_id: id });

  if (error) {
    // Revert optimistic change.
    if (wasSaved) savedIds.add(id);
    else savedIds.delete(id);
    emit();
    throw error;
  }
}

/** Subscribe a component to the saved set. */
export function useSavedIds() {
  return useSyncExternalStore(
    subscribe,
    () => savedIds,
    () => savedIds
  );
}
