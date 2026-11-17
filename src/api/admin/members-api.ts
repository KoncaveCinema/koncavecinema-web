import { useMutation, useQuery } from "@tanstack/react-query";

import type { UserRole } from "../auth/auth-schemas";
import { http } from "../http";
import {
  adminMemberPageSchema,
  adminMemberSchema,
  passCancellationSchema,
} from "./members-schemas";

/*
 * Member support calls (koncavecinema-api docs/phases: phase-05b, §2.7), each parsing its reply,
 * and their hooks.
 */

export interface MembersQuery {
  /** Email or screen alias */
  q?: string;
  role?: UserRole;
  page?: number;
  /** 20 when absent (the API's default), at most 100 */
  pageSize?: number;
}

const member = (id: string) => `/admin/users/${encodeURIComponent(id)}`;
const ticket = (id: string) => `/admin/tickets/${encodeURIComponent(id)}`;

/** GET /admin/users */
export async function listMembers(query: MembersQuery) {
  return adminMemberPageSchema.parse(await http({ url: "/admin/users", params: query }));
}

/** GET /admin/users/:id. With `revealLegalName` (super admin only) the API records the reveal. */
export async function getMember(id: string, revealLegalName = false) {
  return adminMemberSchema.parse(
    await http({
      url: member(id),
      params: revealLegalName ? { reveal: "legalName" } : undefined,
    }),
  );
}

/** POST /admin/tickets/:id/resend-confirmation */
export async function resendConfirmation(ticketId: string) {
  await http({ url: `${ticket(ticketId)}/resend-confirmation`, method: "POST" });
}

/** POST /admin/tickets/:id/cancel: a refund queued and the member emailed */
export async function cancelPass({ ticketId, reason }: { ticketId: string; reason: string }) {
  return passCancellationSchema.parse(
    await http({ url: `${ticket(ticketId)}/cancel`, method: "POST", data: { reason } }),
  );
}

/** POST /admin/users/:id/chat-shadow-ban: their chat reaches nobody else, and they aren't told */
export async function shadowBan(id: string) {
  await http({ url: `${member(id)}/chat-shadow-ban`, method: "POST" });
}

/** DELETE /admin/users/:id/chat-shadow-ban */
export async function liftShadowBan(id: string) {
  await http({ url: `${member(id)}/chat-shadow-ban`, method: "DELETE" });
}

/* Hooks. Each query waits for `enabled` (a member of staff signed in). */

export function useMembers(query: MembersQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["/admin/users", query],
    queryFn: () => listMembers(query),
    enabled,
    placeholderData: (previous) => previous,
  });
}

/** The member's account, never with the legal name: that is asked for separately, on purpose */
export function useMember(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [member(id)],
    queryFn: () => getMember(id),
    enabled,
    retry: false,
  });
}

/**
 * Reveals the legal name for this view only. A mutation, not a query: it is never cached or
 * refetched, so the name lives in the page's memory until it's left, and each reveal is one
 * deliberate, audited request.
 */
export function useRevealLegalName() {
  return useMutation({
    mutationKey: ["getMember"],
    mutationFn: (id: string) =>
      getMember(id, true).then((account) => account.legalFullName ?? null),
  });
}

export function useResendConfirmation() {
  return useMutation({ mutationKey: ["resendConfirmation"], mutationFn: resendConfirmation });
}

export function useShadowBan() {
  return useMutation({ mutationKey: ["shadowBan"], mutationFn: shadowBan });
}

export function useLiftShadowBan() {
  return useMutation({ mutationKey: ["liftShadowBan"], mutationFn: liftShadowBan });
}

export function useCancelPass() {
  return useMutation({ mutationKey: ["cancelPass"], mutationFn: cancelPass });
}
