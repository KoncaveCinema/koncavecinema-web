"use client";

import { useQuery } from "@tanstack/react-query";

import { useSuperAdminSignedIn } from "../require-staff";
import { listAudit, type AuditQuery } from "./service";

export const auditKeys = {
  list: (query: AuditQuery) => ["admin", "audit", query] as const,
};

/**
 * One page of the audit log, on the API's cursor. The previous page stays on screen while the
 * next one loads, so paging never flashes empty.
 */
export function useAudit(query: AuditQuery) {
  const superAdmin = useSuperAdminSignedIn();
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: () => listAudit(query),
    enabled: superAdmin,
    placeholderData: (previous) => previous,
  });
}
