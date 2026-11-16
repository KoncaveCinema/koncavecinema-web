"use client";

import { RouteError } from "@/components/states/route-error";

import "./globals.css";

/**
 * The root layout itself broke: this replaces the whole document, so it brings its own html,
 * body and styles. Rare; every area below has its own error screen that keeps its frame.
 */
export default function GlobalError(props: { error: unknown; retry: () => void }) {
  return (
    <html lang="en-NG" className="dark h-full antialiased">
      <body className="grid min-h-full place-items-center bg-black px-5">
        <title>Something went wrong · Koncave Cinema</title>
        <main id="main" className="w-full max-w-lg">
          <RouteError {...props} />
        </main>
      </body>
    </html>
  );
}
