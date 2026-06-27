function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in .env.local before starting the app.`
    );
  }
  return value;
}

/**
 * Validated at module load so a missing/empty Supabase config fails fast
 * with a clear message instead of surfacing as an opaque auth/client error
 * later. Imported for its side effect from `src/instrumentation.ts`.
 */
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
};
