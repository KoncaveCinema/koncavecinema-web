import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type FontWeight = 400 | 900;

/**
 * Archivo, the display face (widened as on the site), in regular and black for the share card.
 * Fetched once and cached, so the card is built statically; if the network is unavailable it
 * falls back to the built-in sans instead of failing.
 */
async function loadFonts(): Promise<{ weight: FontWeight; data: ArrayBuffer }[]> {
  "use cache";
  cacheLife("max");
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@112,400;112,900",
    ).then((response) => response.text());
    const faces = [
      ...css.matchAll(
        /font-weight: (\d+);[\s\S]*?src: url\((.+?)\) format\('(?:opentype|truetype)'\)/g,
      ),
    ];
    return await Promise.all(
      faces.map(async ([, weight, url]) => ({
        weight: Number(weight) as FontWeight,
        data: await fetch(url!).then((response) => response.arrayBuffer()),
      })),
    );
  } catch {
    return [];
  }
}

/** The default share card for every page: the brand on a darkened, spotlit stage. */
export default async function OpenGraphImage() {
  const fonts = await loadFonts();
  const iconBuffer = fs.readFileSync(path.join(process.cwd(), "public/koncave-icon.png"));
  const iconDataUri = `data:image/png;base64,${iconBuffer.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        color: "#fff",
        backgroundColor: "#000",
        backgroundImage:
          "radial-gradient(ellipse 55% 75% at 78% 40%, rgba(151,0,1,0.75), transparent 70%)," +
          "linear-gradient(105deg, transparent 52%, rgba(255,238,228,0.10) 60%, transparent 68%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <img src={iconDataUri} width={64} height={64} alt="" />
        <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: 2 }}>KONCAVE CINEMA</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 0.92,
            textTransform: "uppercase",
            maxWidth: 820,
          }}
        >
          {SITE_TAGLINE}
        </span>
        <span
          style={{ marginTop: 24, fontSize: 28, fontWeight: 400, color: "rgba(255,255,255,0.72)" }}
        >
          Scheduled premieres of African film · Public halls · Private suites
        </span>
      </div>

      <div style={{ display: "flex", height: 6, width: 160, background: "#d60211" }} />
    </div>,
    {
      ...size,
      fonts: fonts.length
        ? fonts.map(({ weight, data }) => ({
            name: "Archivo",
            data,
            weight,
            style: "normal" as const,
          }))
        : undefined,
    },
  );
}
