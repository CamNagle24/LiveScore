import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockNot = vi.hoisted(() => vi.fn());
const mockSelect = vi.hoisted(() => vi.fn(() => ({ not: mockNot })));
const mockFrom = vi.hoisted(() => vi.fn(() => ({ select: mockSelect })));
const mockCreateClient = vi.hoisted(() => vi.fn(() => ({ from: mockFrom })));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

import sitemap from "./sitemap";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockNot.mockClear();
  mockCreateClient.mockClear();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("sitemap", () => {
  it("returns static routes only when Supabase env vars are missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const entries = await sitemap();

    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(entries).toHaveLength(4);
    expect(entries.some((e) => e.url.includes("/artist/"))).toBe(false);
  });

  it("includes deduped /artist/[name] entries built from distinct artist_name values", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mockNot.mockResolvedValue({
      data: [
        { artist_name: "Kendrick Lamar" },
        { artist_name: "Kendrick Lamar" },
        { artist_name: "SZA" },
      ],
    });

    const entries = await sitemap();

    const artistUrls = entries.filter((e) => e.url.includes("/artist/")).map((e) => e.url);
    expect(artistUrls).toHaveLength(2);
    expect(artistUrls).toEqual(
      expect.arrayContaining([
        expect.stringContaining(encodeURIComponent("Kendrick Lamar")),
        expect.stringContaining(encodeURIComponent("SZA")),
      ])
    );
  });
});
