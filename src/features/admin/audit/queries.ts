"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useSuperAdminSignedIn } from "../require-staff";
import { listAudit, type AuditQuery } from "./service";

export const auditKeys = {
  list: (query: AuditQuery) => ["admin", "audit", query] as const,
};

/** The audit log, page after page on the API's cursor. A new filter starts from the newest. */
export function useAudit(query: AuditQuery) {
  const superAdmin = useSuperAdminSignedIn();
  return useInfiniteQuery({
    queryKey: auditKeys.list(query),
    queryFn: ({ pageParam }) => listAudit({ ...query, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: superAdmin,
  });
}
