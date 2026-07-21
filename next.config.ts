import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Google OAuth button icon (useOauthProviderIcon.tsx).
    remotePatterns: [{ protocol: "https", hostname: "cdn.brandfetch.io" }],
  },
};

export default nextConfig;
