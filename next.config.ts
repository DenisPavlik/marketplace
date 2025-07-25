import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: '*.googleusercontent.com',
      },
      {
        hostname: '*.imagekit.io',
      }
    ],
  },
};

export default nextConfig;
