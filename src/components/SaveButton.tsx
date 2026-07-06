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
import { track } from "@/lib/analytics";

/**
 * Bookmark toggle for a performance. Signed-out clicks route to /login
 * (account-bound saving). Signed-in clicks optimistically save/unsave.
 *
 * Designed to sit on top of a card, so it stops click propagation.
 */
export function SaveButton({ performanceId, size = 34 }: { performanceId: string; size?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();
  useSavedIds(); // re-render on store changes
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) ensureSavedLoaded(user.id);
    else resetSaved();
  }, [user]);

  // Auto-dismiss the error tooltip.
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const saved = isSavedId(performanceId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading || busy) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const wasSaved = saved;
    setBusy(true);
    setError(null);
    try {
      await toggleSaved(performanceId, user.id);
      track('save_toggle', { performanceId, saved: !wasSaved });
    } catch {
      // store already reverted; let the user know it didn't go through
      setError(wasSaved ? "Couldn't remove. Try again." : "Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
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
      {error && (
        <div
          role="alert"
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: "6px",
            background: "rgba(0,0,0,0.85)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff",
            fontSize: "11px",
            padding: "4px 8px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
