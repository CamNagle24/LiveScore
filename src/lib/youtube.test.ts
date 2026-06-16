import { describe, it, expect } from "vitest";
import { getYouTubeThumbnail, getBestSource } from "./youtube";

// ─── getYouTubeThumbnail ──────────────────────────────────────────────────────

describe("getYouTubeThumbnail", () => {
  it("returns maxresdefault for a youtu.be short URL", () => {
    expect(getYouTubeThumbnail("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    );
  });

  it("returns maxresdefault for a youtube.com/watch URL", () => {
    expect(getYouTubeThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    );
  });

  it("handles youtu.be URL with query params after the ID", () => {
    expect(getYouTubeThumbnail("https://youtu.be/dQw4w9WgXcQ?t=42")).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    );
  });

  it("handles youtube.com URL with extra query params", () => {
    expect(
      getYouTubeThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxxx&index=1")
    ).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg");
  });

  it("accepts IDs with underscores and hyphens", () => {
    expect(getYouTubeThumbnail("https://youtu.be/aB1-cD2_eF3")).toBe(
      "https://img.youtube.com/vi/aB1-cD2_eF3/maxresdefault.jpg"
    );
  });

  it("returns null for a non-YouTube URL", () => {
    expect(getYouTubeThumbnail("https://vimeo.com/12345678")).toBeNull();
  });

  it("returns null for a Netflix URL", () => {
    expect(getYouTubeThumbnail("https://www.netflix.com/watch/80018294")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(getYouTubeThumbnail(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getYouTubeThumbnail(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getYouTubeThumbnail("")).toBeNull();
  });

  it("returns null for a malformed URL", () => {
    expect(getYouTubeThumbnail("not-a-url")).toBeNull();
  });

  it("returns null when the YouTube video ID is too short (< 11 chars)", () => {
    expect(getYouTubeThumbnail("https://youtu.be/short")).toBeNull();
  });

  it("returns null when the YouTube video ID is too long (> 11 chars)", () => {
    expect(getYouTubeThumbnail("https://youtu.be/thisIsTooLong123")).toBeNull();
  });

  it("returns null for youtube.com URL with missing v param", () => {
    expect(getYouTubeThumbnail("https://www.youtube.com/channel/UCxxxxxx")).toBeNull();
  });
});

// ─── getBestSource ────────────────────────────────────────────────────────────

describe("getBestSource", () => {
  it("returns null for null input", () => {
    expect(getBestSource(null)).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(getBestSource([])).toBeNull();
  });

  it("prefers verified YouTube over verified non-YouTube", () => {
    const result = getBestSource([
      { url: "https://www.amazon.com/watch", source_status: "verified" },
      { url: "https://www.youtube.com/watch?v=abc123", source_status: "verified" },
    ]);
    expect(result?.url).toBe("https://www.youtube.com/watch?v=abc123");
    expect(result?.isYouTube).toBe(true);
  });

  it("prefers verified non-YouTube over unverified YouTube", () => {
    const result = getBestSource([
      { url: "https://www.youtube.com/watch?v=abc", source_status: "unverified" },
      { url: "https://www.netflix.com/watch/123", source_status: "verified" },
    ]);
    expect(result?.url).toBe("https://www.netflix.com/watch/123");
    expect(result?.isYouTube).toBe(false);
  });

  it("falls back to an unverified source when no verified sources exist", () => {
    const result = getBestSource([
      { url: "https://vimeo.com/12345", source_status: "unverified" },
    ]);
    expect(result?.url).toBe("https://vimeo.com/12345");
  });

  it("returns isYouTube=true for youtu.be URLs", () => {
    const result = getBestSource([
      { url: "https://youtu.be/dQw4w9WgXcQ", source_status: "verified" },
    ]);
    expect(result?.isYouTube).toBe(true);
  });

  it("returns isYouTube=false for non-YouTube URLs", () => {
    const result = getBestSource([
      { url: "https://www.netflix.com/watch/80018294", source_status: "verified" },
    ]);
    expect(result?.isYouTube).toBe(false);
  });

  it("uses subscription_service as the platform name when present", () => {
    const result = getBestSource([
      {
        url: "https://www.amazon.com/watch",
        source_status: "verified",
        subscription_service: "Amazon Prime Video",
      },
    ]);
    expect(result?.platform).toBe("Amazon Prime Video");
  });

  it("falls back to 'YouTube' when subscription_service is null and URL contains youtube", () => {
    const result = getBestSource([
      { url: "https://www.youtube.com/watch?v=x", source_status: "verified", subscription_service: null },
    ]);
    expect(result?.platform).toBe("YouTube");
  });

  it("falls back to 'Watch' when subscription_service is null and URL is not YouTube", () => {
    const result = getBestSource([
      { url: "https://vimeo.com/123", source_status: "unverified", subscription_service: null },
    ]);
    expect(result?.platform).toBe("Watch");
  });

  it("returns the single source in a one-element array", () => {
    const src = { url: "https://www.youtube.com/watch?v=test11char", source_status: "verified" };
    const result = getBestSource([src]);
    expect(result?.url).toBe(src.url);
  });
});
