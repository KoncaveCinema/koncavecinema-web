import type { Metadata } from "next";

import { AuditLog } from "@/features/admin/audit/audit-log";
import { RequireStaff } from "@/features/admin/require-staff";

export const metadata: Metadata = { title: "Audit log" };

export default function AdminAuditPage() {
  return (
    <RequireStaff superAdmin>
      <AuditLog />
    </RequireStaff>
  );
}
