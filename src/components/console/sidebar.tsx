// Client component: import it from client modules only (they are the client boundary, so
// its function props never cross from the server).

import { cn } from "cn";
import { ChevronLeft, LogOut, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";

import { FilmGrain } from "@/components/brand/atmosphere";
import { LogoMark } from "@/components/brand/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSignOut } from "@/features/auth/account-menu";
import { isSuperAdmin } from "@/features/auth/roles";
import { useSession } from "@/features/auth/session";

import { isActive, type NavItem, type NavSection } from "./console-nav";

const COLLAPSED_KEY = "kc-console-sidebar-collapsed";

/* The collapse choice, kept on this device. Storage may be blocked (private windows), so the
   value also lives in memory for the visit. The server always renders the sidebar open. */
let collapsedInMemory: boolean | null = null;
const listeners = new Set<() => void>();

function readCollapsed(): boolean {
  if (collapsedInMemory !== null) return collapsedInMemory;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  collapsedInMemory = value;
  try {
    localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
  } catch {
    // Storage blocked: the choice lasts for this visit
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/*
 * How the collapse stays smooth: nothing re-lays out. Every row keeps the same padding in both
 * states, and the collapsed width (76px) is chosen so the icons and the logo already sit centred
 * in it. Only the panel's width animates; labels stay rendered and fade (quickly on the way
 * out, after the panel has opened on the way in) while the narrowing panel clips them.
 */
const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Text that fades with the collapse instead of popping in and out */
function Fade({
  shown,
  className,
  children,
}: {
  shown: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "whitespace-nowrap transition-opacity",
        shown ? "opacity-100 delay-150 duration-200" : "opacity-0 duration-100",
        className,
      )}
    >
      {children}
    </span>
  );
}

const ROW =
  "group/nav relative flex h-11 w-full items-center gap-3.5 rounded-xl px-3.5 text-[0.95rem] transition-[background-color,color,box-shadow] duration-200";

/** A row with a tooltip that only appears while the sidebar is collapsed */
function WithTip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );
}

/** One row: icon, label and count; the current page glows in the brand red. */
function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const badge = item.badge && item.badge > 0 ? item.badge : null;
  return (
    <WithTip label={item.label} collapsed={collapsed}>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          ROW,
          active
            ? "bg-[linear-gradient(90deg,rgb(214_2_17/0.24),rgb(214_2_17/0.07))] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(214_2_17/0.4),0_8px_28px_-10px_rgb(214_2_17/0.6)]"
            : "text-white/62 hover:bg-white/5 hover:text-white",
        )}
      >
        <item.icon
          aria-hidden="true"
          className={cn(
            "size-5 shrink-0 transition-colors",
            active ? "text-[#ff5a63]" : "text-white/50 group-hover/nav:text-white/80",
          )}
        />
        <Fade shown={!collapsed} className="min-w-0 flex-1 truncate">
          {item.label}
        </Fade>
        {badge !== null && (
          <>
            <Fade
              shown={!collapsed}
              className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[0.7rem] font-bold text-white tabular-nums"
            >
              {badge}
            </Fade>
            {/* Collapsed: the count becomes a dot on the icon */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-2.5 left-8 size-2 rounded-full bg-brand ring-2 ring-surface-1 transition-opacity",
                collapsed ? "opacity-100 delay-150 duration-200" : "opacity-0 duration-100",
              )}
            />
          </>
        )}
      </Link>
    </WithTip>
  );
}

/** A quiet row at the foot (back to the site, sign out) */
function FootRow({
  icon: Icon,
  label,
  collapsed,
  className,
  ...target
}: {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  className: string;
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never })) {
  const content = (
    <>
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      <Fade shown={!collapsed}>{label}</Fade>
    </>
  );
  return (
    <WithTip label={label} collapsed={collapsed}>
      {target.href ? (
        <Link href={target.href} className={cn(ROW, "text-sm", className)}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={target.onClick} className={cn(ROW, "text-sm", className)}>
          {content}
        </button>
      )}
    </WithTip>
  );
}

