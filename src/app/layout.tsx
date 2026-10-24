import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { preconnect } from "react-dom";

import { AppProviders } from "@/components/providers/app-providers";
import { WebVitals } from "@/components/providers/web-vitals";
import { env } from "@/env";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

import "./globals.css";

// Self-hosted by next/font: no request to Google, size-matched fallbacks, no layout shift.
// Reading text: Geist, a crisp neutral sans with tabular figures for prices and countdowns.
const fontSans = Geist({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
// Display: Archivo with its width axis, set wide and heavy to echo the KONCAVE wordmark
const fontDisplay = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});
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
    default: `${SITE_NAME}: ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "African films",
    "Nollywood premieres",
    "online cinema",
    "watch party",
    "movie premiere tickets",
    "Nigeria",
  ],
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_NG" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Open the TLS connection to the API while the page is still loading, so the first API call
  // (the session refresh) skips the DNS + TCP + TLS round trips
  preconnect(new URL(env.NEXT_PUBLIC_API_URL).origin, { crossOrigin: "use-credentials" });

  return (
    <html
      lang="en-NG"
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppProviders>{children}</AppProviders>
        {/* Development only until Phase F9 reports production vitals to monitoring */}
        {env.NODE_ENV === "development" && <WebVitals />}
      </body>
    </html>
  );
}
