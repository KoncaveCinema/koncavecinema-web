"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { useSuperAdminSignedIn } from "../require-staff";
import { useRefreshAdmin } from "../use-refresh-admin";
import type { StaffRole } from "./api-types";
import { changeStaffRole, inviteStaff, listStaff } from "./service";

export const staffKeys = { all: ["admin", "staff"] as const };

export function useStaff() {
  const superAdmin = useSuperAdminSignedIn();
  return useQuery({ queryKey: staffKeys.all, queryFn: listStaff, enabled: superAdmin });
}

export function useInviteStaff() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: StaffRole }) => inviteStaff(email, role),
    onSuccess: refresh,
  });
}

export function useChangeStaffRole() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: StaffRole | "VIEWER" }) =>
      changeStaffRole(id, role),
    onSuccess: refresh,
  });
}
