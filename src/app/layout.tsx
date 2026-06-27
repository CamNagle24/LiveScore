import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bebas = Bebas_Neue({ weight: "400", variable: "--font-bebas", subsets: ["latin"], display: "swap" });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://livescore.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LiveScore — Every Live Performance, All in One Place",
    template: "%s · LiveScore",
  },
  description:
    "Discover, track, and save legendary live performances — from Coachella headliners to Grammy showstoppers — and find where to watch them.",
  applicationName: "LiveScore",
  keywords: ["live performances", "concerts", "festivals", "where to watch", "setlists", "music"],
  openGraph: {
    type: "website",
    siteName: "LiveScore",
    title: "LiveScore — Every Live Performance, All in One Place",
    description:
      "Discover, track, and save legendary live performances and find where to watch them.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "LiveScore — Every Live Performance, All in One Place",
    description:
      "Discover, track, and save legendary live performances and find where to watch them.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-black focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-[#FF006E]"
        >
          Skip to main content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
