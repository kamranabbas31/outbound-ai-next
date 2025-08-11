import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false, // Hide "X-Powered-By: Next.js"
  eslint: {
    ignoreDuringBuilds: true, // Prevent build failure due to ESLint errors
  },
  typescript: {
    ignoreBuildErrors: true, // Prevent build failure due to TS errors
  },
};

export default nextConfig;