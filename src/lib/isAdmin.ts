/**
 * Shared admin-email check used by the two independent (defense-in-depth)
 * gates for `/developer`: `src/proxy.ts` and `src/app/developer/layout.tsx`.
 *
 * Reads `ADMIN_EMAILS` as a comma-separated list, trimming whitespace and
 * lowercasing both sides of the comparison so the two call sites can't
 * silently drift apart on case/whitespace handling.
 */
export function isAdmin(email: string | null | undefined): boolean {
  const candidate = email?.trim().toLowerCase() ?? "";
  if (!candidate) return false;

  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(candidate);
}
