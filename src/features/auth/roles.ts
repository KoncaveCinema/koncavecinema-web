import type { UserRole } from "@/api/auth/auth-schemas";

/*
 * The only place that compares role strings. The console and the account menu ask these
 * questions; the API's role checks are the real protection.
 */

/** Koncave staff: may open the admin console. */
export function isStaff(role: UserRole | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** The client: staff accounts, refund recording, legal names and the audit log. */
export function isSuperAdmin(role: UserRole | undefined): boolean {
  return role === "SUPER_ADMIN";
}
