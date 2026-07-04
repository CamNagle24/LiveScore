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
        { artist_name: "Kendrick Lamar", performance_date: "2025-06-01" },
        { artist_name: "Kendrick Lamar", performance_date: "2025-01-01" },
        { artist_name: "SZA", performance_date: null },
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

  it("static entries carry a valid lastModified Date", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const entries = await sitemap();

    expect(entries.every((e) => e.lastModified instanceof Date)).toBe(true);
  });

  it("dynamic artist entries carry a valid lastModified Date derived from performance_date", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mockNot.mockResolvedValue({
      data: [
        { artist_name: "Kendrick Lamar", performance_date: "2025-06-01" },
        { artist_name: "SZA", performance_date: null },
      ],
    });

    const entries = await sitemap();

    const artistEntries = entries.filter((e) => e.url.includes("/artist/"));
    expect(artistEntries.length).toBeGreaterThan(0);
    expect(artistEntries.every((e) => e.lastModified instanceof Date)).toBe(true);

    const klEntry = artistEntries.find((e) => e.url.includes(encodeURIComponent("Kendrick Lamar")));
    expect(klEntry?.lastModified).toEqual(new Date("2025-06-01"));

    const szaEntry = artistEntries.find((e) => e.url.includes(encodeURIComponent("SZA")));
    expect(szaEntry?.lastModified).toBeInstanceOf(Date);
  });

  it("uses the most recent performance_date when an artist has multiple rows", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    mockNot.mockResolvedValue({
      data: [
        { artist_name: "Adele", performance_date: "2024-01-01" },
        { artist_name: "Adele", performance_date: "2025-12-31" },
        { artist_name: "Adele", performance_date: "2023-06-15" },
      ],
    });

    const entries = await sitemap();

    const adeleEntry = entries.find((e) => e.url.includes(encodeURIComponent("Adele")));
    expect(adeleEntry?.lastModified).toEqual(new Date("2025-12-31"));
  });
});
