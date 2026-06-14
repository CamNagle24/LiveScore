import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
