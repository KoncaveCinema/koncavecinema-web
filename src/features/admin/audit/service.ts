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
  /** Where this page starts: the previous page's `nextCursor`; the newest when absent */
  cursor?: string;
  /** Entries a page: 50 when absent (the API's default), at most 100 */
  limit?: number;
}

export function listAudit(query: AuditQuery): Promise<AuditPage> {
  if (isDemo) return demo.listAudit(query);
  return api.get<AuditPage>("/admin/audit-logs", { params: query });
}
