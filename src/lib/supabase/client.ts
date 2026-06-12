import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client. Sessions are persisted in cookies (via
 * @supabase/ssr) so they are readable by middleware and server components.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
