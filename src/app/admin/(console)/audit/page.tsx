import type { Metadata } from "next";

import { AuditPage } from "@/features/admin/audit/audit-page";
import { RequireStaff } from "@/features/admin/require-staff";

export const metadata: Metadata = { title: "Audit log" };

export default function Page() {
  return (
    <RequireStaff superAdmin>
      <AuditPage />
    </RequireStaff>
  );
}
