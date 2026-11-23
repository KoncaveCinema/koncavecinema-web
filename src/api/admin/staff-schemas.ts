import { z } from "zod";

import { userRoleSchema } from "../auth/auth-schemas";

/*
 * The staff and audit log replies the console reads, checked against koncavecinema-api's
 * openapi.json (dev, 258ce4f).
 */

export const staffRoleSchema = z.enum(["ADMIN", "SUPER_ADMIN"]);
export type StaffRole = z.infer<typeof staffRoleSchema>;

/** GET /admin/staff, and the answer to an invite or a role change */
export const staffMemberSchema = z.object({
  id: z.string(),
  email: z.string(),
  // VIEWER once staff access is removed
  role: z.union([staffRoleSchema, z.literal("VIEWER")]),
  /** Invited until their set-password link has been used */
  status: z.enum(["INVITED", "ACTIVE"]),
  /** Signs in with an authenticator code; admin routes refuse staff without it (dev 9bc5a9f) */
  twoFactorEnabled: z.boolean(),
  lastSignInAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});
export type StaffMember = z.infer<typeof staffMemberSchema>;

export const auditEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  timestamp: z.iso.datetime(),
  userId: z.string().nullable(),
  user: z.object({ email: z.string(), role: userRoleSchema }).nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

/** GET /admin/audit-logs: newest first; pass `nextCursor` back for the next page */
export const auditEntriesPageSchema = z.object({
  items: z.array(auditEntrySchema),
  nextCursor: z.string().nullable(),
});
export type AuditEntriesPage = z.infer<typeof auditEntriesPageSchema>;
