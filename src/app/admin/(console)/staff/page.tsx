import type { Metadata } from "next";

import { RequireStaff } from "@/features/admin/require-staff";
import { StaffPage } from "@/features/admin/staff/staff-page";

export const metadata: Metadata = { title: "Staff" };

export default function Page() {
  return (
    <RequireStaff superAdmin>
      <StaffPage />
    </RequireStaff>
  );
}
