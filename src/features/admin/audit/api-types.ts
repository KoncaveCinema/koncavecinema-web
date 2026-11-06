import type { UserRole } from "@/api/auth/auth-schemas";

/** koncavecinema-api audit log shapes, field for field (src/admin/audit-log.service.ts). */

export interface AuditEntry {
  id: string;
  action: string;
  timestamp: string;
  userId: string | null;
  user: { email: string; role: UserRole } | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

/** GET /admin/audit-logs: newest first; pass `nextCursor` back for the next page */
export interface AuditEntriesPage {
  items: AuditEntry[];
  nextCursor: string | null;
}
