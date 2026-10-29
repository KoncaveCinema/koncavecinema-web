"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { lazy, Suspense, type ReactNode } from "react";

import { SessionRestorer } from "@/features/auth/session";
import { getQueryClient } from "@/lib/query-client";

// Fetched after hydration so the animation engine never delays the first paint or interaction
const loadMotionFeatures = () => import("@/lib/motion/features").then((mod) => mod.default);

// Toasts only ever follow a user action, so the toaster loads after hydration, off the
// critical path. `toast()` itself stays a tiny import wherever it is called.
const Toaster = dynamic(() => import("@/components/ui/sonner").then((mod) => mod.Toaster), {
  ssr: false,
});

// Development only: the import is removed from production bundles entirely
const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? lazy(() =>
        import("@tanstack/react-query-devtools").then((mod) => ({
          default: mod.ReactQueryDevtools,
        })),
      )
    : null;

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        {/* `strict` makes the full `motion.*` components throw: use `m.*` from @/components/motion */}
        <LazyMotion features={loadMotionFeatures} strict>
          <MotionConfig reducedMotion="user">
            <SessionRestorer />
            {children}
            <Toaster position="top-center" richColors closeButton />
          </MotionConfig>
        </LazyMotion>
      </NuqsAdapter>
      {ReactQueryDevtools && (
        <Suspense>
          <ReactQueryDevtools buttonPosition="bottom-right" />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
