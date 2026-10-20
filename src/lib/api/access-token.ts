/**
 * The access token lives only in this module's memory: never in web storage or a readable
 * cookie. A page reload loses it by design; the session is restored through the API's HttpOnly
 * refresh cookie (see refreshAccessToken in client.ts).
 */

let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  for (const listener of listeners) listener(token);
}

export function onAccessTokenChange(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
