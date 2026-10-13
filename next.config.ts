import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Allow HMR when the app is opened via the LAN address.
  allowedDevOrigins: ["10.1.1.50"],
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
