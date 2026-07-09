import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", mockFetch);

const { searchArtists } = await import("./audioDb");

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

describe("searchArtists", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns a typed artist array matching the AudioDB response shape", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        artists: [
          {
            strArtist: "Radiohead",
            strArtistThumb: "https://example.com/thumb.jpg",
            strGenre: "Rock",
            strCountry: "UK",
            strBiographyEN: "A band from Oxford.",
            strArtistFanart: "https://example.com/fanart.jpg",
          },
        ],
      })
    );
    const result = await searchArtists("radiohead");
    expect(result).toHaveLength(1);
    expect(result[0].strArtist).toBe("Radiohead");
    expect(result[0].strArtistThumb).toBe("https://example.com/thumb.jpg");
    expect(result[0].strGenre).toBe("Rock");
    expect(result[0].strCountry).toBe("UK");
  });

  it("returns an empty array when AudioDB returns artists: null", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ artists: null }));
    const result = await searchArtists("zzz_not_found");
    expect(result).toEqual([]);
  });

  it("returns an empty array when the upstream response is not OK", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, false));
    const result = await searchArtists("radiohead");
    expect(result).toEqual([]);
  });

  it("passes an AbortSignal to fetch (default 5s timeout)", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ artists: null }));
    await searchArtists("radiohead");
    const options = mockFetch.mock.calls[0][1];
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it("uses the caller-provided signal instead of the default when supplied", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ artists: null }));
    const signal = new AbortController().signal;
    await searchArtists("radiohead", signal);
    const options = mockFetch.mock.calls[0][1];
    expect(options.signal).toBe(signal);
  });

  it("throws when fetch throws (so callers can handle network errors)", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    await expect(searchArtists("radiohead")).rejects.toThrow("network down");
  });
});
