/**
 * The access token lives only in this module's memory: never in web storage or a readable
 * cookie. A page reload loses it by design; the session is restored through the API's HttpOnly
 * refresh cookie (see refreshAccessToken in client.ts).
 */

let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

// Settles the first time the token is set: by the start-up refresh, signed in or not
let markRestored: () => void;
const restored = new Promise<void>((resolve) => {
  markRestored = resolve;
});

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  markRestored();
  for (const listener of listeners) listener(token);
}

/**
 * Resolves once the session has been restored on page load (or someone signed in first), so a
 * request sent at start-up carries the token instead of failing with a 401.
 */
export function whenSessionRestored(): Promise<void> {
  return restored;
}

export function onAccessTokenChange(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
