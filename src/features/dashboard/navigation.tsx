"use client";

import { Clapperboard, Home, Settings, Ticket } from "lucide-react";

import { BottomTabs } from "@/components/console/console-nav";
import type { NavItem, NavSection } from "@/components/console/console-nav";
import { NavTrail } from "@/components/console/console-nav";
import { SidebarNav } from "@/components/console/console-nav";

import { useMyTickets } from "./queries";

/* The member dashboard's navigation, for the shared console shell. */

const AREA = "Dashboard";
const HOME = "/dashboard";

const home: NavItem = { href: HOME, label: "Home", icon: Home, exact: true };
const tickets: NavItem = { href: "/dashboard/tickets", label: "My tickets", icon: Ticket };
const films: NavItem = { href: "/movies", label: "Browse films", icon: Clapperboard };
const settings: NavItem = { href: "/dashboard/settings", label: "Settings", icon: Settings };

/** The main section, with the count of passes and holds still to come on My tickets */
function useSections(): NavSection[] {
  const upcoming = useMyTickets("upcoming");
  return [
    { title: "Dashboard", items: [home, { ...tickets, badge: upcoming.data?.meta.total }] },
    { title: "Koncave Cinema", items: [films] },
  ];
}

export function DashboardSidebar() {
  return <SidebarNav sections={useSections()} footer={[settings]} />;
}

export function DashboardTrail() {
  return <NavTrail area={AREA} homeHref={HOME} sections={useSections()} footer={[settings]} />;
}

export function DashboardTabs() {
  return <BottomTabs area={AREA} tabs={[home, tickets, { ...films, label: "Films" }, settings]} />;
}
