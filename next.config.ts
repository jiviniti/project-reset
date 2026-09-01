import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  /**
   * Temporary entry point for the share-card review branch.
   *
   * A config redirect preserves Vercel's `_vercel_share` query parameter,
   * allowing mobile browsers that reject the access cookie to keep using the
   * temporary shareable link. Do not merge this into `main`.
   */
  async redirects() {
    return [
      {
        source: "/",
        destination: "/share-card-concepts",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
