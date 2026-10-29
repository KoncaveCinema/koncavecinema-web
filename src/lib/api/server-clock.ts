/**
 * The difference between the API's clock and this device's, from the `timestamp` every API
 * response carries. Time-critical countdowns (the seat hold) add it to `Date.now()`, so a phone
 * clock that is a few minutes off can't shorten or extend a hold.
 */

let offsetMs = 0;

export function recordServerTime(timestamp: string | undefined): void {
  const server = timestamp ? Date.parse(timestamp) : Number.NaN;
  if (Number.isFinite(server)) offsetMs = server - Date.now();
}

/** Milliseconds to add to the device clock to get the server's time */
export function serverOffset(): number {
  return offsetMs;
}
