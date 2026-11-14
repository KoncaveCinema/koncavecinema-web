import { describe, expect, it } from "vitest";

import { croppedInFrame, formatBytes, formatLength, imageTooSmall } from "./upload-dialogs";

describe("upload dialogs", () => {
  it("refuse an image smaller than its frame needs, in its own pixels", () => {
    const landscape = { width: 1920, height: 1080 };
    expect(imageTooSmall({ width: 1920, height: 1080 }, landscape)).toBeNull();
    expect(imageTooSmall({ width: 3840, height: 2160 }, landscape)).toBeNull();
    expect(imageTooSmall({ width: 1280, height: 720 }, landscape)).toBe(
      "This image is 1280 × 720. It needs to be at least 1920 × 1080.",
    );
    // Wide enough but too short still falls short
    expect(imageTooSmall({ width: 2400, height: 1000 }, landscape)).not.toBeNull();
  });

  it("warn when an image's shape is more than 6% off its frame", () => {
    expect(croppedInFrame({ width: 1920, height: 1080 }, 16 / 9)).toBe(false);
    expect(croppedInFrame({ width: 1000, height: 1500 }, 2 / 3)).toBe(false);
    expect(croppedInFrame({ width: 1500, height: 1500 }, 2 / 3)).toBe(true);
    expect(croppedInFrame({ width: 2000, height: 1000 }, 16 / 9)).toBe(true);
  });

  it("describe a file's weight and a video's length", () => {
    expect(formatBytes(820 * 1024)).toBe("820 KB");
    expect(formatBytes(1.4 * 1024 ** 2)).toBe("1.4 MB");
    expect(formatBytes(3.25 * 1024 ** 3)).toBe("3.3 GB");
    expect(formatLength(125)).toBe("2m 05s");
    expect(formatLength(118 * 60)).toBe("1h 58m");
  });
});
