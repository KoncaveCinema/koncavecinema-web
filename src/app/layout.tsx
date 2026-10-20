import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { preconnect } from "react-dom";

import { AppProviders } from "@/components/providers/app-providers";
import { WebVitals } from "@/components/providers/web-vitals";
import { env } from "@/env";

import "./globals.css";

// Placeholder typefaces until the Figma brand fonts are confirmed (Phase F1).
// Self-hosted by next/font: no request to Google, no layout shift.
const fontSans = Geist({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
// Rarely used (codes, ids): not preloaded, so it never competes with the main font
const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "Koncave Cinema",
    template: "%s · Koncave Cinema",
  },
  description:
    "Premiere screenings of African films online: synchronized showtimes, communal halls, " +
    "private suites and snacks delivered before the opening credits.",
  applicationName: "Koncave Cinema",
  openGraph: { type: "website", siteName: "Koncave Cinema", locale: "en_NG" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Open the TLS connection to the API while the page is still loading, so the first API call
  // (the session refresh) skips the DNS + TCP + TLS round trips
  preconnect(new URL(env.NEXT_PUBLIC_API_URL).origin, { crossOrigin: "use-credentials" });

  return (
    <html lang="en" className={`${fontSans.variable} ${fontMono.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
        {/* Development only until Phase F9 reports production vitals to monitoring */}
        {env.NODE_ENV === "development" && <WebVitals />}
      </body>
    </html>
  );
}
