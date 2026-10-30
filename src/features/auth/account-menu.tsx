"use client";

import { cn } from "cn";
import { ChevronDown, LayoutDashboard, LogOut, Settings, ShieldCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { UserProfile, UserRole } from "./api-types";
import { isStaff } from "./roles";
import { signOut } from "./service";
import { useSession } from "./session";

/*
 * The account menu, everywhere it appears: the site header, the console's top bar, and the
 * links the phone drawer and sidebar reuse.
 */

const ROLE_LABEL: Record<UserRole, string> = {
  VIEWER: "Member",
  HOST: "Member",
  PRODUCER: "Producer",
  ADMIN: "Staff",
  SUPER_ADMIN: "Super admin",
};

/** The signed-in area's main doors; staff also get the admin console. */
export function accountLinks(role: UserRole) {
  return [
    { href: "/dashboard", label: "Dashboard", hint: "Your next screening", icon: LayoutDashboard },
    {
      href: "/dashboard/tickets",
      label: "My tickets",
      hint: "Passes, holds and history",
      icon: Ticket,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      hint: "Alias, password, account",
      icon: Settings,
    },
    ...(isStaff(role)
      ? [{ href: "/admin", label: "Admin", hint: "Run Koncave Cinema", icon: ShieldCheck }]
      : []),
  ];
}

/** Signs out (a failed call still clears this device) and goes home. */
export function useSignOut() {
  const router = useRouter();
  const setUser = useSession((state) => state.setUser);
  return async () => {
    await signOut().catch(() => undefined);
    setUser(null);
    router.push("/");
  };
}

/** The member's initial in the brand circle. */
function Avatar({ user, className }: { user: UserProfile; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#ff3b47,var(--color-brand)_55%,var(--color-crimson))] font-display font-extrabold text-white uppercase shadow-[0_0_0_1px_rgb(255_255_255/0.12),0_6px_18px_-6px_rgb(214_2_17/0.8)]",
        className,
      )}
    >
      {(user.publicScreenAlias ?? user.email).charAt(0)}
    </span>
  );
}

const displayName = (user: UserProfile) => user.publicScreenAlias ?? user.email.split("@")[0];

/**
 * Who is signed in and the way into their area. `header` is the site header's pill (with Sign
 * in for visitors); `console` is the top bar's compact trigger. The open menu is the same in
 * both: who you are, the doors with a line on each, and signing out at the foot.
 */
export function AccountMenu({ variant }: { variant: "header" | "console" }) {
  const { status, user } = useSession();
  const handleSignOut = useSignOut();

  if (!user) {
    if (variant === "header" && status === "signed-out") {
      return (
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/sign-in" prefetch={false}>
            Sign in
          </Link>
        </Button>
      );
    }
    // Holds its size while the session is checked, so the bar never shifts
    return (
      <span
        aria-hidden="true"
        className={cn(
          "rounded-full bg-white/5",
          variant === "header" ? "hidden h-10 w-36 sm:block" : "size-10 sm:w-36",
        )}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          "flex h-10 items-center gap-2.5 rounded-full border border-white/10 text-sm font-medium transition-colors outline-none hover:border-white/20 hover:bg-white/8 focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-white/25 aria-expanded:bg-white/8",
          variant === "header" ? "hidden glass pr-4 pl-1.5 sm:flex" : "bg-white/4 p-1 sm:pr-3.5",
        )}
      >
        <Avatar
          user={user}
          className={variant === "header" ? "size-7 text-xs" : "size-8 text-xs"}
        />
        <span className={cn("max-w-36 truncate", variant === "console" && "hidden sm:block")}>
          {variant === "header" ? "My account" : displayName(user)}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-3.5 opacity-60", variant === "console" && "hidden sm:block")}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-76 rounded-2xl border border-white/10 bg-[rgb(14_14_16/0.92)] p-2 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.8)] backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3 rounded-xl bg-white/3 p-3 ring-1 ring-white/6">
          <Avatar user={user} className="size-11 text-base" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold">{displayName(user)}</p>
            <p className="truncate text-xs text-white/50">{user.email}</p>
          </div>
          <span className="shrink-0 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-[#ff6a72] uppercase">
            {ROLE_LABEL[user.role]}
          </span>
        </div>

        <DropdownMenuGroup className="mt-2 space-y-0.5">
          {accountLinks(user.role).map((item) => (
            <DropdownMenuItem
              key={item.href}
              asChild
              className="group/item gap-3 rounded-xl px-2.5 py-2 focus:bg-white/6"
            >
              <Link href={item.href}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/5 ring-1 ring-white/8 transition-colors group-focus/item:bg-brand/15 group-focus/item:ring-brand/30">
                  <item.icon className="size-4 text-white/70 group-focus/item:text-[#ff6a72]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block truncate text-xs text-white/45">{item.hint}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-1 my-2 bg-white/8" />

        <DropdownMenuItem
          variant="destructive"
          onSelect={() => void handleSignOut()}
          className="gap-3 rounded-xl px-2.5 py-2 text-[#ff6a72] focus:bg-brand/10 focus:text-[#ff6a72] dark:focus:bg-brand/10"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 ring-1 ring-brand/20">
            <LogOut className="size-4 text-[#ff6a72]" />
          </span>
          <span className="text-sm font-medium">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
