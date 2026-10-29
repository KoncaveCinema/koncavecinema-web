import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterForm } from "@/features/auth/auth-forms";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Koncave Cinema account.",
};

export default function RegisterPage() {
  return (
    // The form reads the link (?next= or ?token=) in the browser
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
