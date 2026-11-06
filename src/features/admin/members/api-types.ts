import type { UserRole } from "@/api/auth/auth-schemas";
import type { PaymentStatus, TicketStatus } from "@/features/booking/api-types";
import type { TicketTier } from "@/types/domain";

import type { RefundReason } from "../money/api-types";

/** koncavecinema-api member support shapes, field for field (src/admin/support.service.ts). */

/** One row of GET /admin/users */
export interface AdminMemberListItem {
  id: string;
  email: string;
  publicScreenAlias: string | null;
  role: UserRole;
  isPhoneVerified: boolean;
  lastSignInAt: string | null;
  createdAt: string;
  passes: number;
}

export interface AdminMemberPass {
  id: string;
  tier: TicketTier;
  seatIdentifier: string;
  status: TicketStatus;
  purchasePrice: number;
  currency: string;
  movie: { title: string; slug: string };
  startTime: string;
  createdAt: string;
  payments: {
    id: string;
    reference: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    refundReason: RefundReason | null;
    refundedAt: string | null;
    createdAt: string;
  }[];
}

/** GET /admin/users/:id. `legalFullName` only with reveal=legalName (super admin, audited). */
export interface AdminMember {
  id: string;
  email: string;
  publicScreenAlias: string | null;
  role: UserRole;
  isPhoneVerified: boolean;
  termsVersion: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  legalFullName?: string | null;
  passes: AdminMemberPass[];
  recentSignIns: {
    action: "USER_LOGIN_SUCCESS" | "USER_LOGIN_FAILED";
    ipAddress: string | null;
    userAgent: string | null;
    timestamp: string;
  }[];
}

/** POST /admin/tickets/:id/cancel */
export interface PassCancellation {
  id: string;
  status: "CANCELLED";
  /** What goes on the refunds queue; 0 for an unpaid hold */
  refundQueued: number;
}
