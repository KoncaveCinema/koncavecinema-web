/** Where film artwork may come from: the API's Cloudinary posters, then Mux thumbnails and
    storyboards. next.config.ts allows these to next/image; nothing else is optimised. */
export const IMAGE_HOSTS = [
  "res.cloudinary.com",
  "image.mux.com",
  "*.streamable.com",
  "streamable.com",
] as const;

/**
 * True when next/image may load `src`. An image from any other host throws while rendering,
 * which takes the whole page down, so a screen listing artwork it doesn't control checks first.
 */
export function isAllowedImage(src: string): boolean {
  if (src.startsWith("/") || src.startsWith("data:")) return true;
  let hostname: string;
  try {
    hostname = new URL(src).hostname;
  } catch {
    return false;
  }
  return IMAGE_HOSTS.some((host) =>
    host.startsWith("*.") ? hostname.endsWith(host.slice(1)) : hostname === host,
  );
}
