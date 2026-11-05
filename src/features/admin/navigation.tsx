"use client";

import {
  BadgePercent,
  Clapperboard,
  CreditCard,
  LayoutGrid,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Undo2,
  Users,
} from "lucide-react";

import {
  BottomTabs,
  NavTrail,
  type NavItem,
  type NavSection,
} from "@/components/console/console-nav";
import { SidebarNav } from "@/components/console/sidebar";
import { isStaff } from "@/features/auth/roles";
import { useSession } from "@/features/auth/session";

import { useOverview } from "./overview/queries";

/* The admin console's navigation, for the shared console shell. */

const AREA = "Admin";
const HOME = "/admin";

const overview: NavItem = { href: HOME, label: "Overview", icon: LayoutGrid, exact: true };
const films: NavItem = { href: "/admin/films", label: "Films", icon: Clapperboard };
const showtimes: NavItem = { href: "/admin/showtimes", label: "Showtimes", icon: ReceiptText };
const sales: NavItem = { href: "/admin/sales", label: "Sales", icon: BadgePercent };
const refunds: NavItem = { href: "/admin/refunds", label: "Refunds", icon: Undo2 };
const payments: NavItem = { href: "/admin/payments", label: "Payments", icon: CreditCard };
const members: NavItem = { href: "/admin/members", label: "Members", icon: Users };
const staff: NavItem = {
  href: "/admin/staff",
  label: "Staff",
  icon: ShieldCheck,
  superAdminOnly: true,
};
const audit: NavItem = {
  href: "/admin/audit",
  label: "Audit log",
  icon: ScrollText,
  superAdminOnly: true,
};

/** Every section, with the refunds still waiting beside Refunds. A member account sees none. */
function useSections(): NavSection[] {
  const { status, user } = useSession();
  const waiting = useOverview().data?.refundsWaiting.count;
  if (status === "signed-in" && !isStaff(user?.role)) return [];
  return [
    { title: "Catalogue", items: [overview, films, showtimes] },
    { title: "Money", items: [sales, { ...refunds, badge: waiting }, payments] },
    { title: "Support", items: [members] },
    { title: "Super admin", items: [staff, audit] },
  ];
}

export function AdminSidebar() {
  return <SidebarNav label={AREA} sections={useSections()} />;
}

export function AdminTrail() {
  return <NavTrail area={AREA} homeHref={HOME} sections={useSections()} />;
}

export function AdminTabs() {
  const sections = useSections();
  if (sections.length === 0) return null;
  return (
    <BottomTabs
      area={AREA}
      tabs={[overview, films, showtimes, members]}
      more={[
        { title: "Money", items: [sales, refunds, payments] },
        { title: "Super admin", items: [staff, audit] },
      ]}
    />
  );
}
