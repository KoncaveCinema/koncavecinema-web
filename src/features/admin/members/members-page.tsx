"use client";

import { cn } from "cn";
import { BadgeCheck, Users } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { DataTable, type Column } from "@/components/data-table/data-table";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { StatusBadge } from "@/components/console/status-badge";
import { UrlSearch, useSearchParam } from "@/components/console/url-controls";
import { usePagination } from "@/hooks/use-pagination";
import { fieldClass } from "@/features/auth/form-parts";
import { formatLagosDate, formatLagosDateTime } from "@/lib/format";

import type { AdminMemberListItem } from "./api-types";
import { useMembers } from "./queries";

const ROLES = ["VIEWER", "PRODUCER", "ADMIN", "SUPER_ADMIN"] as const;
const ROLE_LABEL = {
  VIEWER: "Members",
  PRODUCER: "Producers",
  ADMIN: "Staff",
  SUPER_ADMIN: "Super admins",
};

const COLUMNS: Column<AdminMemberListItem>[] = [
  {
    id: "member",
    header: "Member",
    cell: (member) => (
      <span className="min-w-0">
        <span className="block truncate">{member.email}</span>
        <span className="block truncate text-xs font-normal text-white/45">
          {member.publicScreenAlias ?? "No screen alias yet"}
        </span>
      </span>
    ),
  },
  {
    id: "role",
    header: "Role",
    cell: (member) => <StatusBadge kind="role" status={member.role} />,
  },
  {
    id: "verified",
    header: "Identity",
    cell: (member) =>
      member.isPhoneVerified ? (
        <span className="inline-flex items-center gap-1.5 text-lobby">
          <BadgeCheck aria-hidden="true" className="size-4" /> Verified
        </span>
      ) : (
        <span className="text-white/40">Not verified</span>
      ),
  },
  { id: "passes", header: "Passes", align: "end", cell: (member) => member.passes },
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
        <span className="text-white/35">Never</span>
      ),
  },
  {
    id: "joined",
    header: "Joined",
    hideOnMobile: true,
    cell: (member) => <span className="text-white/60">{formatLagosDate(member.createdAt)}</span>,
  },
];

/** /admin/members: find a member by email or screen alias, to help with a booking. */
export function MembersPage() {
  const [q, setQ] = useSearchParam();
  const [role, setRole] = useQueryState("role", parseAsStringLiteral(ROLES));
  const pagination = usePagination();
  const members = useMembers({
    q: q || undefined,
    role: role ?? undefined,
    ...pagination.query,
  });

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Members"
        description="Find a member to see their passes, payments and recent sign-ins."
      />
      <Panel flush>
        <div className="grid gap-3 border-b border-white/8 p-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <UrlSearch label="Search members" placeholder="Email or screen alias" />
          <label>
            <span className="sr-only">Role</span>
            <select
              value={role ?? ""}
              onChange={(event) => {
                void setRole((event.target.value || null) as (typeof ROLES)[number] | null);
                pagination.resetPage();
              }}
              className={cn(fieldClass, "h-10 appearance-none rounded-full bg-surface-1")}
            >
              <option value="">Everyone</option>
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <DataTable
          rows={members.data?.items}
          columns={COLUMNS}
          rowKey={(member) => member.id}
          rowHref={(member) => `/admin/members/${member.id}`}
          isLoading={members.isPending}
          error={members.error}
          onRetry={() => void members.refetch()}
          caption="Members"
          empty={{ icon: Users, title: "No members yet" }}
          filtered={
            q || role
              ? {
                  title: "Nobody matches",
                  hint: "Try part of the email address or the screen alias, or another role.",
                  onClear: () => {
                    void setQ(null);
                    void setRole(null);
                  },
                }
              : undefined
          }
          pagination={{ meta: members.data?.meta, state: pagination }}
        />
      </Panel>
    </>
  );
}
