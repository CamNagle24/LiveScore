import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Venues",
  description:
    "Explore iconic venues and festivals and the live performances captured at each one.",
};

export default function VenuesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
