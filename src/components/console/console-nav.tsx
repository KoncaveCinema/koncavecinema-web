// Client components: import them from client modules only (those are the client boundary, so
// the function props here never cross from the server).

import { cn } from "cn";
import { ChevronRight, MoreHorizontal, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { isSuperAdmin } from "@/features/auth/roles";
import { useSession } from "@/features/auth/session";

/* The console navigation model, the phone tab bar and the top bar trail. The desktop sidebar,
   driven by the same sections, lives in sidebar.tsx. */

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Active only on this exact path (an area's home), not on everything below it */
  exact?: boolean;
  /** Shown to the super admin only */
  superAdminOnly?: boolean;
  /** A count beside the label, e.g. upcoming passes; hidden when zero */
  badge?: number;
}

export interface NavSection {
  /** Small heading above the group, e.g. "Super admin" */
  title?: string;
  items: NavItem[];
}

/** Whether a navigation item is the current page or one of its records. */
export function isActive(item: Pick<NavItem, "href" | "exact">, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** "Dashboard › My tickets": where you are, in the top bar. */
export function NavTrail({
  area,
  homeHref,
  sections,
  footer = [],
}: {
  area: string;
  homeHref: string;
  sections: NavSection[];
  footer?: NavItem[];
}) {
  const pathname = usePathname();
  // The most specific match wins (a record page matches its list too)
  const current = [...sections.flatMap((section) => section.items), ...footer]
    .filter((item) => isActive(item, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const atHome = !current || current.href === homeHref;
  const steps = [
    { href: homeHref, label: area },
    ...(!atHome && current ? [{ href: current.href, label: current.label }] : []),
  ];

  return (
    <nav aria-label="You are here" className="flex items-center gap-2 text-sm">
      {steps.map((step, index) => (
        <Fragment key={step.href}>
          {index > 0 && <ChevronRight aria-hidden="true" className="size-3.5 text-white/30" />}
          {/* The page you're on is a place, not a link; the steps before it lead back */}
          {pathname === step.href ? (
            <span aria-current="page" className="font-semibold">
              {step.label}
            </span>
          ) : (
            <Link
              href={step.href}
              className="text-white/50 transition-colors hover:text-foreground"
            >
              {step.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

/**
 * Phone navigation: the main destinations as a tab bar under the thumb. When an area has more
 * than fits, the rest open from "More" as a sheet, grouped as in the sidebar.
 */
export function BottomTabs({
  area,
  tabs,
  more,
}: {
  area: string;
  /** Four at most; "More" takes the fifth place when `more` is given */
  tabs: NavItem[];
  more?: NavSection[];
}) {
  const pathname = usePathname();
  const role = useSession((state) => state.user?.role);
  const [open, setOpen] = useState(false);

  const extra = (more ?? [])
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.superAdminOnly || isSuperAdmin(role)),
    }))
    .filter((section) => section.items.length > 0);
  const moreActive = extra.some((section) =>
    section.items.some((item) => isActive(item, pathname)),
  );

  const tabClass = (active: boolean) =>
    cn(
      "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1.5 text-[0.7rem] font-semibold transition-colors",
      active ? "text-foreground" : "text-white/50",
      // The current tab is marked by a short red bar along the top edge
      "before:absolute before:top-0 before:h-0.5 before:w-8 before:rounded-full",
      active && "before:bg-brand before:shadow-[0_0_12px_rgb(214_2_17/0.9)]",
    );

  return (
    <nav
      aria-label={area}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="flex">
        {tabs.map((item) => {
          const active = isActive(item, pathname);
          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={tabClass(active)}
              >
                <item.icon
                  aria-hidden="true"
                  className={cn("size-[1.35rem]", active && "text-[#ff5a63]")}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
        {extra.length > 0 && (
          <li className="flex flex-1">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button type="button" className={tabClass(moreActive)}>
                  <MoreHorizontal
                    aria-hidden="true"
                    className={cn("size-[1.35rem]", moreActive && "text-[#ff5a63]")}
                  />
                  More
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-2xl border-white/10 bg-surface-1 pb-[max(1rem,env(safe-area-inset-bottom))]"
              >
                <SheetHeader className="px-5 pt-5 pb-2">
                  <SheetTitle className="text-left text-sm">{area}</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 px-3 pb-2">
                  {extra.map((section, index) => (
                    <div key={section.title ?? index}>
                      {section.title && (
                        <p className="mb-1 px-2.5 text-[0.65rem] font-semibold tracking-[0.18em] text-white/35 uppercase">
                          {section.title}
                        </p>
                      )}
                      <ul>
                        {section.items.map((item) => {
                          const active = isActive(item, pathname);
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setOpen(false)}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                  "flex h-12 items-center gap-3 rounded-xl px-2.5 text-sm transition-colors",
                                  active
                                    ? "bg-white/8 font-medium"
                                    : "text-white/70 hover:bg-white/4",
                                )}
                              >
                                <item.icon
                                  aria-hidden="true"
                                  className={cn("size-4", active && "text-brand")}
                                />
                                {item.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </li>
        )}
      </ul>
    </nav>
  );
}
