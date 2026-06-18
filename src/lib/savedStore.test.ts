import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const mockEq = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn(() => ({ eq: mockEq })));
const mockInsert = vi.hoisted(() => vi.fn());
const mockDeleteEq2 = vi.hoisted(() => vi.fn());
const mockDeleteEq1 = vi.hoisted(() => vi.fn(() => ({ eq: mockDeleteEq2 })));
const mockDelete = vi.hoisted(() => vi.fn(() => ({ eq: mockDeleteEq1 })));
const mockFrom = vi.hoisted(() =>
  vi.fn(() => ({ select: mockSelect, insert: mockInsert, delete: mockDelete }))
);

vi.mock("@/lib/supabase", () => ({
  supabase: { from: mockFrom },
}));

import {
  ensureSavedLoaded,
  resetSaved,
  isSavedId,
  toggleSaved,
  useSavedIds,
} from "./savedStore";

beforeEach(() => {
  resetSaved();
  vi.clearAllMocks();
  mockEq.mockResolvedValue({ data: [], error: null });
  mockInsert.mockResolvedValue({ error: null });
  mockDeleteEq2.mockResolvedValue({ error: null });
});

describe("ensureSavedLoaded", () => {
  it("populates savedIds and deduplicates repeated rows", async () => {
    mockEq.mockResolvedValue({
      data: [
        { performance_id: "1" },
        { performance_id: "1" },
        { performance_id: "2" },
      ],
      error: null,
    });

    await ensureSavedLoaded("user-1");

    expect(isSavedId("1")).toBe(true);
    expect(isSavedId("2")).toBe(true);
    const { result } = renderHook(() => useSavedIds());
    expect(result.current.size).toBe(2);
  });

  it("returns the same in-flight promise for a duplicate call before the first resolves", async () => {
    let resolveFn!: (v: { data: unknown[]; error: null }) => void;
    mockEq.mockImplementationOnce(
      () => new Promise((res) => { resolveFn = res; })
    );

    const p1 = ensureSavedLoaded("user-2");
    const p2 = ensureSavedLoaded("user-2");
    expect(p1).toBe(p2);

    resolveFn({ data: [], error: null });
    await p1;
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });
});

describe("toggleSaved", () => {
  it("optimistically updates then reverts and rethrows on Supabase error", async () => {
    mockInsert.mockResolvedValue({ error: { message: "db error" } });

    const promise = toggleSaved("p1", "user-1");
    expect(isSavedId("p1")).toBe(true);

    await expect(promise).rejects.toEqual({ message: "db error" });
    expect(isSavedId("p1")).toBe(false);
  });
});

describe("resetSaved", () => {
  it("clears all state and allows a fresh load", async () => {
    mockEq.mockResolvedValue({ data: [{ performance_id: "x" }], error: null });
    await ensureSavedLoaded("user-3");
    expect(isSavedId("x")).toBe(true);

    resetSaved();
    expect(isSavedId("x")).toBe(false);

    await ensureSavedLoaded("user-3");
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });
});
