import { api } from "@/lib/api";
import { isDemo } from "@/lib/demo";

import type { AdminOverview } from "./api-types";
import * as demo from "./demo";

/* The admin home's call. With NEXT_PUBLIC_DATA_SOURCE=fixtures a demo plays the API's part. */

export async function getOverview(): Promise<AdminOverview> {
  if (isDemo) return demo.getOverview();
  return api.get<AdminOverview>("/admin/overview");
}
