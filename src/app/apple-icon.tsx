import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS: the mark on black (generated at build time). */
export default function AppleIcon() {
  const iconBuffer = fs.readFileSync(path.join(process.cwd(), "public/koncave-icon.png"));
  const iconDataUri = `data:image/png;base64,${iconBuffer.toString("base64")}`;

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
      <img src={iconDataUri} width={128} height={128} alt="" />
    </div>,
    size,
  );
}
