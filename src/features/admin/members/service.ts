import type { UserRole } from "@/api/auth/auth-schemas";
import { api, type Paginated } from "@/api";
import { isDemo } from "@/lib/demo";

import type { AdminMember, AdminMemberListItem, PassCancellation } from "./api-types";
import * as demo from "./demo";

/* Member support calls, one function per endpoint. With NEXT_PUBLIC_DATA_SOURCE=fixtures a demo
   plays the API's part. */

export interface MembersQuery {
  /** Email or screen alias */
  q?: string;
  role?: UserRole;
  page?: number;
  /** 20 when absent (the API's default), at most 100 */
  pageSize?: number;
}

export function listMembers(query: MembersQuery): Promise<Paginated<AdminMemberListItem>> {
  if (isDemo) return demo.listMembers(query);
  return api.getPage<AdminMemberListItem>("/admin/users", { params: query });
}

/** A member's account. With `revealLegalName` (super admin only) the API records the reveal. */
export function getMember(id: string, revealLegalName = false): Promise<AdminMember> {
  if (isDemo) return demo.getMember(id, revealLegalName);
  return api.get<AdminMember>(`/admin/users/${id}`, {
    params: revealLegalName ? { reveal: "legalName" } : undefined,
  });
}

export async function resendConfirmation(ticketId: string): Promise<void> {
  if (isDemo) {
    await demo.resendConfirmation(ticketId);
    return;
  }
  await api.post(`/admin/tickets/${ticketId}/resend-confirmation`);
}

export function cancelPass(ticketId: string, reason: string): Promise<PassCancellation> {
  if (isDemo) return demo.cancelPass(ticketId, reason);
  return api.post<PassCancellation>(`/admin/tickets/${ticketId}/cancel`, { reason });
}
