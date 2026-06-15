import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Discover, track, and save legendary live performances — from Coachella headliners to Grammy showstoppers — and find where to watch them.",
  openGraph: {
    title: "LiveScore — Every Live Performance, All in One Place",
    description:
      "Discover, track, and save legendary live performances and find where to watch them.",
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
