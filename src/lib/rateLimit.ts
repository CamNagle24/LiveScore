/**
 * Minimal in-memory token-bucket rate limiter, keyed by an arbitrary string
 * (typically caller IP). Intentionally process-local: on serverless/edge
 * deployments each instance/cold-start gets its own bucket map, so this is a
 * best-effort throttle (smooths out a single hammering client against a
 * single warm instance) rather than a globally-consistent limit. That's an
 * acceptable trade-off for protecting a rate-limited third-party upstream
 * from casual abuse without adding an external dependency (e.g. Redis).
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Maximum tokens (requests) the bucket can hold. */
  limit: number;
  /** Time window in milliseconds over which the bucket fully refills. */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the caller should retry (only meaningful when !ok). */
  retryAfterSeconds: number;
}

/**
 * Consume one token from the bucket identified by `key`. Returns `ok: false`
 * once the bucket is exhausted, until tokens refill (continuously, at a rate
 * of `limit` tokens per `windowMs`).
 */
export function consumeToken(
  key: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  let tokens: number;
  let lastRefill: number;

  if (!existing) {
    tokens = limit;
    lastRefill = now;
  } else {
    const elapsed = Math.max(0, now - existing.lastRefill);
    const refillAmount = (elapsed / windowMs) * limit;
    tokens = Math.min(limit, existing.tokens + refillAmount);
    lastRefill = now;
  }

  if (tokens < 1) {
    buckets.set(key, { tokens, lastRefill });
    const deficit = 1 - tokens;
    const retryAfterSeconds = Math.ceil((deficit / limit) * (windowMs / 1000));
    return { ok: false, retryAfterSeconds };
  }

  buckets.set(key, { tokens: tokens - 1, lastRefill });
  return { ok: true, retryAfterSeconds: 0 };
}

/** Test-only helper to reset state between unit tests. */
export function _resetRateLimitState(): void {
  buckets.clear();
}

const FALLBACK_KEY = "unknown";

/**
 * Best-effort extraction of the caller's IP from standard proxy/CDN headers.
 * `NextRequest` (App Router Route Handlers) no longer exposes `request.ip`
 * (removed in Next.js v15) — the documented replacement is reading the
 * conventional `x-forwarded-for` header (and `x-real-ip` as a secondary
 * fallback) directly off `request.headers`. Falls back to a constant key so
 * a missing header never throws and callers without any proxy headers are
 * still rate-limited together rather than bypassing the limiter entirely.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  return FALLBACK_KEY;
}
