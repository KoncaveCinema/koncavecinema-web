import { api } from "@/lib/api";
import { isDemo } from "@/lib/demo";

import type { StaffMember, StaffRole } from "./api-types";
import * as demo from "./demo";

/* Staff accounts (super admin only), one function per endpoint. With
   NEXT_PUBLIC_DATA_SOURCE=fixtures a demo plays the API's part. */

export function listStaff(): Promise<StaffMember[]> {
  if (isDemo) return demo.listStaff();
  return api.get<StaffMember[]>("/admin/staff");
}

/** Emails a set-password link, valid 7 days. An existing member's account becomes staff. */
export function inviteStaff(email: string, role: StaffRole): Promise<StaffMember> {
  if (isDemo) return demo.inviteStaff(email, role);
  return api.post<StaffMember>("/admin/staff", { email, role });
}

/** A new role ends their sessions; VIEWER removes staff access */
export function changeStaffRole(id: string, role: StaffRole | "VIEWER"): Promise<StaffMember> {
  if (isDemo) return demo.changeStaffRole(id, role);
  return role === "VIEWER"
    ? api.delete<StaffMember>(`/admin/staff/${id}`)
    : api.patch<StaffMember>(`/admin/staff/${id}`, { role });
}
