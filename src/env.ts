import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * The only place that reads process.env. A missing or malformed variable fails `next dev` and
 * `next build` with a clear message, mirroring the API's validated environment.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    // Base URL used by Server Components to reach the API. Defaults to the public URL; set it
    // when the server can reach the API over a private network.
    API_INTERNAL_URL: z.url().optional(),
    // Set by Vercel on every deployment. Anything other than production (staging, previews)
    // is kept out of search engines
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    // Staging only: when set, every page asks for this password (any username). Never set it
    // on production
    STAGING_PASSWORD: z.string().min(12).optional(),
  },
  client: {
    // Public origin of this web app, used for canonical URLs, Open Graph and Paystack callbacks
    NEXT_PUBLIC_APP_URL: z.url(),
    // Base URL of koncavecinema-api including its global prefix, e.g. http://localhost:3000/api
    NEXT_PUBLIC_API_URL: z.url(),
    // Where every page gets its data: the API, or built-in sample data for development, design
    // review and screenshots (films with placeholder art, showtimes relative to now, and a demo
    // booking flow that never charges). Read on the server and in the browser; not a secret.
    NEXT_PUBLIC_DATA_SOURCE: z.enum(["api", "fixtures"]).default("api"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    API_INTERNAL_URL: process.env.API_INTERNAL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    STAGING_PASSWORD: process.env.STAGING_PASSWORD,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_DATA_SOURCE: process.env.NEXT_PUBLIC_DATA_SOURCE,
  },
  emptyStringAsUndefined: true,
  // Lets tooling (lint, unit tests) import modules without a full environment
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
