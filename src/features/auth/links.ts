/**
 * The email code screen for an address, returning to `next` once confirmed. `send` has the page
 * send a fresh code on arrival: everywhere but straight after registration, which already sent one
 */
export function verifyEmailHref(email: string, next?: string | null, send = false) {
  const params = new URLSearchParams({ email });
  if (next) params.set("next", next);
  if (send) params.set("send", "1");
  return `/verify-email?${params.toString()}`;
}
