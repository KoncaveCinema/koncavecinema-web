import { ImageResponse } from "next/og";

import { MARK_DATA_URI } from "@/lib/seo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS: the mark on black (generated at build time). */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 40%, #2a0003, #000 70%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG, not the DOM */}
      <img src={MARK_DATA_URI} width={112} height={114} alt="" />
    </div>,
    size,
  );
}
