import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const artist = decodeURIComponent(name);
  return {
    title: artist,
    description: `Watch ${artist}'s live performances, festival sets, and shows — and find where to stream each one on LiveScore.`,
    openGraph: {
      title: `${artist} · LiveScore`,
      description: `Live performances by ${artist} and where to watch them.`,
    },
  };
}

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
