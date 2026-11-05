import { ErrorCode } from "@/lib/api";
import { demoDelay, demoError } from "@/lib/demo";

import { currentActor, readStore, recordAudit, writeStore, type DemoMember } from "../demo-store";
import type { StaffMember, StaffRole } from "./api-types";

/*
 * The staff demo (NEXT_PUBLIC_DATA_SOURCE=fixtures): the API's staff endpoints on the admin demo
 * store. The signed-in demo account is listed too, so the refusals that protect it (demoting
 * yourself, the last super admin) can be seen.
 */

const toStaff = (member: DemoMember): StaffMember => ({
  id: member.id,
  email: member.email,
  role: member.role as StaffRole,
  status: member.invited ? "INVITED" : "ACTIVE",
  lastSignInAt: member.lastSignInAt,
  createdAt: member.createdAt,
});

const isStaffRole = (role: string) => role === "ADMIN" || role === "SUPER_ADMIN";

/** The signed-in demo account, as a member of staff */
function you(): StaffMember {
  const actor = currentActor();
  return {
    id: actor.id,
    email: actor.email,
    role: actor.role as StaffRole,
    status: "ACTIVE",
    lastSignInAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 400 * 24 * 60 * 60_000).toISOString(),
  };
}

export async function listStaff(): Promise<StaffMember[]> {
  await demoDelay(300);
  const staff = readStore()
    .members.filter((member) => isStaffRole(member.role))
    .map(toStaff);
  // As the API orders them: super admins first, then by when they joined
  return [you(), ...staff].sort(
    (a, b) =>
      (b.role === "SUPER_ADMIN" ? 1 : 0) - (a.role === "SUPER_ADMIN" ? 1 : 0) ||
      Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
}

export async function inviteStaff(email: string, role: StaffRole): Promise<StaffMember> {
  await demoDelay(600);
  const store = readStore();
  const normalized = email.trim().toLowerCase();
  const existing = store.members.find((member) => member.email === normalized);
  if (normalized === currentActor().email || existing?.role === role) {
    throw demoError(
      ErrorCode.STAFF_ACCOUNT_EXISTS,
      `This account is already ${role === "ADMIN" ? "staff" : "super admin"}.`,
      409,
    );
  }
  const member: DemoMember = existing ?? {
    id: crypto.randomUUID(),
    email: normalized,
    publicScreenAlias: null,
    role,
    isPhoneVerified: false,
    legalFullName: null,
    termsVersion: null,
    createdAt: new Date().toISOString(),
    lastSignInAt: null,
    invited: true,
  };
  member.role = role;
  if (!existing) store.members.push(member);
  recordAudit(store, "ADMIN_STAFF_INVITED", {
    staffUserId: member.id,
    role,
    existingAccount: Boolean(existing),
  });
  writeStore(store);
  return toStaff(member);
}

export async function changeStaffRole(
  id: string,
  role: StaffRole | "VIEWER",
): Promise<StaffMember> {
  await demoDelay(500);
  const store = readStore();
  const actor = currentActor();
  if (id === actor.id) {
    throw demoError(
      ErrorCode.LAST_SUPER_ADMIN,
      "You cannot remove your own super admin access. Ask another super admin.",
    );
  }
  const member = store.members.find((item) => item.id === id && isStaffRole(item.role));
  if (!member) throw demoError(ErrorCode.NOT_FOUND, "No member of staff with that id.", 404);
  if (member.role === role) return toStaff(member);
  if (member.role === "SUPER_ADMIN") {
    const superAdmins =
      store.members.filter((item) => item.role === "SUPER_ADMIN").length +
      (actor.role === "SUPER_ADMIN" ? 1 : 0);
    if (superAdmins <= 1) {
      throw demoError(
        ErrorCode.LAST_SUPER_ADMIN,
        "The platform must keep at least one super admin.",
        409,
      );
    }
  }
  const from = member.role;
  member.role = role;
  recordAudit(store, "ADMIN_STAFF_ROLE_CHANGED", { staffUserId: id, from, to: role });
  writeStore(store);
  return toStaff(member);
}