/**
 * The desktop sidebar. The brand card at the top carries the logo (a way back to the site); the
 * area's sections follow; settings and signing out sit at the foot. It collapses to icons for
 * more room (the toggle sits on its edge), and the choice is remembered on this device.
 */
export function SidebarNav({
  sections,
  footer = [],
  label = "Dashboard",
}: {
  sections: NavSection[];
  /** Links at the foot, above signing out, e.g. Settings */
  footer?: NavItem[];
  /** The navigation's name for assistive tech */
  label?: string;
}) {
  const pathname = usePathname();
  const role = useSession((state) => state.user?.role);
  const handleSignOut = useSignOut();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const allowed = (item: NavItem) => !item.superAdminOnly || isSuperAdmin(role);

  const visible = sections
    .map((section) => ({ ...section, items: section.items.filter(allowed) }))
    .filter((section) => section.items.length > 0);

  return (
    <div
      className={cn(
        "sticky top-0 h-svh transition-[width] duration-300",
        EASE,
        collapsed ? "w-19" : "w-68",
      )}
    >
      <div className="relative isolate flex h-full flex-col overflow-hidden border-r border-white/8 bg-surface-1">
        {/* A faint red wash from the top, and the site's film grain */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(90%_70%_at_20%_0%,rgb(214_2_17/0.14),transparent_70%)]"
        />
        <FilmGrain className="-z-10" />

        <div className="p-3.5">
          <Link
            href="/"
            aria-label="Koncave Cinema home"
            className="flex w-fit items-center gap-3 p-1.5"
          >
            <LogoMark className="size-9 shrink-0" />
            <Fade shown={!collapsed} className="font-display text-xs font-extrabold uppercase">
              Koncave Cinema
            </Fade>
          </Link>
        </div>

        <nav
          aria-label={label}
          className="flex-1 overflow-x-hidden overflow-y-auto px-3.5 pt-3 pb-4"
        >
          {visible.map((section, index) => (
            <div key={section.title ?? index} className={cn(index > 0 && "mt-7")}>
              {section.title && (
                <div className="relative mb-2.5 flex h-5 items-center px-3.5">
                  <Fade
                    shown={!collapsed}
                    className="text-[0.68rem] font-bold tracking-[0.22em] text-white/40 uppercase"
                  >
                    {section.title}
                  </Fade>
                  {/* Collapsed: the heading becomes a short rule */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute left-3.5 h-px w-5 bg-white/15 transition-opacity",
                      collapsed ? "opacity-100 delay-150 duration-200" : "opacity-0 duration-100",
                    )}
                  />
                </div>
              )}
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavLink item={item} active={isActive(item, pathname)} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/8 p-3.5">
          {footer.filter(allowed).map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item, pathname)}
              collapsed={collapsed}
            />
          ))}
          {/* <FootRow
            href="/"
            icon={ArrowLeft}
            label="Back to the site"
            collapsed={collapsed}
            className="text-white/50 hover:bg-white/5 hover:text-white"
          /> */}
          <FootRow
            onClick={() => void handleSignOut()}
            icon={LogOut}
            label="Sign out"
            collapsed={collapsed}
            className="font-medium text-[#ff5a63] hover:bg-brand/10"
          />
        </div>
      </div>

      {/* The toggle rides the sidebar's edge, so it never has to move between layouts */}
      <button
        type="button"
        onClick={() => writeCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"}
        aria-expanded={!collapsed}
        className="absolute top-6 -right-4 z-10 grid size-8 place-items-center rounded-full border border-white/15 bg-surface-2 text-white/70 shadow-[0_4px_14px_rgb(0_0_0/0.6)] transition-colors hover:border-brand/50 hover:bg-brand/20 hover:text-white"
      >
        <ChevronLeft
          aria-hidden="true"
          className={cn(
            "size-4.5 transition-transform duration-300",
            EASE,
            collapsed && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}
