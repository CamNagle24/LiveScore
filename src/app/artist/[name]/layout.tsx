import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://livescore.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const artist = decodeURIComponent(name);
  const canonical = `${siteUrl}/artist/${encodeURIComponent(artist)}`;
  return {
    title: artist,
    description: `Watch ${artist}'s live performances, festival sets, and shows — and find where to stream each one on LiveScore.`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${artist} · LiveScore`,
      description: `Live performances by ${artist} and where to watch them.`,
      images: [{ url: '/og-default.png' }],
    },
  };
}

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
