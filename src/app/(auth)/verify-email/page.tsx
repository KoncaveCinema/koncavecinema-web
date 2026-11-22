import type { Metadata } from "next";
import { Suspense } from "react";

import { VerifyEmailForm } from "@/features/auth/verify-email-form";

export const metadata: Metadata = {
  title: "Confirm your email",
  description: "Enter the code we emailed you to finish creating your Koncave Cinema account.",
};

export default function VerifyEmailPage() {
  return (
    // The form reads the address and ?next= from the link in the browser
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
