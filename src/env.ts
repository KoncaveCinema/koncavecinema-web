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
    // Where public catalog pages get films: the API, or built-in sample films (placeholder art,
    // showtimes relative to now) for development, design review and screenshots
    CATALOG_SOURCE: z.enum(["api", "fixtures"]).default("api"),
  },
  client: {
    // Public origin of this web app, used for canonical URLs, Open Graph and Paystack callbacks
    NEXT_PUBLIC_APP_URL: z.url(),
    // Base URL of koncavecinema-api including its global prefix, e.g. http://localhost:3000/api
    NEXT_PUBLIC_API_URL: z.url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    API_INTERNAL_URL: process.env.API_INTERNAL_URL,
    CATALOG_SOURCE: process.env.CATALOG_SOURCE,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  emptyStringAsUndefined: true,
  // Lets tooling (lint, unit tests) import modules without a full environment
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
