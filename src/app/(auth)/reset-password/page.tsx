import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/auth-forms";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your account.",
};

export default function ResetPasswordPage() {
  return (
    // The form reads the link (?next= or ?token=) in the browser
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
