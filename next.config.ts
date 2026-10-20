import type { NextConfig } from "next";

// Validates the environment at startup and build time
import "./src/env";

// Applied to every route. The Content Security Policy is added with the player (Phase F5),
// once the Mux stream, licence and image hosts are known.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), payment=(self), microphone=(self)",
  },
];

const nextConfig: NextConfig = {
  // Our own rules live in CLAUDE.md and .cursorrules; do not let `next dev` write AGENTS.md
  agentRules: false,

  // Instant navigation: static shells plus cached data, prefetched per link segment
  cacheComponents: true,
  partialPrefetching: true,

  // Automatic memoization of components and hooks: fewer re-renders without manual useMemo
  reactCompiler: true,

  poweredByHeader: false,
  reactStrictMode: true,

  compiler: {
    // Keep warnings and errors for error tracking; drop debug logging from production bundles
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  images: {
    // AVIF first (about 20% smaller than WebP for posters and billboards), WebP fallback
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2_678_400, // 31 days; artwork URLs change when the image changes
    remotePatterns: [
      // Mux thumbnails and storyboards; add the API's artwork host when it is known
      { protocol: "https", hostname: "image.mux.com" },
    ],
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  experimental: {
    // Native Rust port of the React Compiler inside Turbopack (no Babel pass, fast builds).
    // If it ever misbehaves, remove this line to fall back to the stable Babel compiler.
    turbopackRustReactCompiler: true,
    // Import only the used modules from these barrel-file packages
    optimizePackageImports: ["radix-ui", "date-fns", "motion"],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
