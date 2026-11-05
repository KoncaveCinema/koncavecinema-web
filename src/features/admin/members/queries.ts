"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { useStaffSignedIn } from "../require-staff";
import { useRefreshAdmin } from "../use-refresh-admin";
import {
  cancelPass,
  getMember,
  listMembers,
  resendConfirmation,
  type MembersQuery,
} from "./service";

export const memberKeys = {
  list: (query: MembersQuery) => ["admin", "members", "list", query] as const,
  member: (id: string) => ["admin", "members", id] as const,
};

export function useMembers(query: MembersQuery) {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: memberKeys.list(query),
    queryFn: () => listMembers(query),
    enabled: staff,
    placeholderData: (previous) => previous,
  });
}

/** The member's account, never with the legal name: that is asked for separately, on purpose */
export function useMember(id: string) {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: memberKeys.member(id),
    queryFn: () => getMember(id),
    enabled: staff,
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
    mutationFn: (id: string) => getMember(id, true).then((member) => member.legalFullName ?? null),
  });
}

export function useResendConfirmation() {
  return useMutation({ mutationFn: resendConfirmation });
}

export function useCancelPass() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: ({ ticketId, reason }: { ticketId: string; reason: string }) =>
      cancelPass(ticketId, reason),
    onSuccess: refresh,
  });
}
