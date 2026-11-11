import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // A stray lockfile in the user folder confuses workspace detection; pin the root to this app.
  turbopack: { root: path.join(__dirname) },
  poweredByHeader: false,
  // The share image reads brand fonts from disk at request time; make sure Vercel bundles them.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./assets/fonts/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Location is only used by "Find my nearest kitchen" on this site.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
  images: {
    // Product photos come straight from the WooCommerce media library.
    remotePatterns: [new URL("https://wafflencrepe.com/wp-content/uploads/**")],
    // We now request the full-resolution originals, so the first optimisation of each
    // image is comparatively slow. The shop's photos rarely change, so hold the
    // optimised copies for 30 days rather than re-fetching and re-encoding them.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
