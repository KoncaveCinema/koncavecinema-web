import type { Metadata } from "next";

// The staff console: never indexed (robots.ts disallows it too)
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Koncave Cinema" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
