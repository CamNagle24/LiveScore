import { createClient } from "./supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Shared browser Supabase client (lazy singleton).
 *
 * Backed by @supabase/ssr so the auth session lives in cookies and is visible
 * to middleware / server components. Existing imports of `{ supabase }` keep
 * working unchanged. For server code, use `createClient()` from
 * `@/lib/supabase/server` instead.
 *
 * The underlying client is created on first property access rather than at
 * import time. Client pages are statically prerendered on the server, where
 * the public env vars may be unset (and `createBrowserClient` throws on a
 * missing URL/key); deferring creation keeps that prerender from crashing,
 * since the real data calls only run in the browser (effects/handlers).
 */
let client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (!client) client = createClient();
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient(), prop, receiver);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
