import type { Metadata } from "next";

import { AuthFrame } from "@/components/brand/auth-frame";

export const metadata: Metadata = { robots: { index: false } };

/** Sign-in, registration, email confirmation and password pages, in the cinema frame */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AuthFrame>{children}</AuthFrame>;
}
