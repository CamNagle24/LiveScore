import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { _resetRateLimitState } from "@/lib/rateLimit";

const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", mockFetch);

const { GET } = await import("./route");

let ipCounter = 0;
/** A fresh IP per call so unrelated tests don't share a rate-limit bucket. */
function uniqueIp() {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
}

function req(query: string, ip: string = uniqueIp()) {
  return new NextRequest(`http://localhost/api/artists/search?${query}`, {
    headers: { "x-forwarded-for": ip },
  });
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  };
}

describe("GET /api/artists/search", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    _resetRateLimitState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty list without calling upstream when q is missing", async () => {
    const res = await GET(req(""));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ artists: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns an empty list without calling upstream when q is whitespace-only", async () => {
    const res = await GET(req("q=%20%20%20"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ artists: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects queries longer than 100 characters without calling upstream", async () => {
    const longQuery = "a".repeat(101);
    const res = await GET(req(`q=${longQuery}`));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ artists: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("accepts a query at exactly the max length", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ artists: null }));
    const maxQuery = "a".repeat(100);
    const res = await GET(req(`q=${maxQuery}`));
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("maps a successful AudioDB response", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        artists: [
          {
            strArtist: "Radiohead",
            strGenre: "Rock",
            strCountry: "UK",
            strArtistThumb: "https://example.com/thumb.jpg",
            strArtistFanart: "https://example.com/fanart.jpg",
            strBiographyEN: "A band.",
          },
        ],
      })
    );

    const res = await GET(req("q=radiohead"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.artists).toEqual([
      {
        name: "Radiohead",
        genre: "Rock",
        country: "UK",
        thumb: "https://example.com/thumb.jpg",
        fanart: "https://example.com/fanart.jpg",
        biography: "A band.",
      },
    ]);
  });

  it("returns an empty list when AudioDB returns artists: null", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ artists: null }));
    const res = await GET(req("q=zzzznotfound"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ artists: [] });
  });

  it("returns an empty list when the upstream response is not OK", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, false));
    const res = await GET(req("q=radiohead"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ artists: [] });
  });

  it("returns a 500 when the upstream fetch throws a network error", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    const res = await GET(req("q=radiohead"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ artists: [] });
  });

  it("returns a 500 when the upstream fetch times out", async () => {
    mockFetch.mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError"));
    const res = await GET(req("q=radiohead"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ artists: [] });
  });

  it("passes an AbortSignal with a 5s timeout to the upstream fetch", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ artists: null }));
    await GET(req("q=radiohead"));
    const options = mockFetch.mock.calls[0][1];
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("GET /api/artists/search rate limiting", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(jsonResponse({ artists: null }));
    _resetRateLimitState();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("allows requests under the limit", async () => {
    const ip = uniqueIp();
    for (let i = 0; i < 10; i++) {
      const res = await GET(req("q=radiohead", ip));
      expect(res.status).toBe(200);
    }
    expect(mockFetch).toHaveBeenCalledTimes(10);
  });

  it("returns 429 once the limit is exceeded within the window", async () => {
    const ip = uniqueIp();
    for (let i = 0; i < 10; i++) {
      await GET(req("q=radiohead", ip));
    }
    const res = await GET(req("q=radiohead", ip));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ artists: [], error: "rate_limited" });
    expect(res.headers.get("Retry-After")).not.toBeNull();
    // The limited request must not reach the upstream API.
    expect(mockFetch).toHaveBeenCalledTimes(10);
  });

  it("allows requests again after the window elapses", async () => {
    vi.useFakeTimers();
    const ip = uniqueIp();
    for (let i = 0; i < 10; i++) {
      await GET(req("q=radiohead", ip));
    }
    const limited = await GET(req("q=radiohead", ip));
    expect(limited.status).toBe(429);

    vi.advanceTimersByTime(10_000);

    const res = await GET(req("q=radiohead", ip));
    expect(res.status).toBe(200);
  });

  it("tracks different IPs independently", async () => {
    const ipA = uniqueIp();
    const ipB = uniqueIp();
    for (let i = 0; i < 10; i++) {
      await GET(req("q=radiohead", ipA));
    }
    const limited = await GET(req("q=radiohead", ipA));
    expect(limited.status).toBe(429);

    // A different IP still has its own untouched budget.
    const res = await GET(req("q=radiohead", ipB));
    expect(res.status).toBe(200);
  });

  it("rate limits before validating the query, keyed by IP regardless of query value", async () => {
    const ip = uniqueIp();
    for (let i = 0; i < 10; i++) {
      await GET(req("", ip));
    }
    const res = await GET(req("", ip));
    expect(res.status).toBe(429);
  });
});
