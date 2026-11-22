import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { http } from "../http";
import { auditEntriesPageSchema, staffMemberSchema, type StaffRole } from "./staff-schemas";

/*
 * Staff accounts and the audit log (koncavecinema-api docs/phases: phase-05b, §2.3 and §2.8),
 * super admin only, each parsing its reply, and their hooks.
 */

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

const staff = (id: string) => `/admin/staff/${encodeURIComponent(id)}`;

/** GET /admin/staff */
export async function listStaff() {
  return z.array(staffMemberSchema).parse(await http({ url: "/admin/staff" }));
}

/** POST /admin/staff: emails a set-password link, valid 7 days */
export async function inviteStaff({ email, role }: { email: string; role: StaffRole }) {
  return staffMemberSchema.parse(
    await http({ url: "/admin/staff", method: "POST", data: { email, role } }),
  );
}

/** PATCH /admin/staff/:id: a new role ends their sessions */
export async function changeStaffRole({ id, role }: { id: string; role: StaffRole }) {
  return staffMemberSchema.parse(await http({ url: staff(id), method: "PATCH", data: { role } }));
}

/** DELETE /admin/staff/:id: back to a member account */
export async function removeStaff(id: string) {
  return staffMemberSchema.parse(await http({ url: staff(id), method: "DELETE" }));
}

/**
 * POST /admin/staff/:id/two-factor/reset: for a lost phone. Their sessions end, and they set it
 * up again at their next sign-in. The super admin can't reset their own
 */
export async function resetStaffTwoFactor(id: string) {
  return staffMemberSchema.parse(
    await http({ url: `${staff(id)}/two-factor/reset`, method: "POST", data: {} }),
  );
}

/** GET /admin/audit-logs: newest first, on the API's cursor */
export async function listAudit(query: AuditQuery) {
  return auditEntriesPageSchema.parse(await http({ url: "/admin/audit-logs", params: query }));
}

/* Hooks. Each query waits for `enabled` (the super admin signed in). */

export function useStaff(enabled: boolean) {
  return useQuery({ queryKey: ["/admin/staff"], queryFn: listStaff, enabled });
}

/**
 * One page of the audit log. The previous page stays on screen while the next one loads, so
 * paging never flashes empty.
 */
export function useAudit(query: AuditQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["/admin/audit-logs", query],
    queryFn: () => listAudit(query),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useInviteStaff() {
  return useMutation({ mutationKey: ["inviteStaff"], mutationFn: inviteStaff });
}

export function useChangeStaffRole() {
  return useMutation({ mutationKey: ["changeStaffRole"], mutationFn: changeStaffRole });
}

export function useResetStaffTwoFactor() {
  return useMutation({ mutationKey: ["resetStaffTwoFactor"], mutationFn: resetStaffTwoFactor });
}

export function useRemoveStaff() {
  return useMutation({ mutationKey: ["removeStaff"], mutationFn: removeStaff });
}
