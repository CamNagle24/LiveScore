import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search performances",
  description:
    "Search thousands of live performances by artist, event, or venue — and find where to watch each one.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
