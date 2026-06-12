import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your saved live performances and listening stats on LiveScore.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
