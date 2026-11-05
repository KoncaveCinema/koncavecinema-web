/** koncavecinema-api staff shapes, field for field (src/admin/staff.service.ts). */

export type StaffRole = "ADMIN" | "SUPER_ADMIN";

/** GET /admin/staff, and the answer to an invite or a role change */
export interface StaffMember {
  id: string;
  email: string;
  role: StaffRole | "VIEWER";
  /** Invited until their set-password link has been used */
  status: "INVITED" | "ACTIVE";
  lastSignInAt: string | null;
  createdAt: string;
}
