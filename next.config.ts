import type { NextConfig } from "next";

// Validates the environment at startup and build time
import { env } from "./src/env";
import { IMAGE_HOSTS } from "./src/lib/image-hosts";

// The /api proxy is for local development only: a deployment calls the API directly. Vercel sets
// VERCEL_ENV on every build, so a stray proxy setting fails the build instead of going live
if (env.API_DEV_PROXY_URL && env.VERCEL_ENV) {
  throw new Error(
    "API_DEV_PROXY_URL is for local development only; remove it from this Vercel environment.",
  );
}

const dev = process.env.NODE_ENV === "development";
// Vercel's feedback toolbar, which Vercel adds to staging and preview deployments, never production
const toolbar = (...hosts: string[]) =>
  env.VERCEL_ENV === "preview" ? ` ${["https://vercel.live", ...hosts].join(" ")}` : "";

// Where the pages may load from. Scripts allow inline code because Next.js bootstraps each page
// inline; nonces would force every page to render per request and lose the static shells.
// Mux serves the stream, the DRM licence and the storyboards; litix.io is Mux's playback
// analytics; storage.googleapis.com receives the console's video uploads.
// F7 adds the chat (Socket.IO) and voice (LiveKit) hosts.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}${toolbar()}`,
  `style-src 'self' 'unsafe-inline'${toolbar()}`,
  `img-src 'self' data: blob: ${IMAGE_HOSTS.map((host) => `https://${host}`).join(" ")}${toolbar("https://vercel.com")}`,
  `font-src 'self'${toolbar("https://assets.vercel.com")}`,
  "media-src 'self' blob: https://*.mux.com https://*.streamable.com",
  [
    "connect-src 'self'",
    new URL(env.NEXT_PUBLIC_API_URL).origin,
    "https://*.mux.com https://*.litix.io https://storage.googleapis.com",
    // Turbopack's hot reload
    dev ? "ws:" : "",
    toolbar("wss://ws-us3.pusher.com").trim(),
  ]
    .filter(Boolean)
    .join(" "),
  "worker-src 'self' blob:",
  // Streamable teasers play in their own frame
  `frame-src https://streamable.com${toolbar()}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

// Applied to every route
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), payment=(self), microphone=(self)",
  },
  // Enforced after a clean run on staging in report-only mode (November 2026). Anything the
  // pages load from elsewhere is blocked, with a console line naming it
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
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
    // Film artwork from the API, then Mux thumbnails and storyboards (src/lib/image-hosts.ts)
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: "https", hostname })),
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

  // Local development against a remote API (see API_DEV_PROXY_URL in src/env.ts)
  async rewrites() {
    if (!env.API_DEV_PROXY_URL) return [];
    return [{ source: "/api/:path*", destination: `${env.API_DEV_PROXY_URL}/:path*` }];
  },
};

export default nextConfig;
