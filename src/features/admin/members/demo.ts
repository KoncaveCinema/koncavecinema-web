import type { UserRole } from "@/api/auth/auth-schemas";
import { isSuperAdmin } from "@/features/auth/roles";
import { ErrorCode, type Paginated } from "@/api";
import { demoDelay, demoError } from "@/lib/demo";
import { watchableUntil } from "@/lib/screening-window";

import { currentActor, isPaid, paginate, readStore, recordAudit, writeStore } from "../demo-store";
import type { AdminMember, AdminMemberListItem, PassCancellation } from "./api-types";

/* The member support demo (NEXT_PUBLIC_DATA_SOURCE=fixtures): the API's support endpoints on the
   admin demo store, with its rules for reveals, resends and cancellations. */

const OPEN = ["RESERVED", "CONFIRMED", "CHECKED_IN"];

export async function listMembers(query: {
  q?: string;
  role?: UserRole;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<AdminMemberListItem>> {
  await demoDelay(300);
  const store = readStore();
  const q = query.q?.trim().toLowerCase();
  const rows = store.members
    .filter((member) => !query.role || member.role === query.role)
    .filter(
      (member) =>
        !q ||
        member.email.includes(q) ||
        Boolean(member.publicScreenAlias?.toLowerCase().includes(q)),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((member) => ({
      id: member.id,
      email: member.email,
      publicScreenAlias: member.publicScreenAlias,
      role: member.role,
      isPhoneVerified: member.isPhoneVerified,
      lastSignInAt: member.lastSignInAt,
      createdAt: member.createdAt,
      passes: store.passes.filter((pass) => pass.userId === member.id).length,
    }));
  return paginate(rows, query.page, query.pageSize);
}

export async function getMember(id: string, revealLegalName: boolean): Promise<AdminMember> {
  await demoDelay(300);
  const store = readStore();
  const member = store.members.find((item) => item.id === id);
  if (!member) throw demoError(ErrorCode.NOT_FOUND, `Member '${id}' not found.`, 404);
  if (revealLegalName) {
    if (!isSuperAdmin(currentActor().role)) {
      throw demoError(
        ErrorCode.INSUFFICIENT_ROLE,
        "Only the super admin can see a member's legal name.",
        403,
      );
    }
    recordAudit(store, "ADMIN_LEGAL_NAME_REVEALED", { memberId: id });
    writeStore(store);
  }

  const passes = store.passes
    .filter((pass) => pass.userId === id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 50)
    .map((pass) => {
      const showtime = store.showtimes.find((item) => item.id === pass.showtimeId)!;
      const film = store.films.find((item) => item.id === showtime.movieId)!;
      return {
        id: pass.id,
        tier: pass.tier,
        seatIdentifier: pass.seatIdentifier,
        status: pass.status,
        purchasePrice: pass.purchasePrice,
        currency: pass.currency,
        movie: { title: film.title, slug: film.slug },
        startTime: showtime.startTime,
        createdAt: pass.createdAt,
        payments: store.payments
          .filter((payment) => payment.ticketId === pass.id)
          .map((payment) => ({
            id: payment.id,
            reference: payment.reference,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            refundReason: payment.refundRequiredReason,
            refundedAt: payment.refundedAt,
            createdAt: payment.createdAt,
          })),
      };
    });

  return {
    id: member.id,
    email: member.email,
    publicScreenAlias: member.publicScreenAlias,
    role: member.role,
    isPhoneVerified: member.isPhoneVerified,
    termsVersion: member.termsVersion,
    createdAt: member.createdAt,
    lastSignInAt: member.lastSignInAt,
    ...(revealLegalName && { legalFullName: member.legalFullName }),
    passes,
    recentSignIns: store.audit
      .filter(
        (entry) =>
          entry.userId === id &&
          (entry.action === "USER_LOGIN_SUCCESS" || entry.action === "USER_LOGIN_FAILED"),
      )
      .slice(0, 10)
      .map((entry) => ({
        action: entry.action as "USER_LOGIN_SUCCESS" | "USER_LOGIN_FAILED",
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        timestamp: entry.timestamp,
      })),
  };
}

export async function resendConfirmation(ticketId: string): Promise<{ sent: true }> {
  await demoDelay();
  const store = readStore();
  const pass = store.passes.find((item) => item.id === ticketId);
  if (!pass) throw demoError(ErrorCode.NOT_FOUND, `Ticket '${ticketId}' not found.`, 404);
  if (!isPaid(pass)) {
    throw demoError(ErrorCode.PASS_NOT_CONFIRMED, "Only confirmed passes have a booking email.");
  }
  recordAudit(store, "ADMIN_CONFIRMATION_RESENT", { ticketId });
  writeStore(store);
  return { sent: true };
}

export async function cancelPass(ticketId: string, reason: string): Promise<PassCancellation> {
  await demoDelay(600);
  const store = readStore();
  const pass = store.passes.find((item) => item.id === ticketId);
  if (!pass) throw demoError(ErrorCode.NOT_FOUND, `Ticket '${ticketId}' not found.`, 404);
  const showtime = store.showtimes.find((item) => item.id === pass.showtimeId)!;
  if (
    !OPEN.includes(pass.status) ||
    watchableUntil({ endTime: showtime.endTime, tier: pass.tier }) <= Date.now()
  ) {
    throw demoError(
      ErrorCode.TICKET_NOT_CANCELLABLE,
      "Only an active pass for a screening that has not ended can be cancelled.",
      409,
    );
  }
  if (pass.roomInviteCode) {
    const seatedGuests = store.passes.filter(
      (item) => item.hostPassId === pass.id && isPaid(item),
    ).length;
    if (seatedGuests > 0) {
      throw demoError(
        ErrorCode.TICKET_NOT_CANCELLABLE,
        "Guests are seated in this suite. Cancel their passes first, or cancel the showtime.",
        409,
        { seatedGuests },
      );
    }
  }
  pass.status = "CANCELLED";
  pass.cancellation = {
    reason: "CANCELLED_BY_SUPPORT",
    message: reason,
    cancelledAt: new Date().toISOString(),
  };
  const payment = store.payments.find(
    (item) => item.ticketId === pass.id && item.status === "SUCCESS" && !item.refundRequiredAt,
  );
  if (payment) {
    payment.refundRequiredAt = new Date().toISOString();
    payment.refundRequiredReason = "CANCELLED_BY_SUPPORT";
  }
  recordAudit(store, "ADMIN_PASS_CANCELLED", { ticketId, reason });
  writeStore(store);
  return { id: ticketId, status: "CANCELLED", refundQueued: payment?.amount ?? 0 };
}
