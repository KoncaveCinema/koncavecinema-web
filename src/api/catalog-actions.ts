"use server";

import { updateTag } from "next/cache";

/**
 * After a staff change the public pages show (a film announced, published or taken down, a
 * poster, a trailer, a screening, the featured lineup): the next visitor gets fresh data
 * instead of the cache's copy. It can't check who calls it, and needn't: all it does is make
 * the next request read the API.
 */
export async function refreshCatalog() {
  updateTag("catalog");
}
