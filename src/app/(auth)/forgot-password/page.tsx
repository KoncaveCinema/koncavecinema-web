import type { Metadata } from "next";
import { Suspense } from "react";

import { ForgotPasswordForm } from "@/features/auth/auth-forms";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Get a link to choose a new password.",
};

export default function ForgotPasswordPage() {
  return (
    // The form reads the link (?next= or ?token=) in the browser
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
