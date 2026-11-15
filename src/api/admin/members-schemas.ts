import { z } from "zod";

import { userRoleSchema } from "../auth/auth-schemas";
import { pageSchema } from "../page-schema";
import { paymentStatusSchema } from "../payments/payments-schemas";
import { ticketTierSchema } from "../showtimes/showtimes-schemas";
import { ticketStatusSchema } from "../tickets/tickets-schemas";
import { refundReasonSchema } from "./money-schemas";

/*
 * The member support replies the console reads, checked against koncavecinema-api's
 * openapi.json (dev, 258ce4f).
 */

/** One row of GET /admin/users */
export const adminMemberListItemSchema = z.object({
  id: z.string(),
  email: z.string(),
  publicScreenAlias: z.string().nullable(),
  role: userRoleSchema,
  isPhoneVerified: z.boolean(),
  lastSignInAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  passes: z.number(),
});
export type AdminMemberListItem = z.infer<typeof adminMemberListItemSchema>;
export const adminMemberPageSchema = pageSchema(adminMemberListItemSchema);

const memberPassSchema = z.object({
  id: z.string(),
  tier: ticketTierSchema,
  seatIdentifier: z.string(),
  status: ticketStatusSchema,
  purchasePrice: z.number(),
  currency: z.string(),
  movie: z.object({ title: z.string(), slug: z.string() }),
  startTime: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  payments: z.array(
    z.object({
      id: z.string(),
      reference: z.string(),
      status: paymentStatusSchema,
      amount: z.number(),
      currency: z.string(),
      refundReason: refundReasonSchema.nullable(),
      refundedAt: z.iso.datetime().nullable(),
      createdAt: z.iso.datetime(),
    }),
  ),
});
export type AdminMemberPass = z.infer<typeof memberPassSchema>;

/** GET /admin/users/:id. `legalFullName` only with reveal=legalName (super admin, audited). */
export const adminMemberSchema = z.object({
  id: z.string(),
  email: z.string(),
  publicScreenAlias: z.string().nullable(),
  role: userRoleSchema,
  isPhoneVerified: z.boolean(),
  termsVersion: z.string().nullable(),
  createdAt: z.iso.datetime(),
  lastSignInAt: z.iso.datetime().nullable(),
  legalFullName: z.string().nullable().optional(),
  passes: z.array(memberPassSchema),
  recentSignIns: z.array(
    z.object({
      action: z.enum(["USER_LOGIN_SUCCESS", "USER_LOGIN_FAILED"]),
      ipAddress: z.string().nullable(),
      userAgent: z.string().nullable(),
      timestamp: z.iso.datetime(),
    }),
  ),
});
export type AdminMember = z.infer<typeof adminMemberSchema>;

/** POST /admin/tickets/:id/cancel */
export const passCancellationSchema = z.object({
  /** What goes on the refunds queue; 0 for an unpaid hold */
  refundQueued: z.number(),
});
export type PassCancellation = z.infer<typeof passCancellationSchema>;
