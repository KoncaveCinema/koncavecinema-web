import { describe, expect, it } from "vitest";

import { isAllowedImage } from "./image-hosts";

describe("isAllowedImage", () => {
  it("allows the artwork hosts next/image is configured for, and our own files", () => {
    expect(isAllowedImage("https://res.cloudinary.com/koncave/image/upload/v1/x")).toBe(true);
    expect(isAllowedImage("https://image.mux.com/abc/thumbnail.webp")).toBe(true);
    expect(isAllowedImage("https://cdn-cf-east.streamable.com/image/x.jpg")).toBe(true);
    expect(isAllowedImage("/placeholder.jpg")).toBe(true);
    expect(isAllowedImage("data:image/png;base64,AAAA")).toBe(true);
  });

  it("refuses any other host, and anything that isn't an address", () => {
    expect(isAllowedImage("https://assets.koncavecinema.com/movies/black-book/portrait.webp")).toBe(
      false,
    );
    expect(isAllowedImage("https://evilcloudinary.com/x.jpg")).toBe(false);
    expect(isAllowedImage("not a url")).toBe(false);
  });
});
