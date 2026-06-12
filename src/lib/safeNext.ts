/**
 * Restrict a user-supplied `next` redirect target to an internal path, so the
 * post-login redirect can't be turned into an open-redirect phishing vector.
 *
 * Accepts only same-site paths: must start with a single "/" and must not be a
 * protocol-relative ("//host") or backslash-smuggled ("/\\host") URL, both of
 * which browsers can resolve to an external origin.
 */
export function safeNext(
  next: string | null | undefined,
  fallback = "/profile"
): string {
  if (!next || !next.startsWith("/")) return fallback;
  if (next[1] === "/" || next[1] === "\\") return fallback;
  return next;
}
