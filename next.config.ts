import type { NextConfig } from "next";

// img-src also covers TheAudioDB (artist thumb/fanart, rendered directly via
// <img>/background-image on the artist page) and the Google OAuth avatar host
// (rendered via <img> in PageNav/profile), in addition to the hosts called
// out in the originating task, so existing images don't silently break.
const imgSrc = [
  "'self'",
  "https://img.youtube.com",
  "https://*.supabase.co",
  "https://raw.githubusercontent.com",
  "https://www.theaudiodb.com",
  "https://lh3.googleusercontent.com",
].join(" ");

const connectSrc = [
  "'self'",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "https://www.theaudiodb.com",
]
  .filter(Boolean)
  .join(" ");

const contentSecurityPolicy = [
  `script-src 'self'`,
  `img-src ${imgSrc}`,
  `connect-src ${connectSrc}`,
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Landing-page "Recent Drops" images are hosted in the LiveListenPhotos
    // GitHub repo and served via ?raw=true (which 302s to
    // raw.githubusercontent.com — next/image follows that redirect). Scope the
    // pattern tightly to that repo path and exact query string.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.com",
        pathname: "/CamNagle24/LiveListenPhotos/**",
        search: "?raw=true",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
