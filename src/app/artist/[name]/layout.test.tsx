import { describe, it, expect, afterEach, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("generateMetadata (artist layout)", () => {
  it("builds an encoded canonical URL from NEXT_PUBLIC_SITE_URL and the artist name", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://livescore.example";
    const { generateMetadata } = await import("./layout");

    const metadata = await generateMetadata({
      params: Promise.resolve({ name: "Kendrick Lamar" }),
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://livescore.example/artist/Kendrick%20Lamar"
    );
  });

  it("canonicalizes differently-encoded params for the same artist to the same URL", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://livescore.example";
    const { generateMetadata } = await import("./layout");

    // Two raw URL segments that decode to the identical artist string
    // "Beyoncé" but arrive differently encoded (literal UTF-8 vs.
    // percent-encoded accent) — both must canonicalize identically.
    const literal = await generateMetadata({
      params: Promise.resolve({ name: "Beyoncé" }),
    });
    const percentEncoded = await generateMetadata({
      params: Promise.resolve({ name: "Beyonc%C3%A9" }),
    });

    expect(literal.alternates?.canonical).toBe(percentEncoded.alternates?.canonical);
    expect(literal.alternates?.canonical).toBe(
      `https://livescore.example/artist/${encodeURIComponent("Beyoncé")}`
    );
  });

  it("canonicalizes artist names that differ only by case to distinct, deterministic URLs", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://livescore.example";
    const { generateMetadata } = await import("./layout");

    const lower = await generateMetadata({
      params: Promise.resolve({ name: "sza" }),
    });
    const upper = await generateMetadata({
      params: Promise.resolve({ name: "SZA" }),
    });

    // Canonicalization is consistent/encoded the same way regardless of
    // casing — it's a 1:1, idempotent transform of the decoded segment.
    expect(lower.alternates?.canonical).toBe("https://livescore.example/artist/sza");
    expect(upper.alternates?.canonical).toBe("https://livescore.example/artist/SZA");
  });

  it("falls back to the default site URL when NEXT_PUBLIC_SITE_URL is unset", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { generateMetadata } = await import("./layout");

    const metadata = await generateMetadata({
      params: Promise.resolve({ name: "SZA" }),
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://livescore.app/artist/SZA"
    );
  });

  it("includes openGraph.images so social link previews have an image", async () => {
    const { generateMetadata } = await import("./layout");

    const metadata = await generateMetadata({
      params: Promise.resolve({ name: "Radiohead" }),
    });

    expect(metadata.openGraph?.images).toBeTruthy();
  });
});
