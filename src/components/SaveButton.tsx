"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/lib/useUser";
import {
  ensureSavedLoaded,
  isSavedId,
  toggleSaved,
  useSavedIds,
  resetSaved,
} from "@/lib/savedStore";

/**
 * Bookmark toggle for a performance. Signed-out clicks route to /login
 * (account-bound saving). Signed-in clicks optimistically save/unsave.
 *
 * Designed to sit on top of a card, so it stops click propagation.
 */
export function SaveButton({ performanceId, size = 34 }: { performanceId: number; size?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();
  useSavedIds(); // re-render on store changes
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) ensureSavedLoaded(user.id);
    else resetSaved();
  }, [user]);

  const saved = isSavedId(performanceId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading || busy) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setBusy(true);
    try {
      await toggleSaved(performanceId, user.id);
    } catch {
      // store already reverted; swallow
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? "Remove from saved" : "Save performance"}
      aria-pressed={saved}
      title={saved ? "Saved" : "Save"}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.18)",
        background: saved ? "rgba(255,0,110,0.9)" : "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        color: "#fff",
        cursor: busy ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        fontSize: size * 0.46,
        lineHeight: 1,
        transition: "background 150ms ease, transform 150ms ease",
        opacity: busy ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!saved) e.currentTarget.style.background = "rgba(255,0,110,0.55)";
      }}
      onMouseLeave={(e) => {
        if (!saved) e.currentTarget.style.background = "rgba(0,0,0,0.55)";
      }}
    >
      {saved ? "♥" : "♡"}
    </button>
  );
}
