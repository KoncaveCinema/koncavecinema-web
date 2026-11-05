import type { Metadata } from "next";

import { RequireStaff } from "@/features/admin/require-staff";
import { StaffList } from "@/features/admin/staff/staff-list";

export const metadata: Metadata = { title: "Staff" };

export default function AdminStaffPage() {
  return (
    <RequireStaff superAdmin>
      <StaffList />
    </RequireStaff>
  );
}
