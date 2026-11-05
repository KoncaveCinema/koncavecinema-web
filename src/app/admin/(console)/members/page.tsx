import type { Metadata } from "next";

import { MembersList } from "@/features/admin/members/members-list";

export const metadata: Metadata = { title: "Members" };

export default function AdminMembersPage() {
  return <MembersList />;
}
