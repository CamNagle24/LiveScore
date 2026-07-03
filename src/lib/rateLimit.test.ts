import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { consumeToken, getClientIp, _resetRateLimitState } from "./rateLimit";

describe("consumeToken", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetRateLimitState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < 5; i++) {
      expect(consumeToken("ip-a", { limit: 5, windowMs: 10_000 }).ok).toBe(
        true
      );
    }
  });

  it("rejects requests once the limit is exceeded within the window", () => {
    for (let i = 0; i < 5; i++) {
      consumeToken("ip-b", { limit: 5, windowMs: 10_000 });
    }
    const result = consumeToken("ip-b", { limit: 5, windowMs: 10_000 });
    expect(result.ok).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("allows requests again after the window elapses", () => {
    for (let i = 0; i < 5; i++) {
      consumeToken("ip-c", { limit: 5, windowMs: 10_000 });
    }
    expect(consumeToken("ip-c", { limit: 5, windowMs: 10_000 }).ok).toBe(
      false
    );

    vi.advanceTimersByTime(10_000);

    expect(consumeToken("ip-c", { limit: 5, windowMs: 10_000 }).ok).toBe(
      true
    );
  });

  it("tracks separate IPs independently", () => {
    for (let i = 0; i < 5; i++) {
      consumeToken("ip-d", { limit: 5, windowMs: 10_000 });
    }
    expect(consumeToken("ip-d", { limit: 5, windowMs: 10_000 }).ok).toBe(
      false
    );
    // A different key has its own bucket and is unaffected.
    expect(consumeToken("ip-e", { limit: 5, windowMs: 10_000 }).ok).toBe(
      true
    );
  });

  it("partially refills tokens proportional to elapsed time", () => {
    for (let i = 0; i < 5; i++) {
      consumeToken("ip-f", { limit: 5, windowMs: 10_000 });
    }
    expect(consumeToken("ip-f", { limit: 5, windowMs: 10_000 }).ok).toBe(
      false
    );

    // Halfway through the window, ~2-3 tokens should have refilled.
    vi.advanceTimersByTime(5_000);
    expect(consumeToken("ip-f", { limit: 5, windowMs: 10_000 }).ok).toBe(
      true
    );
  });
});

describe("getClientIp", () => {
  it("reads the first IP from x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({ "x-real-ip": "9.9.9.9" });
    expect(getClientIp(headers)).toBe("9.9.9.9");
  });

  it("falls back to a constant key when no IP header is present", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("unknown");
  });
});
