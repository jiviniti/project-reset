import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async redirects() {
    return [
      {
        source: "/take-it-to-the-table",
        destination: "/start-a-conversation",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
