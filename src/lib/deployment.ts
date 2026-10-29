import "server-only";

import { env } from "@/env";

/**
 * Whether search engines may index this deployment. Only production is indexed: staging and
 * preview deployments carry copies of the site that must never compete with it in search.
 * Self-hosted or local builds (no VERCEL_ENV) count as production.
 */
export const indexable = env.VERCEL_ENV !== "preview" && env.VERCEL_ENV !== "development";
