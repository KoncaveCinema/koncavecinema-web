import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInForm } from "@/features/auth/auth-forms";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to book premieres on Koncave Cinema.",
};

export default function SignInPage() {
  return (
    // The form reads the link (?next= or ?token=) in the browser
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
