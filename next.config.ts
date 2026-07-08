import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    // Allow images from localhost and other domains
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],

    // Disable optimization in development to allows images from localhost with any port
    unoptimized: true,
  },
};

export default nextConfig;
