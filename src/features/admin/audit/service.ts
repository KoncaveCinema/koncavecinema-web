import { api } from "@/api";

import type { AuditEntriesPage } from "./api-types";

/* The audit log (super admin only). */

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

export function listAudit(query: AuditQuery): Promise<AuditEntriesPage> {
  return api.get<AuditEntriesPage>("/admin/audit-logs", { params: query });
}
