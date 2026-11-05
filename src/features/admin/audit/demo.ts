import { ErrorCode } from "@/lib/api";
import { demoDelay, demoError } from "@/lib/demo";

import { currentActor, readStore } from "../demo-store";
import type { AuditEntriesPage } from "./api-types";

/* The audit log demo (NEXT_PUBLIC_DATA_SOURCE=fixtures): the admin demo store's entries, newest
   first, with the API's cursor paging (the cursor names the last entry shown). */

export async function listAudit(query: {
  cursor?: string;
  limit?: number;
  userId?: string;
  action?: string;
}): Promise<AuditEntriesPage> {
  await demoDelay(300);
  const store = readStore();
  const actor = currentActor();
  const limit = query.limit ?? 50;
  const rows = store.audit
    .filter((entry) => !query.userId || entry.userId === query.userId)
    .filter((entry) => !query.action || entry.action.startsWith(query.action));

  let start = 0;
  if (query.cursor) {
    const lastId = atob(query.cursor);
    const index = rows.findIndex((entry) => entry.id === lastId);
    if (index < 0) throw demoError(ErrorCode.VALIDATION_FAILED, "The cursor is not valid.");
    start = index + 1;
  }
  const page = rows.slice(start, start + limit);
  const more = rows.length > start + limit;

  return {
    items: page.map((entry) => {
      const member =
        entry.userId === actor.id
          ? { email: actor.email, role: actor.role }
          : store.members.find((item) => item.id === entry.userId);
      return {
        ...entry,
        user: member ? { email: member.email, role: member.role } : null,
      };
    }),
    nextCursor: more ? btoa(page[page.length - 1]!.id) : null,
  };
}
