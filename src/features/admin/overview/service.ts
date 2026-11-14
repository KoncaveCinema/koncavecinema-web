import { api } from "@/api";

import type { AdminOverview } from "./api-types";

/* The admin home's call. */

export async function getOverview(): Promise<AdminOverview> {
  return api.get<AdminOverview>("/admin/overview");
}
