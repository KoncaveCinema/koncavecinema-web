import { api } from "@/api";

import type { StaffMember, StaffRole } from "./api-types";

/* Staff accounts (super admin only), one function per endpoint. */

export function listStaff(): Promise<StaffMember[]> {
  return api.get<StaffMember[]>("/admin/staff");
}

/** Emails a set-password link, valid 7 days. An existing member's account becomes staff. */
export function inviteStaff(email: string, role: StaffRole): Promise<StaffMember> {
  return api.post<StaffMember>("/admin/staff", { email, role });
}

/** A new role ends their sessions; VIEWER removes staff access */
export function changeStaffRole(id: string, role: StaffRole | "VIEWER"): Promise<StaffMember> {
  return role === "VIEWER"
    ? api.delete<StaffMember>(`/admin/staff/${id}`)
    : api.patch<StaffMember>(`/admin/staff/${id}`, { role });
}
