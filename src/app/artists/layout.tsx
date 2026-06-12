import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artists",
  description:
    "Browse every artist on LiveScore and explore their live performances, festival sets, and shows.",
};

export default function ArtistsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
