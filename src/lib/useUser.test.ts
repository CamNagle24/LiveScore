/**
 * useUser / useSignOut unit tests.
 *
 * The store uses module-level singletons (state, initialized), so tests run
 * in declaration order and share state intentionally:
 *   1. initial loading state (getUser promise pending)
 *   2. getUser resolves → loading:false, user:null
 *   3. onAuthStateChange fires with a user → state updates
 *   4. onAuthStateChange fires sign-out → user cleared
 *   5. useSignOut calls signOut + navigates
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// ── Controllable async handles ────────────────────────────────────────────────
// Populated when init() calls getUser / onAuthStateChange for the first time.
let resolveGetUser!: (v: {
  data: { user: { id: string; email: string } | null };
}) => void;
let fireAuthChange!: (
  event: string,
  session: { user: { id: string; email: string } } | null
) => void;

// ── Mocks (hoisted so they are ready before the static imports below) ─────────
const mockGetUser = vi.hoisted(() => vi.fn());
const mockOnAuthStateChange = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());
const mockPush = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// Wire implementations before any hook renders (init() is lazy).
mockGetUser.mockImplementation(
  () => new Promise((r) => { resolveGetUser = r; })
);
mockOnAuthStateChange.mockImplementation(
  (cb: typeof fireAuthChange) => {
    fireAuthChange = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  }
);
mockSignOut.mockResolvedValue({ error: null });

import { useUser, useSignOut } from "./useUser";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useUser — initial load (getUser pending)", () => {
  it("returns loading:true with no user while getUser is in-flight", () => {
    const { result } = renderHook(() => useUser());
    expect(result.current).toEqual({ user: null, loading: true });
    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });
});

describe("useUser — loading → resolved transition", () => {
  it("flips loading to false after getUser resolves with no user", async () => {
    const { result } = renderHook(() => useUser());

    await act(async () => {
      resolveGetUser({ data: { user: null } });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });
});

describe("useUser — onAuthStateChange updates", () => {
  it("sets the user when SIGNED_IN event fires", async () => {
    const { result } = renderHook(() => useUser());

    await act(async () => {
      fireAuthChange("SIGNED_IN", {
        user: { id: "u1", email: "test@example.com" },
      });
    });

    await waitFor(() =>
      expect(result.current.user).toMatchObject({ email: "test@example.com" })
    );
    expect(result.current.loading).toBe(false);
  });

  it("clears user when SIGNED_OUT event fires (null session)", async () => {
    const { result } = renderHook(() => useUser());

    await act(async () => {
      fireAuthChange("SIGNED_OUT", null);
    });

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(result.current.loading).toBe(false);
  });
});

describe("useSignOut", () => {
  it("calls supabase.auth.signOut, pushes to /landing, and refreshes", async () => {
    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/landing");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
