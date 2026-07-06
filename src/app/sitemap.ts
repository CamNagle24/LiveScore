import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/search", priority: 0.9, changeFrequency: "daily" },
  { path: "/artists", priority: 0.8, changeFrequency: "weekly" },
  { path: "/venues", priority: 0.7, changeFrequency: "weekly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    changeFrequency,
    priority,
    lastModified: new Date(),
  }));

  if (!supabaseUrl || !supabaseAnonKey) {
    return staticEntries;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data } = await supabase
    .from("performances")
    .select("artist_name, performance_date")
    .not("artist_name", "is", null);

  const artistDates = new Map<string, Date | null>();
  for (const row of data ?? []) {
    const name = String(row.artist_name);
    const date = row.performance_date ? new Date(row.performance_date) : null;
    const existing = artistDates.get(name);
    if (!artistDates.has(name) || (date && (!existing || date > existing))) {
      artistDates.set(name, date);
    }
  }

  const artistEntries: MetadataRoute.Sitemap = [...artistDates.entries()].map(([name, latestDate]) => ({
    url: `${siteUrl}/artist/${encodeURIComponent(name)}`,
    changeFrequency: "weekly",
    priority: 0.6,
    lastModified: latestDate ?? new Date(),
  }));

  return [...staticEntries, ...artistEntries];
}
