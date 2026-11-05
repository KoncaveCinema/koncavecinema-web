"use client";

import { cn } from "cn";
import { Ellipsis, Shield, ShieldCheck, UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { StatusBadge } from "@/components/console/status-badge";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fieldClass } from "@/features/auth/form-parts";
import { useSession } from "@/features/auth/session";
import { ErrorCode, type ApiError } from "@/lib/api";
import { formatLagosDate, formatLagosDateTime } from "@/lib/format";

import type { StaffMember, StaffRole } from "./api-types";
import { useChangeStaffRole, useInviteStaff, useStaff } from "./queries";

const ROLE_NAME: Record<StaffRole | "VIEWER", string> = {
  ADMIN: "Staff",
  SUPER_ADMIN: "Super admin",
  VIEWER: "Member",
};

function lastSuperAdmin(error: ApiError) {
  if (!error.is(ErrorCode.LAST_SUPER_ADMIN)) return undefined;
  return error.status === 400
    ? "You can't remove your own super admin access. Ask another super admin."
    : "The platform needs at least one super admin, so this one stays.";
}

type Change = { member: StaffMember; role: StaffRole | "VIEWER" };

/** /admin/staff: who runs Koncave, inviting more, and changing or removing their access. */
export function StaffPage() {
  const staff = useStaff();
  const invite = useInviteStaff();
  const change = useChangeStaffRole();
  const me = useSession((session) => session.user?.id);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("ADMIN");
  const [pending, setPending] = useState<Change | null>(null);

  const columns: Column<StaffMember>[] = [
    {
      id: "email",
      header: "Email",
      cell: (member) => (
        <span className="flex items-center gap-2">
          <span className="truncate">{member.email}</span>
          {member.id === me && (
            <span className="rounded-full bg-white/8 px-2 py-0.5 text-[0.65rem] font-semibold text-white/60">
              You
            </span>
          )}
        </span>
      ),
    },
    {
      id: "role",
      header: "Role",
      // A badge like every other status; changing it is a row action, behind a confirmation
      cell: (member) => <StatusBadge kind="role" status={member.role} />,
    },
    {
      id: "status",
      header: "Status",
      cell: (member) => <StatusBadge kind="staff" status={member.status} />,
    },
    {
      id: "signin",
      header: "Last sign-in",
      hideOnMobile: true,
      cell: (member) =>
        member.lastSignInAt ? (
          <span className="whitespace-nowrap text-white/60">
            {formatLagosDateTime(member.lastSignInAt)}
          </span>
        ) : (
          <span className="text-white/35">Not yet</span>
        ),
    },
    {
      id: "added",
      header: "Added",
      hideOnMobile: true,
      cell: (member) => (
        <span className="whitespace-nowrap text-white/60">{formatLagosDate(member.createdAt)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "end",
      // Nobody changes or removes their own access
      cell: (member) =>
        member.id === me ? null : (
          <StaffActions member={member} onChange={(next) => setPending({ member, role: next })} />
        ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Super admin"
        title="Staff"
        description="Everyone who can open the admin console. Nobody sets a password for someone else: invites arrive by email."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus data-icon="inline-start" />
            Invite staff
          </Button>
        }
      />
      <Panel flush>
        <DataTable
          rows={staff.data}
          columns={columns}
          rowKey={(member) => member.id}
          isLoading={staff.isPending}
          error={staff.error}
          onRetry={() => void staff.refetch()}
          caption="Staff accounts"
          empty={{ icon: ShieldCheck, title: "No staff yet" }}
        />
      </Panel>

      <ConfirmDialog
        open={inviting}
        onOpenChange={(open) => {
          setInviting(open);
          if (!open) setEmail("");
        }}
        title="Invite a member of staff"
        description="They'll get an email with a link to set their password, valid for 7 days."
        consequences={[
          "If the email already has a member account, that account gets staff access.",
        ]}
        confirmLabel="Send invite"
        pendingLabel="Sending…"
        canConfirm={/^\S+@\S+\.\S+$/.test(email.trim())}
        onConfirm={async () => {
          await invite.mutateAsync({ email, role });
          toast.success(`Invite sent to ${email.trim()}`);
          setEmail("");
        }}
        explainError={(error) =>
          error.is(ErrorCode.STAFF_ACCOUNT_EXISTS)
            ? `This account is already ${ROLE_NAME[role].toLowerCase()}.`
            : undefined
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@koncavecinema.com"
              className={cn(fieldClass, "mt-1.5 h-11")}
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium">Role</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["ADMIN", "SUPER_ADMIN"] as const).map((value) => (
                <label
                  key={value}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3 text-sm transition-colors",
                    role === value
                      ? "border-brand/50 bg-brand/10"
                      : "border-white/10 hover:border-white/25",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                    className="sr-only"
                  />
                  <span className="block font-semibold">{ROLE_NAME[value]}</span>
                  <span className="mt-0.5 block text-xs text-white/50">
                    {value === "ADMIN"
                      ? "Runs the catalogue, money and support"
                      : "Also staff, refunds and the audit log"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={
          pending?.role === "VIEWER"
            ? `Remove ${pending.member.email}'s staff access?`
            : `Make ${pending?.member.email} ${pending ? ROLE_NAME[pending.role].toLowerCase() : ""}?`
        }
        consequences={
          pending?.role === "VIEWER"
            ? ["They become a member account.", "They're signed out everywhere."]
            : ["Their sessions end, and they'll sign in again to pick up the new role."]
        }
        confirmLabel={pending?.role === "VIEWER" ? "Remove access" : "Change role"}
        pendingLabel="Saving…"
        tone={pending?.role === "VIEWER" ? "danger" : "default"}
        onConfirm={async () => {
          if (pending) await change.mutateAsync({ id: pending.member.id, role: pending.role });
          toast.success("Access updated");
        }}
        explainError={lastSuperAdmin}
      />
    </>
  );
}

/** A member of staff's access: the other role, or removing it, each behind its confirmation */
function StaffActions({
  member,
  onChange,
}: {
  member: StaffMember;
  onChange: (role: StaffRole | "VIEWER") => void;
}) {
  const other: StaffRole = member.role === "SUPER_ADMIN" ? "ADMIN" : "SUPER_ADMIN";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label={`Access for ${member.email}`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => onChange(other)}>
          {other === "SUPER_ADMIN" ? <ShieldCheck /> : <Shield />}
          Make {ROLE_NAME[other].toLowerCase()}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onChange("VIEWER")}>
          <UserMinus />
          Remove access
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
