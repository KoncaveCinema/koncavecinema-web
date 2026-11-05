import { api } from "@/lib/api";
import { isDemo } from "@/lib/demo";

import type { AuditPage } from "./api-types";
import * as demo from "./demo";

/* The audit log (super admin only). With NEXT_PUBLIC_DATA_SOURCE=fixtures a demo plays the
   API's part. */

export interface AuditQuery {
  /** One member's entries */
  userId?: string;
  /** An action prefix, e.g. ADMIN_ or PAYMENT_ */
  action?: string;
}

export function listAudit(query: AuditQuery & { cursor?: string }): Promise<AuditPage> {
  if (isDemo) return demo.listAudit(query);
  return api.get<AuditPage>("/admin/audit-logs", { params: { ...query, limit: 50 } });
}
